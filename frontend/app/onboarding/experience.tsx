import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import OnboardingScreen from "@/src/components/OnboardingScreen";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

const EXPERIENCE = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];
const SALARY = ["₹10,000 - ₹15,000", "₹15,000 - ₹20,000", "₹20,000 - ₹25,000", "₹25,000+"];

export default function ExperienceScreen() {
  const router = useRouter();
  const [exp, setExp] = useState<string | null>(null);
  const [sal, setSal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async (skip = false) => {
    setSaving(true);
    try {
      const wid = await session.getWorkerId();
      if (wid && !skip && (exp || sal)) {
        await api.updateWorker(wid, {
          ...(exp ? { experience: exp } : {}),
          ...(sal ? { expected_salary: sal } : {}),
        });
      }
      router.push("/onboarding/work-type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      testID="experience-screen"
      step={7}
      header={<ScreenHeader title="" />}
      skipLabel="Skip for now"
      onSkip={() => handleContinue(true)}
      footer={
        <PrimaryButton
          testID="exp-continue"
          title={t("continue")}
          onPress={() => handleContinue(false)}
          loading={saving}
        />
      }
    >
      <Text style={styles.title}>{t("experience")}</Text>
      <Text style={styles.subtitle}>Optional — helps match better jobs</Text>

      <Text style={styles.label}>{t("experience")}</Text>
      <View style={styles.grid}>
        {EXPERIENCE.map((e) => {
          const active = exp === e;
          return (
            <TouchableOpacity
              key={e}
              testID={`exp-${e}`}
              onPress={() => setExp(e)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 28 }]}>{t("expected_salary")}</Text>
      <Text style={styles.sublabel}>{t("salary_range")}</Text>
      <View style={styles.grid}>
        {SALARY.map((s) => {
          const active = sal === s;
          return (
            <TouchableOpacity
              key={s}
              testID={`sal-${s}`}
              onPress={() => setSal(s)}
              style={[styles.chipLg, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },
  sublabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: -6, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  chipLg: {
    width: "47%",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "600" },
  chipTextActive: { color: COLORS.primary },
});
