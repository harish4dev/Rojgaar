import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

type Tab = "applied" | "viewed" | "saved";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Contacted: { bg: COLORS.successBg, fg: COLORS.success },
  Pending: { bg: COLORS.warningBg, fg: COLORS.warning },
  "Not Selected": { bg: COLORS.errorBg, fg: COLORS.error },
  Hired: { bg: COLORS.successBg, fg: COLORS.success },
};

export default function ActivityScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("applied");
  const [applied, setApplied] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) return;
    setLoading(true);
    try {
      const [apps, sv] = await Promise.all([
        api.listApplications(wid),
        api.listSavedJobs(wid),
      ]);
      setApplied(apps);
      setSaved(sv);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} testID="activity-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{t("activity")}</Text>
      </View>

      <View style={styles.tabsRow}>
        {(["applied", "viewed", "saved"] as Tab[]).map((tk) => (
          <TouchableOpacity
            key={tk}
            testID={`activity-tab-${tk}`}
            onPress={() => setTab(tk)}
            style={[styles.tab, tab === tk && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === tk && styles.tabTextActive]}>{t(tk)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading && <Text style={styles.empty}>Loading…</Text>}
        {!loading && tab === "applied" && (
          applied.length === 0 ? (
            <Text style={styles.empty}>You haven&apos;t applied to any jobs yet.</Text>
          ) : (
            applied.map((a) => <ApplicationRow key={a.id} a={a} onPress={() => router.push(`/job/${a.job_id}` as any)} />)
          )
        )}
        {!loading && tab === "viewed" && (
          <Text style={styles.empty}>Recently viewed jobs will appear here.</Text>
        )}
        {!loading && tab === "saved" && (
          saved.length === 0 ? (
            <Text style={styles.empty}>No saved jobs yet.</Text>
          ) : (
            saved.map((j) => (
              <TouchableOpacity
                key={j.id}
                testID={`saved-row-${j.id}`}
                onPress={() => router.push(`/job/${j.id}` as any)}
                style={styles.row}
              >
                {j.image_url ? (
                  <Image source={{ uri: j.image_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name="briefcase" size={20} color={COLORS.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{j.title}</Text>
                  <Text style={styles.rowSub}>{j.company}</Text>
                  <Text style={styles.rowMeta}>
                    ₹{j.salary_min.toLocaleString("en-IN")} - ₹{j.salary_max.toLocaleString("en-IN")} • {j.city}
                  </Text>
                </View>
                <Ionicons name="bookmark" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ApplicationRow({ a, onPress }: { a: any; onPress: () => void }) {
  const status = a.status || "Pending";
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  const job = a.job || {};
  return (
    <TouchableOpacity
      testID={`app-row-${a.id}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.thumb, { backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="briefcase" size={22} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{job.title || "Job"}</Text>
        <Text style={styles.rowSub}>{job.company || ""}</Text>
        <Text style={styles.rowMeta}>
          {t("applied_on")} {new Date(a.applied_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.badgeText, { color: colors.fg }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#FFF" },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  tabsRow: { flexDirection: "row", backgroundColor: "#FFF", paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
  tabTextActive: { color: COLORS.primary },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: "center", color: COLORS.textSecondary, marginTop: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  thumb: { width: 50, height: 50, borderRadius: RADIUS.md },
  rowTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  rowSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
