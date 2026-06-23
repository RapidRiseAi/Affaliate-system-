import { NextResponse } from 'next/server';
import { z } from 'zod';
import { channels, destinations } from '@/lib/constants';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { containsPrivateData, randomToken, slugifyCode } from '@/lib/security';
import {
  hasTrustedOrigin,
  logServerError,
} from '@/lib/server-security';
import { adminSupabase } from '@/lib/supabase';

const destinationValues = new Set(destinations.map(({ value }) => value));
const channelValues = new Set(channels);

const linkSchema = z.object({
  destination_url: z.string().trim(),
  private_reference: z.string().trim().min(1).max(250),
  channel: z.string().trim(),
  custom_alias: z.string().trim().max(64),
  notes: z.string().trim().max(2000),
});

export async function POST(req: Request) {
  const fail = (code: string) => {
    const target = new URL('/affiliate/links', req.url);
    target.searchParams.set('error', code);
    return NextResponse.redirect(target, 303);
  };
  if (!hasTrustedOrigin(req)) {
    return fail('invalid');
  }
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.redirect(new URL('/partners/login', req.url), 303);

  const context = await getPortalAffiliateContext(authUser);
  if (!context) return NextResponse.redirect(new URL('/affiliate/dashboard', req.url), 303);

  const parsed = linkSchema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) {
    return fail('invalid');
  }
  if (!destinationValues.has(parsed.data.destination_url)) {
    return fail('invalid');
  }
  if (!channelValues.has(parsed.data.channel)) {
    return fail('invalid');
  }
  if (parsed.data.custom_alias && containsPrivateData(parsed.data.custom_alias)) {
    return fail('invalid');
  }

  const customAlias = parsed.data.custom_alias
    ? slugifyCode(parsed.data.custom_alias)
    : null;
  const trackingToken = customAlias || randomToken();
  if (trackingToken.length < 4) {
    return fail('invalid');
  }

  const supabase = adminSupabase();
  const { error: insertError } = await supabase
    .from('affiliate_portal_tracking_links')
    .insert({
      affiliate_id: context.affiliate.id,
      tracking_token: trackingToken,
      destination_url: parsed.data.destination_url,
      private_reference: parsed.data.private_reference,
      channel: parsed.data.channel,
      notes: parsed.data.notes || null,
      custom_alias: customAlias,
    });

  if (insertError) {
    logServerError('affiliate_tracking_link_insert_failed', insertError);
    return fail('duplicate');
  }

  const { error: auditError } = await supabase.from('affiliate_portal_audit_events').insert({
    actor_auth_user_id: authUser.id,
    affiliate_id: context.affiliate.id,
    action_type: 'create_tracking_link',
    entity_type: 'affiliate_portal_tracking_link',
    entity_id: trackingToken,
    new_value: {
      destination_url: parsed.data.destination_url,
      channel: parsed.data.channel,
    },
  });
  if (auditError) logServerError('affiliate_tracking_link_audit_failed', auditError);

  const redirectUrl = new URL('/affiliate/links', req.url);
  redirectUrl.searchParams.set('created', trackingToken);
  return NextResponse.redirect(redirectUrl, 303);
}
