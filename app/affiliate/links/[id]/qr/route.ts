import QRCode from 'qrcode';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

// Auth-gated QR image for an affiliate's own tracking link. Generated server-side
// (qrcode is never sent to the browser bundle), so the referral URL is never
// handed to a third-party QR service — matching the system's privacy stance.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) return new Response('Unauthorized', { status: 401 });
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return new Response('Forbidden', { status: 403 });

  const { id } = await params;
  const { data: link } = await adminSupabase()
    .from('affiliate_portal_tracking_links')
    .select('tracking_token,destination_url')
    .eq('id', id)
    .eq('affiliate_id', context.affiliate.id)
    .maybeSingle();
  if (!link) return new Response('Not found', { status: 404 });

  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  const dest = link.destination_url === '/' ? '' : link.destination_url.replace(/^\/+/, '/');
  const url = `${siteOrigin}/r/${encodeURIComponent(context.affiliate.tracking_code)}/${encodeURIComponent(link.tracking_token)}${dest}`;

  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 320 });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': `inline; filename="qr-${link.tracking_token}.svg"`,
    },
  });
}
