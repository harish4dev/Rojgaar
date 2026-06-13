import { useEffect, useMemo, useState } from "react";
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

const ROLE_ICONS: Record<string, string> = {
  Tailor: "shirt-outline",
  Helper: "person",
  "Cutting Master": "cut-outline",
};

export default function IndustryScreen() {
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTitlesByIndustry, setJobTitlesByIndustry] = useState<Record<string, string[]>>({});
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getIndustries(), api.getIndustryJobTitles()])
      .then(([inds, titles]) => {
        setIndustries(inds);
        setJobTitlesByIndustry(titles);
        if (inds.length === 1) setSelectedIndustry(inds[0].key);
      })
      .catch(() => {});
  }, []);

  const availableRoles = useMemo(() => {
    if (!selectedIndustry) return [];
    return jobTitlesByIndustry[selectedIndustry] ?? [];
  }, [selectedIndustry, jobTitlesByIndustry]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const persistAndContinue = async (skip = false) => {
    setSaving(true);
    try {
      const wid = await session.getWorkerId();
      if (wid && !skip && selectedIndustry) {
        await api.updateWorker(wid, {
          industries: [selectedIndustry],
          industry_preference: selectedIndustry,
          skills: selectedRoles,
          preferred_job_title: selectedRoles[0] ?? null,
        });
      }
      router.push("/onboarding/experience");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="industry-screen">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t("select_industry")}</Text>
        <Text style={styles.subtitle}>Choose your industry and job role (optional)</Text>

        <Text style={styles.sectionLabel}>Industry</Text>
        <View style={styles.grid}>
          {industries.map((ind) => {
            const active = selectedIndustry === ind.key;
            return (
              <TouchableOpacity
                key={ind.key}
                testID={`industry-${ind.key}`}
                style={[styles.tile, active && styles.tileActive]}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedIndustry(ind.key);
                  setSelectedRoles([]);
                }}
              >
                <View style={styles.tileIcon}>
                  <Ionicons name={(ind.icon || "business") as any} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.tileText}>{ind.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedIndustry && availableRoles.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Job role</Text>
            <View style={styles.roleGrid}>
              {availableRoles.map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <TouchableOpacity
                    key={role}
                    testID={`role-${role}`}
                    onPress={() => toggleRole(role)}
                    activeOpacity={0.85}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <View style={styles.chipIcon}>
                      <Ionicons
                        name={(ROLE_ICONS[role] || "briefcase") as any}
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={styles.chipText}>{role}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => persistAndContinue(true)} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <PrimaryButton
          testID="industry-continue"
          title={t("continue")}
          onPress={() => persistAndContinue(false)}
          disabled={!selectedIndustry}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 24, paddingBottom: 140 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 10, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start" },
  tile: {
    minWidth: "30%",
    flexGrow: 1,
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
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
});
