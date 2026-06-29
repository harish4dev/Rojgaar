import { View, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "@/src/constants/theme";

export default function JobCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.thumb} />
        <View style={styles.body}>
          <View style={[styles.line, { width: "70%" }]} />
          <View style={[styles.line, { width: "45%", marginTop: 8 }]} />
          <View style={[styles.line, { width: "55%", marginTop: 12 }]} />
          <View style={styles.tagRow}>
            <View style={styles.tag} />
            <View style={styles.tag} />
          </View>
        </View>
      </View>
      <View style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: { flexDirection: "row", gap: 12 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.borderLight,
  },
  body: { flex: 1 },
  line: { height: 14, borderRadius: 7, backgroundColor: COLORS.borderLight },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: { width: 72, height: 24, borderRadius: RADIUS.full, backgroundColor: COLORS.borderLight },
  btn: {
    marginTop: 14,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.borderLight,
  },
});
