import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

export default function ReadyScreen() {
  const router = useRouter();
  const handleSeeJobs = async () => {
    await session.setOnboarded(true);
    router.replace("/(tabs)/home");
  };
  const handleComplete = async () => {
    await session.setOnboarded(true);
    router.replace("/(tabs)/home");
  };
  return (
    <SafeAreaView style={styles.container} testID="ready-screen">
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFF" />
        </View>
        <Text style={styles.title}>{t("profile_ready")}</Text>
        <Text style={styles.subtitle}>{t("profile_ready_caption")}</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton testID="ready-see-jobs" title={t("see_jobs")} onPress={handleSeeJobs} />
        <PrimaryButton
          testID="ready-complete-later"
          title={t("complete_later")}
          onPress={handleComplete}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 12 },
  footer: { padding: 24 },
});
