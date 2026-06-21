import { useEffect, useState } from "react";
import { OTP_LENGTH } from "@/src/constants/otp";

type Props = {
  onCode: (code: string) => void;
};

/** Renders nothing; listens for Android SMS Retriever OTP on production APK builds. */
export default function AndroidSmsListener({ onCode }: Props) {
  const [otp, setOtp] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const mod = await import("expo-otp-autofill");
        await mod.startSmsRetrieverAsync();
        const native = await import("expo-otp-autofill/build/ExpoOtpAutofillModule");
        const ExpoOtpAutofillModule = native.default;
        const sub = ExpoOtpAutofillModule.addListener("onOtpReceived", (event: { message: string }) => {
          if (!mounted) return;
          const code = mod.extractOtp(event.message, { length: OTP_LENGTH });
          if (code?.length === OTP_LENGTH) setOtp(code);
        });
        cleanup = () => {
          sub.remove();
          mod.stopSmsRetrieverAsync();
        };
      } catch {
        /* Expo Go — native module not linked */
      }
    })();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    if (otp?.length === OTP_LENGTH) onCode(otp);
  }, [otp, onCode]);

  return null;
}
