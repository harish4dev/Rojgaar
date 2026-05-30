import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import JobCard from "@/src/components/JobCard";
import ScreenContainer from "@/src/components/ScreenContainer";
import EmptyState from "@/src/components/EmptyState";
import { t } from "@/src/i18n/translations";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useTabBarInsets } from "@/src/hooks/useTabBarInsets";

interface Industry {
  key: string;
  label: string;
  icon: string;
}

export default function JobsTab() {
  const router = useRouter();
  const { horizontalPadding, tileSize, gutter } = useResponsive();
  const { scrollBottomPadding } = useTabBarInsets();
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
    <SafeAreaView style={styles.container} testID="jobs-tab" edges={["top"]}>
      <ScreenContainer>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t("browse_jobs")}</Text>
            <Text style={styles.subtitle}>Filter by industry, city, or skills</Text>
          </View>
          <TouchableOpacity
            testID="open-filter"
            onPress={() => router.push("/filter")}
            style={styles.filterBtn}
          >
            <Ionicons name="options" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.tabsRow, { paddingHorizontal: horizontalPadding }]}>
          {(["city", "industry", "skills"] as const).map((tk) => (
            <TouchableOpacity
              key={tk}
              testID={`tab-${tk}`}
              onPress={() => setActiveTab(tk)}
              style={[styles.tab, activeTab === tk && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tk && styles.tabTextActive]} numberOfLines={1}>
                {t(tk)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding, paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "industry" && (
            <View style={styles.quickFilterRow}>
              <TouchableOpacity
                testID="browse-all"
                style={[styles.quickFilterChip, !selectedInd && styles.quickFilterChipActive]}
                onPress={() => setSelectedInd(null)}
              >
                <Text style={[styles.quickFilterText, !selectedInd && styles.quickFilterTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {selectedInd ? (
                <TouchableOpacity
                  testID="clear-industry-filter"
                  style={styles.clearFilterChip}
                  onPress={() => setSelectedInd(null)}
                >
                  <Ionicons name="close-circle" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.clearFilterText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {activeTab === "industry" && (
            <View style={[styles.grid, { gap: gutter }]}>
              {industries.map((ind) => {
                const active = selectedInd === ind.key;
                return (
                  <TouchableOpacity
                    key={ind.key}
                    testID={`browse-${ind.key}`}
                    style={[
                      styles.tile,
                      { width: tileSize, height: tileSize },
                      active && styles.tileActive,
                    ]}
                    onPress={() => setSelectedInd(active ? null : ind.key)}
                  >
                    <View style={styles.tileIcon}>
                      <Ionicons name={ind.icon as any} size={22} color={COLORS.primary} />
                    </View>
                    <Text style={styles.tileText} numberOfLines={2}>
                      {ind.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {activeTab === "city" && (
            <EmptyState
              icon="location-outline"
              title="City filter coming soon"
              subtitle="Use the filter button to narrow jobs by location for now."
            />
          )}

          {activeTab === "skills" && (
            <EmptyState
              icon="construct-outline"
              title="Skills filter coming soon"
              subtitle="Browse by industry below or use advanced filters."
            />
          )}

          <Text style={styles.listLabel}>
            {selectedInd
              ? `${industries.find((i) => i.key === selectedInd)?.label || ""} Jobs`
              : "All Jobs"}{" "}
            {!loading ? `(${jobs.length})` : ""}
          </Text>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading jobs...</Text>
            </View>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No jobs found"
              subtitle="Try clearing filters or choosing another industry."
            />
          ) : (
            jobs.map((j) => <JobCard key={j.id} job={j} />)
          )}
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    backgroundColor: COLORS.bgCard,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgApp,
    flexShrink: 0,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgApp,
    alignItems: "center",
    minWidth: 0,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  tabTextActive: { color: "#FFF" },
  scroll: { paddingTop: 4 },
  quickFilterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  quickFilterChip: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  quickFilterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  quickFilterText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  quickFilterTextActive: { color: COLORS.primary },
  clearFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  clearFilterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  tile: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 0,
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
  tileText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  listLabel: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  loaderWrap: { alignItems: "center", marginTop: 20, gap: 8 },
  loaderText: { color: COLORS.textSecondary, fontSize: 13 },
});
