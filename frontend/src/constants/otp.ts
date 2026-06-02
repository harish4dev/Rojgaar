/** Must match backend `OTP_LENGTH` and Twilio Verify service code length. */
export const OTP_LENGTH = 4;

export function digitsOnlyOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function isValidOtp(value: string): boolean {
  const d = digitsOnlyOtp(value);
  return d.length === OTP_LENGTH;
}
