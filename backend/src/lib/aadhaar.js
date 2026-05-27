import crypto from 'crypto'

/** Sandbox OTP for demos — not connected to UIDAI */
export const DEMO_AADHAAR_OTP = '123456'

export function normalizeAadhaar(raw) {
  return String(raw || '').replace(/\D/g, '')
}

export function formatAadhaarDisplay(digits) {
  const d = normalizeAadhaar(digits)
  if (d.length <= 4) return d
  if (d.length <= 8) return `${d.slice(0, 4)} ${d.slice(4)}`
  return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`
}

export function validateAadhaar(digits) {
  if (digits.length !== 12) return false
  return /^[2-9]\d{11}$/.test(digits)
}

export function maskAadhaar(digits) {
  const d = normalizeAadhaar(digits)
  return `XXXX XXXX ${d.slice(-4)}`
}

export function hashAadhaar(digits) {
  return crypto.createHash('sha256').update(normalizeAadhaar(digits)).digest('hex')
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex')
}

export function generateOtp() {
  return DEMO_AADHAAR_OTP
}
