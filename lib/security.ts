export function randomToken(length = 7) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), n => alphabet[n % alphabet.length]).join('');
}
export function slugifyCode(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}
export function containsPrivateData(value: string) {
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/;
  const sensitive = /\b(id|passport|password|bank|account|ssn|email|phone|mobile)\b/i;
  return email.test(value) || phone.test(value) || sensitive.test(value);
}
