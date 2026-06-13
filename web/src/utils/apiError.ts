function extractDetail(message: string): string | null {
  const match = message.match(/API \d+:\s*(.+)/s)
  if (!match) return null
  const raw = match[1].trim()
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed?.detail === 'string') return parsed.detail
  } catch {
    /* plain text body */
  }
  return raw
}

export function isAccountNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const detail = extractDetail(err.message) ?? err.message
  return /not found/i.test(detail)
}

export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!(err instanceof Error) || !err.message) return fallback

  const detail = extractDetail(err.message)
  if (detail) {
    if (/worker not found/i.test(detail) || /user not found/i.test(detail)) {
      return "We couldn't find your account. Please sign in again with your phone number."
    }
    if (/business not found/i.test(detail) || /partner not found/i.test(detail)) {
      return "We couldn't find your account. Please sign in again."
    }
    if (/invalid or expired verification code/i.test(detail)) {
      return 'Invalid or expired code. Please try again.'
    }
    if (/otp must be/i.test(detail)) {
      return 'Enter the 4-digit verification code.'
    }
    return detail
  }

  if (err.message.startsWith('API ')) {
    return 'Server error. Please try again in a moment.'
  }

  return err.message
}
