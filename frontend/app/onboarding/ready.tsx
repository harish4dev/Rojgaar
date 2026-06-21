import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import OnboardingScreen from "@/src/components/OnboardingScreen";
import BrandLogo from "@/src/components/BrandLogo";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

export default function ReadyScreen() {
  const router = useRouter();

  const goHome = async () => {
    await session.setOnboarded(true);
    router.replace("/(tabs)/home");
  };

  return (
    <OnboardingScreen
      testID="ready-screen"
      scroll={false}
      contentStyle={styles.content}
      footer={
        <>
          <PrimaryButton testID="ready-see-jobs" title={t("see_jobs")} onPress={goHome} />
          <PrimaryButton
            testID="ready-complete-later"
            title={t("complete_later")}
            onPress={goHome}
            variant="secondary"
          />
        </>
      }
    >
      <View style={styles.center}>
        <BrandLogo size={88} />
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="#FFF" />
        </View>
        <Text style={styles.title}>{t("profile_ready")}</Text>
        <Text style={styles.subtitle}>{t("profile_ready_caption")}</Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 20 },
});
