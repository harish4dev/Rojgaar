import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

export default function WorkTypeScreen() {
  const router = useRouter();
  const [type, setType] = useState<string | null>("Full Time");
  const [saving, setSaving] = useState(false);

  const options = [
    { key: "Full Time", title: t("full_time"), desc: t("full_time_desc"), icon: "time" },
    { key: "Part Time", title: t("part_time"), desc: t("part_time_desc"), icon: "alarm" },
    { key: "Daily Wage", title: t("daily_wage"), desc: t("daily_wage_desc"), icon: "calendar" },
    { key: "Any", title: t("any_work"), desc: t("any_work_desc"), icon: "infinite" },
  ];

  const finish = async (saveType = true) => {
    setSaving(true);
    try {
      const wid = await session.getWorkerId();
      if (wid && saveType && type) await api.updateWorker(wid, { work_type: type });
      await session.setOnboarded(true);
      router.replace("/onboarding/ready");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="work-type-screen">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t("what_kind")}</Text>
        <Text style={styles.subtitle}>Optional</Text>
        <View style={{ gap: 12, marginTop: 24 }}>
          {options.map((o) => {
            const active = type === o.key;
            return (
              <TouchableOpacity
                key={o.key}
                testID={`worktype-${o.key}`}
                activeOpacity={0.85}
                onPress={() => setType(o.key)}
                style={[styles.row, active && styles.rowActive]}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={o.icon as any} size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{o.title}</Text>
                  <Text style={styles.rowDesc}>{o.desc}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => finish(false)} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <PrimaryButton
          testID="worktype-save"
          title={t("save_continue")}
          onPress={() => finish(true)}
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
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: 14,
    gap: 12,
  },
  rowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  rowDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
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
