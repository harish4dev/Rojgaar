import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function EmptyState({
  icon = "folder-open-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <PrimaryButton title={actionLabel} onPress={onAction} />
          {secondaryLabel && onSecondary ? (
            <PrimaryButton title={secondaryLabel} variant="secondary" onPress={onSecondary} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bgApp,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  actions: {
    marginTop: 16,
    alignSelf: "stretch",
    gap: 10,
  },
});
