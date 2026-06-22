import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function browserSupabase() {
  if (!url || !anon) throw new Error('Missing Supabase browser environment variables');
  return createBrowserClient(url, anon);
}

export function adminSupabase() {
  if (!url || !service) throw new Error('Missing Supabase service role environment variables');
  return createClient(url, service, { auth: { persistSession: false } });
}
