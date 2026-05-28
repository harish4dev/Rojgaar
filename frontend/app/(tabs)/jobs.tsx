import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import JobCard from "@/src/components/JobCard";
import { t } from "@/src/i18n/translations";

interface Industry {
  key: string;
  label: string;
  icon: string;
}

export default function JobsTab() {
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [activeTab, setActiveTab] = useState<"city" | "industry" | "skills">("industry");
  const [selectedInd, setSelectedInd] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getIndustries().then(setIndustries).catch(() => {});
  }, []);

  const loadJobs = useCallback(async (industry: string | null) => {
    setLoading(true);
    try {
      const data = await api.listJobs(industry ? { industry } : {});
      setJobs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJobs(selectedInd);
    }, [selectedInd, loadJobs])
  );

  return (
    <SafeAreaView style={styles.container} testID="jobs-tab">
      <View style={styles.header}>
        <Text style={styles.title}>{t("browse_jobs")}</Text>
        <TouchableOpacity
          testID="open-filter"
          onPress={() => router.push("/filter")}
          style={styles.filterBtn}
        >
          <Ionicons name="options" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {(["city", "industry", "skills"] as const).map((tk) => (
          <TouchableOpacity
            key={tk}
            testID={`tab-${tk}`}
            onPress={() => setActiveTab(tk)}
            style={[styles.tab, activeTab === tk && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tk && styles.tabTextActive]}>
              {t(tk)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === "industry" && (
          <View style={styles.grid}>
            {industries.map((ind) => {
              const active = selectedInd === ind.key;
              return (
                <TouchableOpacity
                  key={ind.key}
                  testID={`browse-${ind.key}`}
                  style={[styles.tile, active && styles.tileActive]}
                  onPress={() => setSelectedInd(active ? null : ind.key)}
                >
                  <View style={styles.tileIcon}>
                    <Ionicons name={ind.icon as any} size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.tileText}>{ind.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.listLabel}>
          {selectedInd
            ? `${industries.find((i) => i.key === selectedInd)?.label || ""} Jobs`
            : "All Jobs"}
        </Text>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : jobs.length === 0 ? (
          <Text style={styles.empty}>No jobs found.</Text>
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgApp,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  tabTextActive: { color: "#FFF" },
  scroll: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  tile: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 12,
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
  listLabel: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginTop: 12, marginBottom: 12 },
  empty: { textAlign: "center", color: COLORS.textSecondary, marginTop: 24 },
});
