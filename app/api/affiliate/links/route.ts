import { NextResponse } from 'next/server';
import { z } from 'zod';
import { channels, destinations } from '@/lib/constants';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { containsPrivateData, randomToken, slugifyCode } from '@/lib/security';
import {
  hasTrustedOrigin,
  logServerError,
  publicApiError,
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
  if (!hasTrustedOrigin(req)) {
    return publicApiError('invalid_origin', 403, 'Request origin was rejected.');
  }
  const authUser = await getAuthenticatedUser();
  if (!authUser) return publicApiError('authentication_required', 401, 'Authentication required.');

  const context = await getPortalAffiliateContext(authUser);
  if (!context) return publicApiError('affiliate_required', 403, 'Active affiliate access required.');

  const parsed = linkSchema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid tracking-link details' }, { status: 400 });
  }
  if (!destinationValues.has(parsed.data.destination_url)) {
    return NextResponse.json({ error: 'Destination is not allowed' }, { status: 400 });
  }
  if (!channelValues.has(parsed.data.channel)) {
    return NextResponse.json({ error: 'Channel is not allowed' }, { status: 400 });
  }
  if (parsed.data.custom_alias && containsPrivateData(parsed.data.custom_alias)) {
    return NextResponse.json(
      { error: 'Custom aliases cannot contain private or sensitive data.' },
      { status: 400 },
    );
  }

  const customAlias = parsed.data.custom_alias
    ? slugifyCode(parsed.data.custom_alias)
    : null;
  const trackingToken = customAlias || randomToken();
  if (trackingToken.length < 4) {
    return NextResponse.json({ error: 'Custom alias is too short' }, { status: 400 });
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
    return publicApiError('tracking_link_failed', 409, 'Tracking link could not be created.');
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
