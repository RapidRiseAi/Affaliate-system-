import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(
  new URL('../supabase/migrations/0001_affiliate_system.sql', import.meta.url),
  'utf8',
);
const applicationCode = await Promise.all([
  '../app/api/partners/apply/route.ts',
  '../app/api/admin/applications/[id]/approve/route.ts',
  '../app/r/[affiliateCode]/[trackingToken]/route.ts',
  '../lib/security.ts',
].map(async (path) => readFile(new URL(path, import.meta.url), 'utf8')));

const tables = [
  'affiliate_portal_user_links',
  'affiliate_portal_partner_applications',
  'affiliate_portal_tracking_links',
  'affiliate_portal_click_events',
  'affiliate_portal_referral_sessions',
  'affiliate_portal_lead_attributions',
  'affiliate_portal_commission_snapshots',
  'affiliate_portal_audit_events',
];
for (const table of tables) {
  assert.match(sql, new RegExp(`create table public\\.${table}\\b`, 'i'));
  assert.match(
    sql,
    new RegExp(`alter table public\\.${table} enable row level security`, 'i'),
  );
}
for (const table of ['affiliates', 'leads', 'payments', 'commissions']) {
  assert.doesNotMatch(
    sql,
    new RegExp(`create\\s+table\\s+(public\\.)?${table}\\b`, 'i'),
  );
}

const policies = sql.match(/create policy[\s\S]*?;/gi) ?? [];
assert.ok(policies.length >= 16);
for (const policy of policies) assert.match(policy, /\bto\s+authenticated\b/i);
for (const policy of policies.filter((value) => /\bfor\s+update\b/i.test(value))) {
  assert.match(policy, /\busing\s*\(/i);
  assert.match(policy, /\bwith\s+check\s*\(/i);
}

assert.match(sql, /grant usage on schema affiliate_portal_private to authenticated/i);
for (const helper of [
  'owns_affiliate\\(uuid\\)',
  'is_crm_admin\\(\\)',
  'owns_crm_referral\\(uuid\\)',
  'owns_commission\\(uuid\\)',
]) {
  assert.match(
    sql,
    new RegExp(`grant execute on function affiliate_portal_private\\.${helper}\\s+to authenticated`, 'i'),
  );
}
assert.doesNotMatch(
  sql,
  /grant execute on function affiliate_portal_private\.set_updated_at\(\)\s+to authenticated/i,
);
assert.match(
  sql,
  /revoke all on function affiliate_portal_private\.set_updated_at\(\)[\s\S]*?from public, anon, authenticated, service_role/i,
);

for (const functionBody of sql.match(/create function[\s\S]*?\$function\$;/gi) ?? []) {
  assert.match(functionBody, /set search_path = ''/i);
}
assert.match(sql, /auth_user\.email_confirmed_at is not null/i);
assert.match(sql, /p_approval_mode = 'create'/i);
assert.match(sql, /p_approval_mode = 'link'/i);
assert.match(sql, /selected CRM affiliate is already mapped/i);
assert.match(
  sql,
  /grant execute on function public\.affiliate_portal_approve_application[\s\S]*?to authenticated/i,
);
assert.match(
  sql,
  /grant execute on function public\.affiliate_portal_record_tracked_referral[\s\S]*?to service_role/i,
);
assert.doesNotMatch(sql, /ip_hash|user_agent_hash/i);
assert.doesNotMatch(sql, /user_metadata|raw_user_meta_data/i);

const code = applicationCode.join('\n');
assert.doesNotMatch(code, /auth\.admin\.createUser|email_confirm\s*:/i);
assert.doesNotMatch(code, /sha256|ip_hash|user_agent_hash/i);
assert.doesNotMatch(code, /\.eq\(['"]email['"],\s*application\.email\)/i);
assert.match(code, /auth\.signUp\(/i);
assert.match(code, /affiliate_portal_approve_application/i);

for (const requiredIndex of [
  'affiliate_portal_user_links_created_by_idx',
  'affiliate_portal_applications_reviewer_idx',
  'affiliate_portal_click_events_tracking_link_idx',
  'affiliate_portal_click_events_affiliate_time_idx',
  'affiliate_portal_referral_sessions_tracking_link_idx',
  'affiliate_portal_lead_attributions_tracking_link_idx',
  'affiliate_portal_lead_attributions_session_idx',
  'affiliate_portal_lead_attributions_actor_idx',
  'affiliate_portal_commission_snapshots_actor_idx',
  'affiliate_portal_audit_events_auth_actor_idx',
  'affiliate_portal_audit_events_crm_actor_idx',
  'affiliate_portal_audit_events_affiliate_idx',
]) {
  assert.match(sql, new RegExp(`create (?:unique )?index ${requiredIndex}\\b`, 'i'));
}

console.log(JSON.stringify({
  tables: tables.length,
  policies: policies.length,
  privatePolicyHelpers: 4,
  atomicApproval: true,
  verifiedEmailGate: true,
  telemetryHashesStored: false,
  replacementCrmTables: 0,
  status: 'passed',
}));
