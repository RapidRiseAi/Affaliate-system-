import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { getAuthenticatedUser, getPortalAdminContext } from '@/lib/portal-auth';
import { adminSupabase } from '@/lib/supabase';

export default async function Page() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) redirect('/partners/login');
  if (!await getPortalAdminContext(authUser)) redirect('/affiliate/dashboard');

  const { data: applications } = await adminSupabase()
    .from('affiliate_portal_partner_applications')
    .select('id,first_name,surname,business_name,email,phone,status,submitted_at')
    .order('submitted_at', { ascending: false });

  return (
    <Shell nav="admin">
      <section className="glass rounded-[2rem] p-8">
        <h1 className="text-4xl font-black">Applicant queue</h1>
        <table className="table mt-6">
          <thead>
            <tr>
              <th>Name</th><th>Business</th><th>Email</th><th>Phone</th>
              <th>Status</th><th>Submitted</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications?.length ? applications.map((application) => (
              <tr key={application.id}>
                <td>{application.first_name} {application.surname}</td>
                <td>{application.business_name}</td>
                <td>{application.email}</td>
                <td>{application.phone}</td>
                <td>{application.status}</td>
                <td>{new Date(application.submitted_at).toLocaleDateString('en-ZA')}</td>
                <td>
                  <Link
                    className="text-sky-300"
                    href={`/admin/affiliates/applicants/${application.id}`}
                  >
                    Open detail
                  </Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7}>No partner applications.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
