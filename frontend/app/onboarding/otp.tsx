import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import OnboardingScreen from "@/src/components/OnboardingScreen";
import OtpInput from "@/src/components/OtpInput";
import AndroidSmsListener from "@/src/components/AndroidSmsListener";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";
import { DEV_OTP, OTP_LENGTH } from "@/src/constants/otp";
import { getApiErrorMessage } from "@/src/utils/apiError";
import { logAndroidAppHashForTwilio } from "@/src/hooks/useAndroidSmsOtp";

export default function OtpScreen() {
  const router = useRouter();
  const { phone, devMode } = useLocalSearchParams<{ phone: string; devMode?: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(25);
  const [isDevMode, setIsDevMode] = useState(devMode === "1");
  const [listening, setListening] = useState(Platform.OS === "android");
  const verifyingRef = useRef(false);

  const valid = code.length === OTP_LENGTH;

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  useEffect(() => {
    if (!isDevMode || !__DEV__) return;
    setCode(DEV_OTP);
  }, [isDevMode]);

  useEffect(() => {
    void logAndroidAppHashForTwilio();
  }, []);

  const verify = async (otp: string) => {
    if (otp.length !== OTP_LENGTH || verifyingRef.current) return;
    verifyingRef.current = true;
    setListening(false);
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyOtp(phone as string, otp, "worker");
      if (res?.user?.id) {
        if (res.access_token) await session.setAccessToken(res.access_token);
        await session.setWorkerId(res.user.id);
        const lang = await session.getLang();
        try {
          await api.updateWorker(res.user.id, { language: lang });
        } catch {
          /* non-fatal */
        }
        if (res.is_new || !res.user.name?.trim()) {
          router.replace("/onboarding/personal");
        } else {
          await session.setOnboarded(true);
          router.replace("/(tabs)/home");
        }
      }
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Invalid or expired code. Try again."));
      setCode("");
      setListening(true);
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  const handleAutoCode = (autoCode: string) => {
    setCode(autoCode);
    void verify(autoCode);
  };

  const handleCodeChange = (next: string) => {
    setCode(next);
    setError(null);
    if (next.length === OTP_LENGTH) {
      void verify(next);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(25);
    setError(null);
    setCode("");
    setListening(true);
    try {
      const res = await api.sendOtp(phone as string, "worker");
      if (res?.dev_mode && __DEV__) {
        setIsDevMode(true);
        setCode(DEV_OTP);
      }
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Could not resend OTP. Please try again."));
    }
  };

  return (
    <OnboardingScreen
      testID="otp-screen"
      header={<ScreenHeader />}
      footer={
        loading ? (
          <View style={styles.verifying}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.verifyingText}>Verifying…</Text>
          </View>
        ) : (
          <PrimaryButton
            testID="otp-verify"
            title={t("continue")}
            onPress={() => verify(code)}
            disabled={!valid}
          />
        )
      }
    >
      {Platform.OS === "android" ? <AndroidSmsListener onCode={handleAutoCode} /> : null}
      <Text style={styles.title}>{t("enter_otp")}</Text>
      <Text style={styles.subtitle}>
        {t("otp_caption")}
        {"\n"}
        <Text style={styles.phoneText}>+91 {phone}</Text>
      </Text>

      <OtpInput
        value={code}
        onChange={handleCodeChange}
        onComplete={(c) => void verify(c)}
        error={Boolean(error)}
      />

      {listening && Platform.OS === "android" && !loading ? (
        <Text style={styles.hint}>Waiting for SMS — code will fill automatically</Text>
      ) : null}

      {isDevMode && __DEV__ ? (
        <Text style={styles.hint}>Development mode: OTP is {DEV_OTP}</Text>
      ) : null}

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>{t("didnt_receive")} </Text>
        <TouchableOpacity testID="otp-resend" onPress={handleResend} disabled={timer > 0 || loading}>
          <Text style={[styles.resendCta, timer > 0 && { color: COLORS.textSecondary }]}>
            {timer > 0 ? `${t("resend")} in 00:${String(timer).padStart(2, "0")}` : t("resend")}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
  phoneText: { color: COLORS.textPrimary, fontWeight: "600" },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 24, flexWrap: "wrap" },
  resendText: { color: COLORS.textSecondary, fontSize: 13 },
  resendCta: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  error: { color: COLORS.error, textAlign: "center", marginTop: 16, fontSize: 13 },
  hint: { textAlign: "center", color: COLORS.textSecondary, marginTop: 14, fontSize: 12 },
  verifying: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 8 },
  verifyingText: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
});
