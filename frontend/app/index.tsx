import { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const onboarded = await session.isOnboarded();
      const workerId = await session.getWorkerId();
      if (onboarded && workerId) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/role");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.logoWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="hardware-chip-outline" size={36} color="#FFF" />
        </View>
        <Text style={styles.brand}>
          R<Text style={{ color: COLORS.primary }}>O</Text>JGAAR
        </Text>
        <Text style={styles.tag}>{t("tagline")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoWrap: { alignItems: "center" },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brand: { fontSize: 38, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 2 },
  tag: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },
});
