import QRCode from 'qrcode';
import { getAuthenticatedUser, getPortalAffiliateContext } from '@/lib/portal-auth';

// QR for the affiliate's primary referral link. Generated server-side so the URL
// never goes to a third-party QR service.
export async function GET(req: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) return new Response('Unauthorized', { status: 401 });
  const context = await getPortalAffiliateContext(authUser);
  if (!context) return new Response('Forbidden', { status: 403 });

  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  const url = `${siteOrigin}/r/${encodeURIComponent(context.affiliate.tracking_code)}`;

  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 360 });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': `inline; filename="qr-${context.affiliate.tracking_code}.svg"`,
    },
  });
}
