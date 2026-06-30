# Rapid Rise AI — Affiliate System Backlog

Deferred work and known gaps to revisit on the next production-readiness / "find
missing features" review. Spans the three repos: **Affaliate-system-** (portal),
**RRAI-Internal-Tools** (admin + DB owner), **rrai-website-3d** (marketing site).

_Last updated: 2026-07-01_

---

## ⏸️ Deferred by decision

- [ ] **Leaked-password protection** — currently **OFF**. Supabase's built-in
  check is **Pro-plan only** and we're on Free. _Decision 2026-07-01: leave off
  for launch._ Two ways to get it back when ready:
  - Upgrade Supabase to Pro (toggle in Auth → Email provider), **or**
  - Add the **free HaveIBeenPwned k-anonymity check in code** (~30 lines in
    [lib/security.ts](lib/security.ts) + the apply & reset-password routes). Sends
    only the first 5 chars of a SHA-1 hash — privacy-safe, no API key. Gives the
    same protection on the Free plan.

---

## 🔧 Config to finish / verify (no code — dashboards)

- [x] **Custom SMTP (Resend) in Supabase Auth** — done; reset/verification emails
  deliver via `smtp.resend.com`.
- [x] **Upstash env vars** set in both Vercel projects.
- [x] **NEXT_PUBLIC_PORTAL_URL** = `https://affiliates.rapidriseai.com` in portal.
- [x] **End-to-end password-reset test** — passed in production (2026-07-01).
- [ ] (website) Confirm Upstash vars present + redeploy so `/api/track` + `/api/intent`
  rate limiting is active (portal already verified).

> ⚠️ **Do not revert the Supabase email templates.** "Reset Password" and
> "Confirm signup" must use the `token_hash` format pointing at
> `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery|email&next=...`.
> Switching back to `{{ .ConfirmationURL }}` reintroduces the prefetch
> single-use-token bug (links read as "otp_expired").

---

## 🚧 Remaining P0 — DONE

- [x] **Query optimization (click counts)** — per-affiliate + per-link click counts
  are now SQL views; portal links page and admin no longer pull raw click rows.
  (Deeper admin `loadAffiliateOperations` pagination/aggregation remains — see P2.)
- [x] **Migration consolidation** — **RRAI-Internal-Tools** is now the sole owner;
  it holds the complete set (incl. `0001`), the portal's `supabase/migrations` was
  removed, and all three repos have ownership notes. No live-DB change was needed.
  Optional fresh-rebuild rename + `migration repair` runbook is in the owner repo's
  `supabase/MIGRATIONS.md`.

---

## 💰 P1 — trust / money

- [ ] **Affiliate payout/banking details capture** — no UI today; payouts rely on
  out-of-band info. Settings page only holds notification prefs.
- [ ] **fraud_flag setter** — column + admin read exist, but no RPC/UI to flag a
  fraudulent attribution or exclude it from commissions.
- [ ] **PDF export** — signed-agreement PDF + commission/payout statement for
  affiliates (record-keeping / trust).
- [ ] **Sender-identity consistency** — README uses `partners@`, code defaults to
  `team@`; pick one verified domain identity.

---

## ✨ P2 — polish / growth

- [ ] **Marketing assets** for affiliates (banners, copy snippets, QR codes).
- [ ] **In-portal notifications / activity feed** (email-only today).
- [ ] **Link management** — edit reference/notes, delete (not just pause),
  per-link time-series analytics, QR codes, bulk create.
- [ ] **Approval email** — include the tracking code, a portal link, and the
  "sign your agreement" next step ([RRAI-Internal-Tools/lib/actions.ts] approve).
- [ ] **Admin `loadAffiliateOperations` scale** — click counts are now SQL views ✅,
  but it still loads full `referrals`, `commissions`, `leads`, `quotes`, `projects`,
  `payments` + `auth.admin.listUsers({perPage:1000})` on every /affiliates load.
  Needs pagination/scoping + SQL aggregation for commission owed/paid totals
  (can't just cap — the totals would be wrong). Fine at current size; do before scale.

---

## 🔗 Cross-project / docs hygiene

- [ ] **Dead redirect route** — portal's own `app/r/[code]/[token]/route.ts` is
  unused (links resolve on the website). Remove it, or repoint links. (Attribution
  window already unified to 90 days.)
- [ ] **Stale docs** — `rrai-website-3d/docs/affiliate-integration.md` says the
  website migration is "NOT applied" (it is); resolve the `[CONFIRM]` business
  decisions noted there.

---

## 🛡️ Security / advisor follow-ups (Supabase advisor, 2026-06-30)

- [ ] **Multiple Permissive Policies (×10)** — combine the per-table `*_select_own`
  + `*_admin_select` SELECT policies into one (the signatures/payouts hardening
  migration already shows the pattern). Minor RLS perf.
- [ ] **function_search_path_mutable** on `public.set_updated_at` — set
  `search_path = ''`.
- [ ] **RLS "always true"** on `public.expenses`, `payroll_items`, `payroll_runs`,
  `vendors` (internal-tools) — verify these aren't exposed to `anon`/`authenticated`;
  tighten if so. Sensitive (payroll/expenses).
- [ ] **~45 remaining unindexed FKs** (INFO) on non-hot-path tables — add
  selectively only if they become hot.

---

## ✅ Completed (2026-06-30 → 07-01) — for context on the next review

- FK / hot-path **indexes** on commissions, referrals, quotes, quote_items,
  activity_logs — **applied to live DB**.
- **Locked down** anon/authenticated-executable SECURITY DEFINER CRM RPCs
  (`accept_quote_atomic`, `convert_lead_to_client_atomic`, `rls_auto_enable`) —
  **applied to live DB**.
- **Password reset + resend-verification** flows in the portal.
- **portalOrigin()** fix so auth callbacks target the portal, not the marketing site.
- **Attribution window** unified to **90 days** (website ↔ server).
- **Rate limiting** (Upstash, fail-open) on portal auth/apply + website track/intent.
- Confirmed **files already use object storage** (Supabase Storage), not DB rows —
  no change needed.
