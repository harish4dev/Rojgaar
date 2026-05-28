import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { t } from "@/src/i18n/translations";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const validPhone = /^\d{10}$/.test(phone);

  const handleContinue = async () => {
    if (!validPhone) return;
    try {
      setLoading(true);
      await api.sendOtp(phone, "worker");
      router.push({ pathname: "/onboarding/otp", params: { phone } });
    } catch (e: any) {
      console.warn("OTP send failed", e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="phone-screen">
      <ScreenHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.illustrationWrap}>
            <View style={styles.illustration}>
              <Ionicons name="phone-portrait" size={70} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.title}>{t("enter_mobile")}</Text>
          <Text style={styles.subtitle}>{t("send_otp_caption")}</Text>

          <View style={styles.inputRow}>
            <View style={styles.flagBox}>
              <Text style={styles.flagText}>+91</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </View>
            <TextInput
              testID="phone-input"
              style={styles.input}
              placeholder="98765 43210"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <PrimaryButton
            testID="phone-continue"
            title={t("continue")}
            onPress={handleContinue}
            disabled={!validPhone}
            loading={loading}
            style={{ marginTop: 24 }}
          />

          <View style={styles.safeNote}>
            <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
            <Text style={styles.safeNoteText}>{t("number_safe")}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { padding: 24, flex: 1 },
  illustrationWrap: { alignItems: "center", marginTop: 16, marginBottom: 24 },
  illustration: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 24 },
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
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  safeNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 12 },
  safeNoteText: { fontSize: 12, color: COLORS.textSecondary },
});
