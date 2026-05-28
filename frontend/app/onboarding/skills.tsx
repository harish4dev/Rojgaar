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

const SKILL_ICONS: Record<string, string> = {
  Mason: "construct",
  Helper: "person",
  Painter: "color-palette",
  Welder: "flame",
  Plumber: "water",
  Carpenter: "hammer",
  Electrician: "flash",
  "Tiles Fitting": "grid",
  "Steel Fixer": "build",
  "AC Technician: ": "snow",
  "AC Technician": "snow",
  Driver: "car",
  Security: "shield-checkmark",
  Cleaner: "sparkles",
  Cook: "restaurant",
};

export default function SkillsScreen() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => {});
  }, []);

  const toggle = (s: string) => {
    setSelected((prev) => (prev.includes(s) ? prev.filter((k) => k !== s) : [...prev, s]));
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    const wid = await session.getWorkerId();
    if (wid) await api.updateWorker(wid, { skills: selected });
    router.push("/onboarding/experience");
  };

  return (
    <SafeAreaView style={styles.container} testID="skills-screen">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t("select_skills")}</Text>
        <Text style={styles.subtitle}>{t("choose_all")}</Text>
        <View style={styles.grid}>
          {skills.map((s) => {
            const active = selected.includes(s);
            return (
              <TouchableOpacity
                key={s}
                testID={`skill-${s}`}
                onPress={() => toggle(s)}
                activeOpacity={0.85}
                style={[styles.chip, active && styles.chipActive]}
              >
                <View style={styles.chipIcon}>
                  <Ionicons name={(SKILL_ICONS[s] || "briefcase") as any} size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.count}>{selected.length} selected</Text>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="skills-continue"
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
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
