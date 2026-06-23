import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

export async function serverSupabase() {
  if (!url || !anon) throw new Error('Missing Supabase server environment variables');
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Route handlers can.
        }
      },
    },
  });
}
