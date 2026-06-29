import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { ONBOARDING_TOTAL_STEPS } from "@/src/constants/onboarding";
import { t } from "@/src/i18n/translations";

interface Props {
  step: number;
}

export default function OnboardingProgress({ step }: Props) {
  const pct = Math.min(100, Math.max(0, (step / ONBOARDING_TOTAL_STEPS) * 100));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <Text style={styles.label}>
        {t("onboarding_step")
          .replace("{current}", String(step))
          .replace("{total}", String(ONBOARDING_TOTAL_STEPS))}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 8 },
  track: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
});
