import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  hasTrustedOrigin,
  logServerError,
  publicApiError,
} from '@/lib/server-security';
import { adminSupabase, serverSupabase } from '@/lib/supabase';

const applicationSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  surname: z.string().trim().min(1).max(100),
  business_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(6).max(50),
  website_url: z.string().trim().max(500),
  social_links: z.string().trim().max(1000),
  google_business_url: z.string().trim().max(500),
  client_types: z.string().trim().min(1).max(1000),
  motivation: z.string().trim().min(1).max(3000),
  password: z.string().min(8).max(128),
  confirm_password: z.string(),
  terms: z.literal('on'),
}).refine((value) => value.password === value.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) {
    return publicApiError('invalid_origin', 403, 'Request origin was rejected.');
  }

  const form = Object.fromEntries(await req.formData());
  const parsed = applicationSchema.safeParse(form);
  if (!parsed.success) {
    return publicApiError(
      'invalid_application',
      400,
      parsed.error.issues[0]?.message ?? 'Invalid application',
    );
  }

  const { password, ...data } = parsed.data;
  const supabase = await serverSupabase();
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const { data: signup, error: signupError } = await supabase.auth.signUp({
    email: data.email,
    password,
    options: {
      emailRedirectTo: `${redirectBase.replace(/\/$/, '')}/auth/callback`,
    },
  });

  if (signupError || !signup.user || signup.user.identities?.length === 0) {
    logServerError('affiliate_signup_failed', signupError);
    return publicApiError(
      'signup_failed',
      400,
      'Unable to start signup. Use a different email or try again later.',
    );
  }

  const admin = adminSupabase();
  const { error: applicationError } = await admin
    .from('affiliate_portal_partner_applications')
    .insert({
      auth_user_id: signup.user.id,
      first_name: data.first_name,
      surname: data.surname,
      business_name: data.business_name,
      email: data.email,
      phone: data.phone,
      website_url: data.website_url || null,
      social_links: data.social_links || null,
      google_business_url: data.google_business_url || null,
      client_types: data.client_types,
      motivation: data.motivation,
      status: 'pending_review',
      terms_accepted_at: new Date().toISOString(),
    });

  if (applicationError) {
    logServerError('affiliate_application_insert_failed', applicationError);
    const { error: cleanupError } = await admin.auth.admin.deleteUser(signup.user.id);
    if (cleanupError) logServerError('affiliate_signup_cleanup_failed', cleanupError);
    return publicApiError('application_failed');
  }

  return NextResponse.redirect(
    new URL('/partners/login?status=verify-email', req.url),
    303,
  );
}
