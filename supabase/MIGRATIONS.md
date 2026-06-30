# Database migrations live in RRAI-Internal-Tools

This app does **not** own database migrations. The shared Supabase database is
owned by the **RRAI-Internal-Tools** repo — the only place schema changes are
written and pushed. **Do not run `supabase db push` from here.**

- Need a schema change for the portal? Add the migration in
  `RRAI-Internal-Tools/supabase/migrations/` and apply it there (CLI or the
  Supabase MCP). See that repo's `supabase/MIGRATIONS.md`.
- This app reads/writes the same database directly at runtime, so the change is
  available immediately.

The portal's original schema (the `affiliate_portal_*` tables, RLS policies, and
RPCs that used to live here as `0001_affiliate_system.sql`) now lives in the owner
repo, alongside every later affiliate migration. Its files were removed from this
repo to keep one authoritative migration history; git history still preserves them.
