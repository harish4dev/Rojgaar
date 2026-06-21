import { Platform } from "react-native";

type Listener = (code: string) => void;

/** No-op on iOS/web; Android uses AndroidSmsListener component instead. */
export function useAndroidSmsOtp(_onCode: Listener) {
  /* listener mounted via <AndroidSmsListener /> in otp screen */
}

export async function logAndroidAppHashForTwilio() {
  if (Platform.OS !== "android") return null;
  try {
    const { getAppHashAsync } = await import("expo-otp-autofill");
    const hash = await getAppHashAsync();
    if (__DEV__) {
      console.log("[Rojgaar] Android SMS app hash — set ANDROID_SMS_APP_HASH on Railway:", hash);
    }
    return hash;
  } catch {
    return null;
  }
}
