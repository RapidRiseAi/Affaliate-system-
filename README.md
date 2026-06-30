# Rapid Rise AI Affiliate System

Next.js App Router affiliate-facing system with Supabase Auth/Postgres, RLS-first data model, admin review APIs, privacy-safe referral URLs, click attribution, and commission/lead tracking foundations.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.rapidriseai.com          # marketing site (referral links resolve here)
NEXT_PUBLIC_PORTAL_URL=https://affiliates.rapidriseai.com # this app (auth verification/reset callbacks)
ADMIN_EMAIL=
RESEND_API_KEY=
EMAIL_FROM="Rapid Rise AI <team@rapidriseai.com>"
CRON_SECRET=               # 32+ random chars; protects /api/cron/affiliate-portal-cleanup
UPSTASH_REDIS_REST_URL=    # optional; rate limiting (fails open if unset)
UPSTASH_REDIS_REST_TOKEN=
```

## Database

This app shares one Supabase database with the CRM and website, but does **not**
own migrations. Schema changes live in the **RRAI-Internal-Tools** repo (the sole
migration owner). See [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md). Do not
run `supabase db push` from here.
