import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import BrandLogo from "@/src/components/BrandLogo";
import { session } from "@/src/store/session";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const onboarded = await session.isOnboarded();
      const workerId = await session.getWorkerId();
      const token = await session.getAccessToken();
      if (onboarded && workerId && token) {
        router.replace("/(tabs)/home");
      } else if (workerId && token) {
        router.replace("/onboarding/personal");
      } else {
        await session.clear();
        router.replace("/onboarding/language");
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <BrandLogo size={120} />
      <ActivityIndicator color={COLORS.primary} style={styles.loader} />
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
    gap: 20,
  },
  loader: { marginTop: 4 },
});
