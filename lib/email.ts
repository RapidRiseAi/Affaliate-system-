type Email = { to: string; subject: string; html: string };
export async function sendEmail(email: Email) {
  if (!process.env.RESEND_API_KEY) { console.log('Email skipped (RESEND_API_KEY missing)', email); return { skipped: true }; }
  const res = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Rapid Rise AI <partners@rapidriseai.com>', ...email }) });
  if (!res.ok) throw new Error(`Email failed: ${await res.text()}`);
  return res.json();
}
