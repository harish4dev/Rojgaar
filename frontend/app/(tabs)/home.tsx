import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { jobFilters, type JobFilterParams } from "@/src/store/jobFilters";
import JobCard from "@/src/components/JobCard";
import ScreenContainer from "@/src/components/ScreenContainer";
import EmptyState from "@/src/components/EmptyState";
import JobCardSkeleton from "@/src/components/JobCardSkeleton";
import { t } from "@/src/i18n/translations";
import ErrorBanner from "@/src/components/ErrorBanner";
import { getApiErrorMessage, isAccountNotFoundError, isUnauthorizedError } from "@/src/utils/apiError";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useTabBarInsets } from "@/src/hooks/useTabBarInsets";

interface Worker {
  id: string;
  name?: string;
  city?: string;
  skills?: string[];
  industries?: string[];
  profile_strength?: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  industry?: string;
  distance_km?: number;
  salary_min: number;
  salary_max: number;
  experience: string;
  job_type: string;
  image_url?: string | null;
  contact_phone?: string | null;
  match_score?: number;
  recommended?: boolean;
}

const RECOMMENDED_LIMIT = 8;
const MATCHED_JOBS_LIMIT = 50;

function lc(s: string) {
  return s.trim().toLowerCase();
}

function filterJobsByChip(jobs: Job[], chip: string, worker: Worker | null): Job[] {
  switch (chip) {
    case "daily":
      return jobs.filter((j) => j.job_type === "Daily Wage");
    case "full":
      return jobs.filter((j) => j.job_type === "Full Time");
    case "garments":
      return jobs.filter((j) => {
        const ind = lc(j.industry || "");
        return ind === "garments" || ind === "garment";
      });
    case "nearby":
      if (!worker?.city) return jobs;
      return jobs.filter((j) => lc(j.city) === lc(worker.city!));
    default:
      return jobs;
  }
}

function filterJobsBySearch(jobs: Job[], query: string): Job[] {
  const q = query.trim();
  if (!q) return jobs;
  const needle = lc(q);
  return jobs.filter((j) => {
    const hay = [j.title, j.company, j.industry, j.city].filter(Boolean).map((x) => lc(x!)).join(" ");
    return hay.includes(needle);
  });
}

const FILTERS = [
  { key: "all", label: () => t("all"), icon: "grid-outline" as const },
  { key: "nearby", label: () => t("nearby"), icon: "location" as const },
  { key: "daily", label: () => t("daily_wage"), icon: "cash-outline" as const },
  { key: "full", label: () => t("full_time"), icon: "briefcase-outline" as const },
  { key: "garments", label: () => t("garments"), icon: "shirt-outline" as const },
];

type JobListItem =
  | { type: "section"; id: string; title: string; sub?: string; count?: number }
  | { type: "job"; id: string; job: Job; recommended?: boolean };

function initials(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Home() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const { scrollBottomPadding } = useTabBarInsets();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<JobFilterParams | null>(null);
  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const wid = await session.getWorkerId();
    const token = await session.getAccessToken();
    if (!wid || !token) {
      router.replace("/onboarding/language");
      return;
    }
    try {
      setError(null);
      const w = await api.getWorker(wid);
      setWorker(w);
      const saved = await jobFilters.get();
      setAppliedFilters(saved);
      const recParams: Record<string, string | number> = {};
      if (saved?.industry) recParams.industry = saved.industry;
      if (saved?.job_type) recParams.job_type = saved.job_type;
      if (saved?.experience) recParams.experience = saved.experience;
      if (saved?.salary_min != null) recParams.salary_min = saved.salary_min;
      if (saved?.salary_max != null) recParams.salary_max = saved.salary_max;
      const matched = (await api.getWorkerRecommendations(wid, MATCHED_JOBS_LIMIT, recParams)) as Job[];
      setAllJobs(matched);
      const flagged = matched.filter((j) => j.recommended);
      setRecommendedJobs(
        (flagged.length > 0 ? flagged : matched).slice(0, RECOMMENDED_LIMIT)
      );
    } catch (e) {
      if (isUnauthorizedError(e) || isAccountNotFoundError(e)) {
        await session.clear();
        router.replace("/onboarding/phone");
        return;
      }
      setError(getApiErrorMessage(e, t("could_not_load_jobs")));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const filteredJobs = useMemo(
    () => filterJobsByChip(filterJobsBySearch(allJobs, search), activeChip, worker),
    [allJobs, search, activeChip, worker]
  );

  const topRecommendations = useMemo(() => {
    const recIds = new Set(recommendedJobs.map((j) => j.id));
    return filteredJobs.filter((j) => recIds.has(j.id));
  }, [filteredJobs, recommendedJobs]);

  const allJobsList = useMemo(() => {
    const recIds = new Set(topRecommendations.map((j) => j.id));
    return filteredJobs.filter((j) => !recIds.has(j.id));
  }, [filteredJobs, topRecommendations]);

  const filtersActive = Boolean(appliedFilters && Object.keys(appliedFilters).length > 0);

  const showProfileNudge = (worker?.profile_strength ?? 100) < 80;
  const hasActiveSearch = search.trim().length > 0;
  const hasChipFilter = activeChip !== "all";
  const isEmpty = !loading && topRecommendations.length === 0 && allJobsList.length === 0;

  const listItems = useMemo((): JobListItem[] => {
    const items: JobListItem[] = [];
    if (topRecommendations.length > 0) {
      items.push({
        type: "section",
        id: "rec-head",
        title: t("matched_for_you"),
        sub: t("matched_to_profile"),
        count: topRecommendations.length,
      });
      topRecommendations.forEach((j) =>
        items.push({ type: "job", id: `rec-${j.id}`, job: j, recommended: true })
      );
    }
    if (allJobsList.length > 0) {
      items.push({
        type: "section",
        id: "all-head",
        title: t("all_jobs"),
        count: allJobsList.length,
        sub: filtersActive ? t("filters_applied") : t("more_openings"),
      });
      allJobsList.forEach((j) => items.push({ type: "job", id: j.id, job: j }));
    }
    return items;
  }, [topRecommendations, allJobsList, filtersActive]);

  const clearFilters = async () => {
    await jobFilters.clear();
    setAppliedFilters(null);
    loadAll();
  };

  const renderHero = () => (
    <LinearGradient
      colors={["#1565C0", "#1A5FCC", "#0D3D8A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingHorizontal: horizontalPadding }]}
    >
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(worker?.name)}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {t("hi_user")}, {worker?.name?.split(" ")[0] || "there"} 👋
            </Text>
            <View style={styles.locationPill}>
              <Ionicons name="location" size={13} color="#FFF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {worker?.city || "Bengaluru"}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          testID="header-saved"
          onPress={() => router.push("/saved")}
          style={styles.iconBtn}
        >
          <Ionicons name="bookmark" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          testID="home-search"
          style={styles.searchInput}
          placeholder={t("search_jobs")}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.textSecondary}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="open-filter-from-home"
            onPress={() => router.push("/filter")}
            hitSlop={8}
            accessibilityLabel={t("find_jobs")}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => {
          const active = activeChip === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              testID={`chip-${f.key}`}
              onPress={() => setActiveChip(f.key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={active ? COLORS.primary : "rgba(255,255,255,0.9)"}
              />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );

  const renderListHeader = () => (
    <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
      {error ? (
        <ErrorBanner message={error} onRetry={() => loadAll()} onDismiss={() => setError(null)} />
      ) : null}
      {showProfileNudge ? (
        <TouchableOpacity
          testID="profile-nudge"
          style={styles.nudgeCard}
          onPress={() => router.push("/profile/edit" as any)}
          activeOpacity={0.85}
        >
          <View style={styles.nudgeIcon}>
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.nudgeBody}>
            <Text style={styles.nudgeTitle}>{t("profile_nudge_title")}</Text>
            <Text style={styles.nudgeSub}>
              {t("profile_nudge_sub").replace("{pct}", String(worker?.profile_strength ?? 0))}
            </Text>
            <View style={styles.nudgeBarWrap}>
              <View
                style={[styles.nudgeBarFill, { width: `${worker?.profile_strength ?? 0}%` }]}
              />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}

      {!loading && topRecommendations.length === 0 && allJobsList.length > 0 ? (
        <Text style={styles.subsectionSub}>
          {filtersActive || hasChipFilter || hasActiveSearch
            ? t("empty_no_matches_sub")
            : t("more_openings")}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.loaderWrap}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
          <Text style={styles.loaderText}>{t("loading_jobs")}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    const searchOrFilter = hasActiveSearch || filtersActive || hasChipFilter;
    return (
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <EmptyState
          icon={searchOrFilter ? "search-outline" : "briefcase-outline"}
          title={
            searchOrFilter ? t("empty_no_jobs_search_title") : t("empty_no_jobs_area_title")
          }
          subtitle={
            searchOrFilter ? t("empty_no_jobs_search_sub") : t("empty_no_jobs_area_sub")
          }
          actionLabel={
            searchOrFilter ? (hasActiveSearch ? t("clear_search") : t("remove_filters")) : t("change_city")
          }
          onAction={
            hasActiveSearch
              ? () => setSearch("")
              : filtersActive || hasChipFilter
                ? () => {
                    setActiveChip("all");
                    if (filtersActive) clearFilters();
                  }
                : () => router.push("/profile/edit" as any)
          }
          secondaryLabel={searchOrFilter ? t("browse_jobs") : undefined}
          onSecondary={
            searchOrFilter
              ? () => {
                  setSearch("");
                  setActiveChip("all");
                }
              : undefined
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="home-screen" edges={["top"]}>
      <ScreenContainer fill>
        <FlatList
          data={loading ? [] : listItems}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {renderHero()}
              {renderListHeader()}
            </>
          }
          ListEmptyComponent={isEmpty ? renderEmpty : null}
          renderItem={({ item }) => {
            if (item.type === "section") {
              return (
                <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionLeft}>
                      <Text style={styles.sectionTitle}>{item.title}</Text>
                      {item.count != null ? (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{item.count}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {item.sub ? <Text style={styles.sectionSub}>{item.sub}</Text> : null}
                </View>
              );
            }
            return (
              <View style={{ paddingHorizontal: horizontalPadding }}>
                <JobCard job={item.job} matchScore={item.job.match_score} callToApply />
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
          }
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  scrollContent: {},
  hero: {
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  heroLeft: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  heroText: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    maxWidth: "100%",
  },
  locationText: { color: "#FFF", fontSize: 12, fontWeight: "600", flexShrink: 1 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: "0 4px 16px rgba(0,0,0,0.1)" } as any,
    }),
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, minWidth: 0 },
  filtersRow: { gap: 8, paddingTop: 14, paddingRight: 4 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.bgCard,
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.95)" },
  filterChipTextActive: { color: COLORS.primary },
  body: { paddingTop: 16 },
  nudgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  nudgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nudgeBody: { flex: 1, minWidth: 0 },
  nudgeTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  nudgeSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  nudgeBarWrap: {
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  nudgeBarFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  sectionSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 14 },
  subsection: { marginBottom: 20 },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subsectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  viewAll: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  loaderWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loaderText: { color: COLORS.textSecondary, fontSize: 14 },
});
