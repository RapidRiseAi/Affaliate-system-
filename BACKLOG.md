# Rapid Rise AI — Affiliate System Backlog

Deferred work and known gaps to revisit on the next production-readiness / "find
missing features" review. Spans the three repos: **Affaliate-system-** (portal),
**RRAI-Internal-Tools** (admin + DB owner), **rrai-website-3d** (marketing site).

_Last updated: 2026-07-01_

---

## ⏸️ Deferred by decision

- [ ] **Leaked-password protection** — currently **OFF**. Supabase's built-in
  check is **Pro-plan only** and we're on Free. _Decision 2026-07-01: leave off
  for launch._ Re-enable later by upgrading to Pro, **or** add the **free
  HaveIBeenPwned k-anonymity check in code** (~30 lines in [lib/security.ts](lib/security.ts)
  + the apply & reset-password routes; sends only the first 5 chars of a SHA-1
  hash — privacy-safe, no API key).

> ⚠️ **Do not revert the Supabase email templates.** "Reset Password" and
> "Confirm signup" must use the `token_hash` format pointing at
> `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery|email&next=...`.
> Reverting to `{{ .ConfirmationURL }}` reintroduces the prefetch single-use-token
> bug (links read as "otp_expired").

---

## 🔭 Remaining work

### P2 — scale (do before high volume; fine at current size)
- [ ] **Admin `loadAffiliateOperations` pagination/aggregation.** Click counts and
  the applicant-verification lookup are now efficient ✅, but it still loads full
  `referrals`, `commissions`, `leads`, `quotes`, `projects`, `payments` on every
  /affiliates load. Needs server-side pagination/scoping **plus** SQL aggregation
  for the commission owed/paid totals (can't just cap — totals would be wrong).
  This is a focused refactor with UI changes + testing; intentionally not rushed.

### P2 — polish / growth
- [ ] **Marketing assets — branded banners/graphics.** Copy snippets + QR codes are
  done (Promote page); branded image assets still need design files from the team.
- [ ] **Link management — per-link time-series analytics + bulk create.** Edit,
  delete, and QR are done; remaining: click trends over time + bulk link creation.
- [ ] **In-portal notifications — beyond the activity feed.** A read/unread
  notification center (the chronological activity feed is done).

### Security / advisor follow-ups
- [ ] **Multiple Permissive Policies (×10)** — combine the per-table `*_select_own`
  + `*_admin_select` SELECT policies into one (pattern already used by the
  signatures/payouts hardening migration). Negligible perf gain, live-RLS-rewrite
  risk — deferred deliberately.
- [ ] **~45 remaining unindexed FKs** (INFO) on non-hot-path tables — add
  selectively only if they become hot.
- [ ] **Banking data encryption (optional).** Payout details are in a service-role-
  only table; consider column encryption (pgsodium/Vault) if desired.

---

## ✅ Completed (2026-06-30 → 07-01)

### Launch blockers (P0)
- FK / hot-path **indexes** (commissions, referrals, quotes, quote_items, activity_logs) — live.
- **Password reset + resend-verification** — built, deployed, **verified end-to-end**.
- Prefetch-proof **`token_hash` confirm flow** (`/auth/confirm` + `/auth/verify-otp`).
- **portalOrigin()** fix so auth links target the portal, not the marketing site.
- **Attribution window** unified to **90 days** (website ↔ server).
- **Rate limiting** (Upstash, fail-open) — portal auth/apply + website track/intent (both deployed).
- **Migration consolidation** — RRAI-Internal-Tools is sole owner; duplicates removed; ownership docs in all three repos.
- **Query optimization** — click counts as SQL views; applicant verification via RPC (dropped the listUsers 1000-user ceiling).
- **Mobile login** layout (form first); **SMTP** via verified `team@`; sender identity standardized.
- Confirmed **files already use object storage** (no change needed).

### Security (all applied to live DB + advisor-verified)
- **CRITICAL:** locked down `expenses`/`payroll_items`/`payroll_runs`/`vendors` — they were world-open via the public anon key (always-true RLS + public grants).
- **Least-privilege**: revoked all anon/authenticated grants on every base CRM table (kept `affiliate_portal_*`).
- **SECURITY DEFINER RPCs** (`accept_quote_atomic`, `convert_lead_to_client_atomic`, `rls_auto_enable`) — revoked from anon/authenticated **and PUBLIC**; service-role only.
- **`set_updated_at`** pinned `search_path`.
- Remaining advisor WARN: only leaked-password protection (Free-plan, deferred above).

### P1 — trust / money
- **Payout/banking capture** — portal settings form (SA bank + tax + PayPal) → secure service-role API → admin "Payout details on file" view.
- **fraud_flag setter** — admin RPC + review UI (flag/unflag, audited); flagged attributions excluded from admin stats.
- **PDF/statement export** — print-optimized agreement + commission-statement pages with "Download PDF".

### P2 — polish
- **Approval email** — now includes tracking code, portal link, and the sign-agreement next step.
- **Link management** — edit reference/notes, delete (history-preserving), per-link QR codes.
- **Promote page** — primary referral link, ready-to-send copy snippets, QR code.
- **Activity feed** — in-portal timeline of referrals, commissions, agreement.
- **Docs** — `affiliate-integration.md` refreshed (live status, 90-day window, resolved decisions); ownership READMEs added.
