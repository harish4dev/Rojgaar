import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";
import { DEV_OTP, OTP_LENGTH, otpDigitsArray } from "@/src/constants/otp";
import { getApiErrorMessage } from "@/src/utils/apiError";

export default function OtpScreen() {
  const router = useRouter();
  const { phone, devMode } = useLocalSearchParams<{ phone: string; devMode?: string }>();
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(25);
  const [isDevMode, setIsDevMode] = useState(devMode === "1");
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  useEffect(() => {
    if (!isDevMode || !__DEV__) return;
    setDigits(otpDigitsArray(DEV_OTP));
  }, [isDevMode]);

  const code = digits.join("");
  const valid = code.length === OTP_LENGTH;

  const handleChange = (i: number, v: string) => {
    const c = v.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, key: string) => {
    if (key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!valid) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyOtp(phone as string, code, "worker");
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
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(25);
    setError(null);
    try {
      const res = await api.sendOtp(phone as string, "worker");
      if (res?.dev_mode && __DEV__) {
        setIsDevMode(true);
        setDigits(otpDigitsArray(DEV_OTP));
      }
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Could not resend OTP. Please try again."));
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="otp-screen">
      <ScreenHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{t("enter_otp")}</Text>
          <Text style={styles.subtitle}>
            {t("otp_caption")}
            {"\n"}
            <Text style={styles.phoneText}>+91 {phone}</Text>
          </Text>

          <View style={styles.row}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                testID={`otp-${i}`}
                style={[styles.box, d ? styles.boxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
                placeholderTextColor={COLORS.border}
                textContentType={i === 0 ? "oneTimeCode" : "none"}
                autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
              />
            ))}
          </View>

          {isDevMode && __DEV__ ? (
            <Text style={styles.hint}>Development mode: OTP auto-filled as {DEV_OTP}.</Text>
          ) : null}

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>{t("didnt_receive")} </Text>
            <TouchableOpacity testID="otp-resend" onPress={handleResend} disabled={timer > 0}>
              <Text style={[styles.resendCta, timer > 0 && { color: COLORS.textSecondary }]}>
                {timer > 0 ? `${t("resend")} in 00:${String(timer).padStart(2, "0")}` : t("resend")}
              </Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            testID="otp-verify"
            title={t("continue")}
            onPress={handleVerify}
            disabled={!valid}
            loading={loading}
            style={{ marginTop: 32 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { padding: 24, flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginTop: 24 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8 },
  phoneText: { color: COLORS.textPrimary, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 32 },
  box: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    backgroundColor: "#FFF",
  },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  resendText: { color: COLORS.textSecondary, fontSize: 13 },
  resendCta: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  error: { color: COLORS.error, textAlign: "center", marginTop: 12 },
  hint: { textAlign: "center", color: COLORS.textSecondary, marginTop: 12, fontSize: 12 },
});
