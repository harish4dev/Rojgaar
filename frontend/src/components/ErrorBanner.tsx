import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/src/constants/theme";

export default function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Ionicons name="warning-outline" size={18} color={COLORS.error} />
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} hitSlop={8} style={styles.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.errorBg,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  text: { flex: 1, fontSize: 13, color: COLORS.error, fontWeight: "600" },
  retry: { paddingHorizontal: 8, paddingVertical: 4 },
  retryText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});
