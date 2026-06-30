import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  hasTrustedOrigin,
  logServerError,
  portalOrigin,
} from '@/lib/server-security';
import { clientIp, rateLimit } from '@/lib/rate-limit';
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
  preferred_commission_model: z.enum(['BUILD_COST', 'LIFETIME']),
  password: z.string().min(8).max(128),
  confirm_password: z.string(),
  terms: z.literal('on'),
}).refine((value) => value.password === value.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export async function POST(req: Request) {
  const wantsJson = req.headers.get('x-portal-request') === 'fetch';
  const fail = (code: string, status: number, message: string) => {
    if (wantsJson) return NextResponse.json({ error: message, code }, { status });
    const target = new URL('/partners/apply', req.url);
    target.searchParams.set('error', code);
    return NextResponse.redirect(target, 303);
  };
  const succeed = () => wantsJson
    ? NextResponse.json({ ok: true, redirect: '/partners/login?status=verify-email' })
    : NextResponse.redirect(new URL('/partners/login?status=verify-email', req.url), 303);

  if (!hasTrustedOrigin(req)) {
    return fail('invalid_origin', 403, 'Request origin was rejected.');
  }

  // Throttle application spam / signup abuse: 5 per IP per hour.
  const limit = await rateLimit(`apply:${clientIp(req)}`, 5, 3600);
  if (!limit.ok) {
    return fail('rate_limited', 429, 'Too many attempts were made. Please wait a while before trying again.');
  }

  const form = Object.fromEntries(await req.formData());
  const parsed = applicationSchema.safeParse(form);
  if (!parsed.success) {
    return fail(
      'invalid_application',
      400,
      parsed.error.issues[0]?.message ?? 'Invalid application',
    );
  }

  const { password, ...data } = parsed.data;
  const admin = adminSupabase();
  const findApplication = () => admin
    .from('affiliate_portal_partner_applications')
    .select('id,status')
    .eq('email', data.email)
    .limit(1)
    .maybeSingle();
  const { data: existingApplication, error: existingApplicationError } = await findApplication();
  if (existingApplicationError) {
    logServerError('affiliate_application_duplicate_check_failed', existingApplicationError);
    return fail('application_failed', 500, 'We could not check this application. Please try again.');
  }
  if (existingApplication) {
    return fail(
      'already_submitted',
      409,
      'An application has already been submitted with this email address. Check your inbox for the verification email or sign in to view its status.',
    );
  }

  const supabase = await serverSupabase();
  const redirectBase = portalOrigin(req);
  const { data: signup, error: signupError } = await supabase.auth.signUp({
    email: data.email,
    password,
    options: {
      emailRedirectTo: `${redirectBase}/auth/callback`,
    },
  });

  if (signupError || !signup.user || signup.user.identities?.length === 0) {
    logServerError('affiliate_signup_failed', signupError);
    const { data: racedApplication } = await findApplication();
    if (racedApplication) {
      return fail('already_submitted', 409, 'This application was already received. Check your inbox for the verification email.');
    }
    if (signupError?.status === 429 || signupError?.code?.includes('rate')) {
      return fail('rate_limited', 429, 'Too many attempts were made. Please wait a minute before trying again.');
    }
    return fail('email_in_use', 409, 'This email address is already in use. Sign in with the existing account or use a different email address.');
  }

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
      preferred_commission_model: data.preferred_commission_model,
      status: 'pending_review',
      terms_accepted_at: new Date().toISOString(),
    });

  if (applicationError) {
    logServerError('affiliate_application_insert_failed', applicationError);
    if (applicationError.code === '23505') {
      return fail('already_submitted', 409, 'This application was already received. Check your inbox for the verification email.');
    }
    const { error: cleanupError } = await admin.auth.admin.deleteUser(signup.user.id);
    if (cleanupError) logServerError('affiliate_signup_cleanup_failed', cleanupError);
    return fail('application_failed', 500, 'We could not save the application. Please try again once.');
  }

  return succeed();
}
