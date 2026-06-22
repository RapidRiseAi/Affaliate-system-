# Rapid Rise AI Affiliate System

Next.js App Router affiliate-facing system with Supabase Auth/Postgres, RLS-first data model, admin review APIs, privacy-safe referral URLs, click attribution, and commission/lead tracking foundations.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.rapidriseai.com
ADMIN_EMAIL=
RESEND_API_KEY=
EMAIL_FROM="Rapid Rise AI <partners@rapidriseai.com>"
```

Run `supabase/migrations/0001_affiliate_system.sql` in the RRAI Supabase project before using the API routes.
