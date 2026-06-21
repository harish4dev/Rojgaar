function extractDetail(message: string): string | null {
  const match = message.match(/API \d+:\s*(.+)/s);
  if (!match) return null;
  const raw = match[1].trim();
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.detail === "string") return parsed.detail;
  } catch {
    /* plain text body */
  }
  return raw;
}

export function isUnauthorizedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message.includes("API 401") || err.message.includes("API 403");
}

export function isAccountNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const detail = extractDetail(err.message) ?? err.message;
  return /not found/i.test(detail);
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!(err instanceof Error) || !err.message) return fallback;

  if (err.message.includes("Network request failed")) {
    return "Cannot reach the server. Check your internet connection and API URL.";
  }

  const detail = extractDetail(err.message);
  if (detail) {
    if (/worker not found/i.test(detail) || /user not found/i.test(detail)) {
      return "We couldn't find your account. Please sign in again with your phone number.";
    }
    if (/session expired/i.test(detail) || /invalid session/i.test(detail)) {
      return "Your session expired. Please sign in again.";
    }
    if (/invalid or expired verification code/i.test(detail)) {
      return "Invalid or expired code. Please try again.";
    }
    if (/otp must be/i.test(detail)) {
      return "Enter the 4-digit verification code.";
    }
    return detail;
  }

  if (err.message.startsWith("API ")) {
    return "Server error. Please try again in a moment.";
  }

  return err.message;
}
