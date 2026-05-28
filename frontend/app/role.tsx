import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";

export default function Role() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} testID="role-screen">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="hardware-chip-outline" size={28} color="#FFF" />
          </View>
          <Text style={styles.brand}>
            R<Text style={{ color: COLORS.primary }}>O</Text>JGAAR
          </Text>
          <Text style={styles.tag}>Choose how you want to get started</Text>
        </View>

        <RoleCard
          testID="role-worker"
          icon="construct"
          title="I'm a Worker"
          subtitle="Find blue-collar jobs near you"
          onPress={() => router.push("/onboarding/language")}
        />
        <RoleCard
          testID="role-business"
          icon="business"
          title="I'm a Business"
          subtitle="Post jobs and hire workers"
          onPress={() => router.push("/business" as any)}
        />
        <RoleCard
          testID="role-partner"
          icon="people"
          title="I'm a Partner / Agent"
          subtitle="Onboard workers and earn"
          onPress={() => router.push("/partner" as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleCard({
  icon,
  title,
  subtitle,
  onPress,
  testID,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={26} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { alignItems: "center", marginBottom: 32 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brand: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 1.5 },
  tag: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});
