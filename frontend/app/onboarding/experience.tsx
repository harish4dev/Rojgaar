import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

const EXPERIENCE = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];
const SALARY = ["₹10k - ₹15k", "₹15k - ₹20k", "₹20k - ₹25k", "₹25k+"];

export default function ExperienceScreen() {
  const router = useRouter();
  const [exp, setExp] = useState<string | null>(null);
  const [sal, setSal] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!exp || !sal) return;
    const wid = await session.getWorkerId();
    if (wid) await api.updateWorker(wid, { experience: exp, expected_salary: sal });
    router.push("/onboarding/work-type");
  };

  return (
    <SafeAreaView style={styles.container} testID="experience-screen">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scroll}>
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

        <Text style={[styles.label, { marginTop: 32 }]}>{t("expected_salary")}</Text>
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
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="exp-continue"
          title={t("continue")}
          onPress={handleContinue}
          disabled={!exp || !sal}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 24, paddingBottom: 120 },
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
