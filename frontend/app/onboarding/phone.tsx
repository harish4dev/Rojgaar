import { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import OnboardingScreen from "@/src/components/OnboardingScreen";
import BrandLogo from "@/src/components/BrandLogo";
import { api } from "@/src/api/client";
import { t } from "@/src/i18n/translations";
import { getApiErrorMessage } from "@/src/utils/apiError";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validPhone = /^\d{10}$/.test(phone);

  const handleContinue = async () => {
    if (!validPhone) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.sendOtp(phone, "worker");
      router.push({
        pathname: "/onboarding/otp",
        params: { phone, devMode: res?.dev_mode ? "1" : "0" },
      });
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Could not send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScreen
      testID="phone-screen"
      step={2}
      header={<ScreenHeader />}
      footer={
        <PrimaryButton
          testID="phone-continue"
          title={t("continue")}
          onPress={handleContinue}
          disabled={!validPhone}
          loading={loading}
        />
      }
    >
      <View style={styles.hero}>
        <BrandLogo size={80} />
        <Text style={styles.title}>{t("enter_mobile")}</Text>
        <Text style={styles.subtitle}>{t("send_otp_caption")}</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.flagBox}>
          <Text style={styles.flagText}>+91</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
        </View>
        <TextInput
          testID="phone-input"
          style={styles.input}
          placeholder="Enter mobile number"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
          placeholderTextColor={COLORS.textSecondary}
          autoComplete="tel"
          textContentType="telephoneNumber"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.safeNote}>
        <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
        <Text style={styles.safeNoteText}>{t("number_safe")}</Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginTop: 16 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6 },
  inputRow: { flexDirection: "row", gap: 8 },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  flagText: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  safeNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 16 },
  safeNoteText: { fontSize: 12, color: COLORS.textSecondary },
  error: { color: COLORS.error, textAlign: "center", marginTop: 12, fontSize: 13 },
});
