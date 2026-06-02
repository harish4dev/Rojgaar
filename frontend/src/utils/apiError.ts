export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof Error && err.message) {
    if (err.message.includes("Network request failed")) {
      return "Cannot reach the server. Check your internet connection and API URL.";
    }
    if (err.message.startsWith("API ")) {
      return "Server error. Please try again in a moment.";
    }
    return err.message;
  }
  return fallback;
}
