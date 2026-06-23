import 'server-only';

import type { User } from '@supabase/supabase-js';
import { adminSupabase, serverSupabase } from '@/lib/supabase';

export type PortalAffiliateContext = {
  authUser: User;
  affiliate: {
    id: string;
    name: string;
    email: string;
    tracking_code: string;
    status: string;
    default_commission_type: string;
    default_commission_rate: number;
  };
};

export async function getAuthenticatedUser() {
  const supabase = await serverSupabase();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function getPortalAffiliateContext(
  authUser: User | null = null,
): Promise<PortalAffiliateContext | null> {
  const user = authUser ?? await getAuthenticatedUser();
  if (!user) return null;

  const admin = adminSupabase();
  const { data: link, error: linkError } = await admin
    .from('affiliate_portal_user_links')
    .select('affiliate_id')
    .eq('auth_user_id', user.id)
    .not('affiliate_id', 'is', null)
    .maybeSingle();

  if (linkError || !link?.affiliate_id) return null;

  const { data: affiliate, error: affiliateError } = await admin
    .from('affiliates')
    .select(
      'id,name,email,tracking_code,status,default_commission_type,default_commission_rate',
    )
    .eq('id', link.affiliate_id)
    .maybeSingle();

  if (affiliateError || !affiliate || affiliate.status !== 'ACTIVE') return null;
  return { authUser: user, affiliate };
}

export function formatZar(cents: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}
