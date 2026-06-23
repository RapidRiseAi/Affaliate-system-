import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const ids = {
  affiliateUser: '10000000-0000-4000-8000-000000000001',
  adminUser: '10000000-0000-4000-8000-000000000002',
  unrelatedUser: '10000000-0000-4000-8000-000000000003',
  verifiedApplicant: '10000000-0000-4000-8000-000000000004',
  unverifiedApplicant: '10000000-0000-4000-8000-000000000005',
  adminRole: '20000000-0000-4000-8000-000000000001',
  crmAdmin: '30000000-0000-4000-8000-000000000001',
  affiliateA: '40000000-0000-4000-8000-000000000001',
  affiliateB: '40000000-0000-4000-8000-000000000002',
  linkA: '50000000-0000-4000-8000-000000000001',
  linkB: '50000000-0000-4000-8000-000000000002',
  applicationVerified: '60000000-0000-4000-8000-000000000001',
  applicationUnverified: '60000000-0000-4000-8000-000000000002',
  lead: '70000000-0000-4000-8000-000000000001',
  session: '80000000-0000-4000-8000-000000000001',
  commission: '90000000-0000-4000-8000-000000000001',
};

const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;

  create function auth.uid()
  returns uuid
  language sql
  stable
  as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  create table auth.users (
    id uuid primary key,
    email text,
    email_confirmed_at timestamptz
  );

  create table public.roles (
    id uuid primary key,
    name text not null unique,
    permissions jsonb not null default '[]'::jsonb
  );
  create table public.users (
    id uuid primary key,
    role_id uuid not null references public.roles(id),
    status text not null,
    name text not null,
    email text not null
  );
  create table public.affiliates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    tracking_code text not null unique,
    status text not null default 'ACTIVE',
    default_commission_type text not null default 'ONCE_OFF',
    default_commission_rate integer not null default 10,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create table public.leads (id uuid primary key);
  create table public.referrals (
    id uuid primary key default gen_random_uuid(),
    affiliate_id uuid not null references public.affiliates(id),
    lead_id uuid references public.leads(id),
    client_id uuid,
    status text not null default 'PENDING',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create table public.payments (id uuid primary key);
  create table public.commissions (
    id uuid primary key,
    affiliate_id uuid not null references public.affiliates(id),
    amount_cents integer not null,
    commission_type text not null default 'ONCE_OFF',
    status text not null default 'PENDING',
    paid_at timestamptz
  );
  create table public.quotes (id uuid primary key);
  create table public.projects (id uuid primary key);
  create table public.invoices (id uuid primary key);

  insert into public.roles (id,name,permissions) values
    ('${ids.adminRole}','Owner/Admin','["settings:manage"]');
`);

const migration = await readFile(
  new URL('../supabase/migrations/0001_affiliate_system.sql', import.meta.url),
  'utf8',
);
await db.exec(migration);

await db.exec(`
  insert into auth.users (id,email,email_confirmed_at) values
    ('${ids.affiliateUser}','affiliate@example.com',now()),
    ('${ids.adminUser}','admin@example.com',now()),
    ('${ids.unrelatedUser}','unrelated@example.com',now()),
    ('${ids.verifiedApplicant}','verified@example.com',now()),
    ('${ids.unverifiedApplicant}','unverified@example.com',null);

  insert into public.users (id,role_id,status,name,email) values
    ('${ids.crmAdmin}','${ids.adminRole}','ACTIVE','CRM Admin','admin@example.com');
  insert into public.affiliates (id,name,email,tracking_code,status) values
    ('${ids.affiliateA}','Affiliate A','affiliate-a@example.com','affiliate-a','ACTIVE'),
    ('${ids.affiliateB}','Affiliate B','affiliate-b@example.com','affiliate-b','ACTIVE');
  insert into public.commissions (
    id,affiliate_id,amount_cents,commission_type,status
  ) values (
    '${ids.commission}','${ids.affiliateA}',1000,'ONCE_OFF','APPROVED'
  );

  insert into public.affiliate_portal_user_links
    (auth_user_id,affiliate_id,crm_user_id)
  values
    ('${ids.affiliateUser}','${ids.affiliateA}',null),
    ('${ids.adminUser}',null,'${ids.crmAdmin}');

  insert into public.affiliate_portal_tracking_links
    (id,affiliate_id,tracking_token,destination_url,private_reference,channel)
  values
    ('${ids.linkA}','${ids.affiliateA}','token-a','/contact','A','Email'),
    ('${ids.linkB}','${ids.affiliateB}','token-b','/contact','B','Email');

  insert into public.affiliate_portal_partner_applications (
    id,auth_user_id,first_name,surname,business_name,email,phone,
    client_types,motivation,terms_accepted_at
  ) values
    ('${ids.applicationVerified}','${ids.verifiedApplicant}','Verified','Applicant','Verified Co','verified@example.com','123456','SMB','Partner',now()),
    ('${ids.applicationUnverified}','${ids.unverifiedApplicant}','Unverified','Applicant','Unverified Co','unverified@example.com','123456','SMB','Partner',now());

  insert into public.leads (id) values ('${ids.lead}');
  insert into public.affiliate_portal_referral_sessions (
    session_id,affiliate_id,tracking_link_id,attribution_expires_at
  ) values (
    '${ids.session}','${ids.affiliateA}','${ids.linkA}',now() + interval '1 day'
  );
`);

async function queryAs(role, userId, sql, params = []) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}`);
    await db.query(
      "select set_config('request.jwt.claim.sub', $1, true)",
      [userId ?? ''],
    );
    const result = await db.query(sql, params);
    await db.exec('rollback');
    return result.rows;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}

async function expectDenied(work, label) {
  await assert.rejects(work, undefined, label);
}

const privilegeRows = (await db.query(`
  select
    has_schema_privilege('authenticated','affiliate_portal_private','usage') as authenticated_schema_usage,
    has_schema_privilege('anon','affiliate_portal_private','usage') as anon_schema_usage,
    has_function_privilege('authenticated','affiliate_portal_private.owns_affiliate(uuid)','execute') as authenticated_owns_execute,
    has_function_privilege('authenticated','affiliate_portal_private.is_crm_admin()','execute') as authenticated_admin_execute,
    has_function_privilege('authenticated','affiliate_portal_private.owns_crm_referral(uuid)','execute') as authenticated_referral_execute,
    has_function_privilege('authenticated','affiliate_portal_private.owns_commission(uuid)','execute') as authenticated_commission_execute,
    has_function_privilege('authenticated','affiliate_portal_private.set_updated_at()','execute') as authenticated_trigger_execute,
    has_function_privilege('anon','affiliate_portal_private.owns_affiliate(uuid)','execute') as anon_owns_execute
`)).rows[0];
assert.deepEqual(privilegeRows, {
  authenticated_schema_usage: true,
  anon_schema_usage: false,
  authenticated_owns_execute: true,
  authenticated_admin_execute: true,
  authenticated_referral_execute: true,
  authenticated_commission_execute: true,
  authenticated_trigger_execute: false,
  anon_owns_execute: false,
});

const affiliateRows = await queryAs(
  'authenticated',
  ids.affiliateUser,
  'select id from public.affiliate_portal_tracking_links order by id',
);
assert.deepEqual(affiliateRows.map(({ id }) => id), [ids.linkA]);

await expectDenied(
  () => queryAs(
    'authenticated',
    ids.affiliateUser,
    `insert into public.affiliate_portal_tracking_links
      (affiliate_id,tracking_token,destination_url,private_reference,channel)
      values ($1,'forbidden','/contact','X','Email')`,
    [ids.affiliateB],
  ),
  'affiliate cannot insert a link for another affiliate',
);

const adminRows = await queryAs(
  'authenticated',
  ids.adminUser,
  'select id from public.affiliate_portal_tracking_links order by id',
);
assert.equal(adminRows.length, 2);

const unrelatedRows = await queryAs(
  'authenticated',
  ids.unrelatedUser,
  'select id from public.affiliate_portal_tracking_links',
);
assert.equal(unrelatedRows.length, 0);

await expectDenied(
  () => queryAs('anon', null, 'select id from public.affiliate_portal_tracking_links'),
  'anon cannot read portal tables',
);
await expectDenied(
  () => queryAs(
    'authenticated',
    ids.affiliateUser,
    'select affiliate_portal_private.set_updated_at()',
  ),
  'trigger function is not directly executable',
);

const linkedApproval = await queryAs(
  'authenticated',
  ids.adminUser,
  `select * from public.affiliate_portal_approve_application($1,'link',$2,null)`,
  [ids.applicationVerified, ids.affiliateB],
);
assert.deepEqual(linkedApproval, [{
  affiliate_id: ids.affiliateB,
  tracking_code: 'affiliate-b',
}]);

await expectDenied(
  () => queryAs(
    'authenticated',
    ids.adminUser,
    `select * from public.affiliate_portal_approve_application($1,'create',null,'unverified-new')`,
    [ids.applicationUnverified],
  ),
  'unverified applicant cannot be approved',
);

await db.exec(`
  create function public.test_fail_approval_audit()
  returns trigger language plpgsql as $$
  begin
    if new.action_type = 'approve_application' then
      raise exception 'forced audit failure';
    end if;
    return new;
  end $$;
  create trigger test_fail_approval_audit
  before insert on public.affiliate_portal_audit_events
  for each row execute function public.test_fail_approval_audit();
`);
await expectDenied(
  () => queryAs(
    'authenticated',
    ids.adminUser,
    `select * from public.affiliate_portal_approve_application($1,'create',null,'atomic-test')`,
    [ids.applicationVerified],
  ),
  'approval audit failure rolls back the transaction',
);
const atomicRows = (await db.query(`
  select
    (select count(*)::int from public.affiliates where tracking_code='atomic-test') as affiliates,
    (select count(*)::int from public.affiliate_portal_user_links where auth_user_id='${ids.verifiedApplicant}') as mappings,
    (select status::text from public.affiliate_portal_partner_applications where id='${ids.applicationVerified}') as status
`)).rows[0];
assert.deepEqual(atomicRows, { affiliates: 0, mappings: 0, status: 'pending_review' });
await db.exec('drop trigger test_fail_approval_audit on public.affiliate_portal_audit_events');
await db.exec('drop function public.test_fail_approval_audit()');

const referralRows = await queryAs(
  'service_role',
  null,
  'select * from public.affiliate_portal_record_tracked_referral($1,$2)',
  [ids.lead, ids.session],
);
assert.equal(referralRows.length, 1);

const snapshotRows = await queryAs(
  'service_role',
  null,
  'select public.affiliate_portal_record_commission_snapshot($1,10000,10,null)',
  [ids.commission],
);
assert.equal(snapshotRows.length, 1);

console.log(JSON.stringify({
  helperPrivileges: 'passed',
  authenticatedAffiliate: 'passed',
  authenticatedAdmin: 'passed',
  unrelatedAuthenticatedUser: 'passed',
  anon: 'passed',
  verifiedEmailGate: 'passed',
  explicitAffiliateSelection: 'passed',
  atomicApprovalRollback: 'passed',
  trackedReferralTransaction: 'passed',
  commissionSnapshotMapping: 'passed',
}));
await db.close();
