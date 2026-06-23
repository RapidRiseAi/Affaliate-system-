type Email = { to: string; subject: string; html: string };
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}
export async function sendEmail(email: Email) {
  if (!process.env.RESEND_API_KEY) {
    console.info('email_delivery_skipped', { code: 'provider_not_configured' });
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Rapid Rise AI <partners@rapidriseai.com>', ...email }) });
  if (!res.ok) {
    const error = new Error('Email delivery failed') as Error & { code: string };
    error.code = `email_http_${res.status}`;
    throw error;
  }
  return res.json();
}
