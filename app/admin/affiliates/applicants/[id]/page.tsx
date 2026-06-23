import { notFound, redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser, getPortalAdminContext } from '@/lib/portal-auth';
import { slugifyCode } from '@/lib/security';
import { adminSupabase } from '@/lib/supabase';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  if (!await getPortalAdminContext(authUser)) redirect('/affiliate/dashboard');

  const { id } = await params;
  const admin = adminSupabase();
  const { data: application } = await admin
    .from('affiliate_portal_partner_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!application) notFound();

  const [{ data: authRecord }, { data: affiliates }, { data: mappings }] = await Promise.all([
    admin.auth.admin.getUserById(application.auth_user_id),
    admin.from('affiliates').select('id,name,email,tracking_code,status').order('name'),
    admin.from('affiliate_portal_user_links').select('affiliate_id').not('affiliate_id', 'is', null),
  ]);
  const mappedAffiliateIds = new Set(
    (mappings ?? []).flatMap(({ affiliate_id }) => affiliate_id ? [affiliate_id] : []),
  );
  const availableAffiliates = (affiliates ?? []).filter(
    (affiliate) => !mappedAffiliateIds.has(affiliate.id),
  );
  const emailVerified = Boolean(authRecord.user?.email_confirmed_at);
  const suggestedTrackingCode = slugifyCode(
    `${application.first_name}-${application.surname}`,
  ) || `partner-${application.id.slice(0, 6)}`;

  return (
    <Shell nav="admin">
      <section className="glass rounded-[2rem] p-8">
        <div className="flex flex-wrap gap-2">
          <span className="badge">{application.status}</span>
          <span className="badge">
            {emailVerified ? 'Email verified' : 'Email not verified'}
          </span>
        </div>
        <h1 className="mt-4 text-4xl font-black">
          {application.first_name} {application.surname}
        </h1>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="card"><strong>Business</strong><p>{application.business_name}</p></div>
          <div className="card"><strong>Contact</strong><p>{application.email}<br/>{application.phone}</p></div>
          <div className="card"><strong>Client types</strong><p>{application.client_types}</p></div>
          <div className="card"><strong>Motivation</strong><p>{application.motivation}</p></div>
        </div>
        {application.status === 'pending_review' ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <form action={`/api/admin/applications/${id}/approve`} method="post" className="card">
              <input type="hidden" name="approval_mode" value="create"/>
              <h2 className="text-xl font-bold">Create new CRM affiliate</h2>
              <p className="mt-2 text-sm text-slate-400">
                Creates a new CRM record only after email verification succeeds.
              </p>
              <input
                className="input mt-4"
                name="new_tracking_code"
                defaultValue={suggestedTrackingCode}
                pattern="[a-z0-9][a-z0-9-]{3,39}"
                required
              />
              <button className="btn btn-primary mt-4" disabled={!emailVerified}>
                Create and approve
              </button>
            </form>
            <form action={`/api/admin/applications/${id}/approve`} method="post" className="card">
              <input type="hidden" name="approval_mode" value="link"/>
              <h2 className="text-xl font-bold">Link existing CRM affiliate</h2>
              <p className="mt-2 text-sm text-slate-400">
                Requires an explicit, currently unmapped CRM affiliate selection.
              </p>
              <select className="input mt-4" name="selected_affiliate_id" required>
                <option value="">Choose an affiliate</option>
                {availableAffiliates.map((affiliate) => (
                  <option key={affiliate.id} value={affiliate.id}>
                    {affiliate.name} — {affiliate.tracking_code} ({affiliate.email})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary mt-4"
                disabled={!emailVerified || availableAffiliates.length === 0}
              >
                Link and approve
              </button>
            </form>
            <form action={`/api/admin/applications/${id}/decline`} method="post" className="card lg:col-span-2">
              <h2 className="text-xl font-bold">Decline application</h2>
              <input
                className="input mt-4"
                name="reason"
                placeholder="Required decline reason"
                required
              />
              <button className="btn btn-muted mt-4">Decline</button>
            </form>
          </div>
        ) : null}
      </section>
    </Shell>
  );
}
