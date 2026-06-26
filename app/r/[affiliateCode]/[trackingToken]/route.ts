import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ affiliateCode: string; trackingToken: string }> },
) {
  const { affiliateCode, trackingToken } = await params;
  const supabase = adminSupabase();

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id,tracking_code,status')
    .eq('tracking_code', affiliateCode)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.redirect(new URL('/partners?ref=invalid', req.url));
  }

  const { data: link } = await supabase
    .from('affiliate_portal_tracking_links')
    .select('id,affiliate_id,destination_url,is_active,expires_at')
    .eq('affiliate_id', affiliate.id)
    .eq('tracking_token', trackingToken)
    .eq('is_active', true)
    .maybeSingle();

  if (!link || (link.expires_at && new Date(link.expires_at) <= new Date())) {
    return NextResponse.redirect(new URL('/partners?ref=invalid', req.url));
  }

  const sessionId = crypto.randomUUID();
  const firstClickAt = new Date();
  const attributionExpiresAt = new Date(firstClickAt.getTime() + 90 * 86_400_000);

  const [clickResult, sessionResult] = await Promise.all([
    supabase.from('affiliate_portal_click_events').insert({
      tracking_link_id: link.id,
      affiliate_id: affiliate.id,
      session_id: sessionId,
      landing_page: link.destination_url,
      referrer: req.headers.get('referer'),
    }),
    supabase.from('affiliate_portal_referral_sessions').insert({
      session_id: sessionId,
      affiliate_id: affiliate.id,
      tracking_link_id: link.id,
      first_click_at: firstClickAt.toISOString(),
      last_click_at: firstClickAt.toISOString(),
      attribution_expires_at: attributionExpiresAt.toISOString(),
    }),
  ]);

  if (clickResult.error || sessionResult.error) {
    console.error('Affiliate attribution event could not be fully recorded', {
      click: clickResult.error?.code,
      session: sessionResult.error?.code,
    });
  }

  const destination = new URL(
    link.destination_url,
    process.env.NEXT_PUBLIC_SITE_URL || req.url,
  );
  destination.searchParams.set('ref', affiliateCode);
  destination.searchParams.set('utm_affiliate_link', trackingToken);
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    'rrai_ref',
    JSON.stringify({
      affiliateCode,
      trackingToken,
      sessionId,
      firstClickAt: firstClickAt.toISOString(),
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(req.url).protocol === 'https:',
      maxAge: 90 * 86_400,
      path: '/',
    },
  );
  return response;
}
