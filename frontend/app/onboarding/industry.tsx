import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

interface Industry {
  key: string;
  label: string;
  icon: string;
}

export default function IndustryScreen() {
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    api.getIndustries().then(setIndustries).catch(() => {});
  }, []);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    const wid = await session.getWorkerId();
    if (wid) await api.updateWorker(wid, { industries: selected });
    router.push("/onboarding/skills");
  };

  return (
    <SafeAreaView style={styles.container} testID="industry-screen">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t("select_industry")}</Text>
        <Text style={styles.subtitle}>{t("more_than_one")}</Text>
        <View style={styles.grid}>
          {industries.map((ind) => {
            const active = selected.includes(ind.key);
            return (
              <TouchableOpacity
                key={ind.key}
                testID={`industry-${ind.key}`}
                style={[styles.tile, active && styles.tileActive]}
                activeOpacity={0.85}
                onPress={() => toggle(ind.key)}
              >
                <View style={styles.tileIcon}>
                  <Ionicons name={ind.icon as any} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.tileText}>{ind.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.count}>{selected.length} selected</Text>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="industry-continue"
          title={t("continue")}
          onPress={handleContinue}
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 24, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  tile: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  tileActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tileText: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary, textAlign: "center" },
  count: { textAlign: "center", color: COLORS.textSecondary, marginTop: 16 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
