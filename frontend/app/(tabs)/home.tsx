import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import { t } from "@/src/i18n/translations";
import ErrorBanner from "@/src/components/ErrorBanner";
import { getApiErrorMessage } from "@/src/utils/apiError";
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
  distance_km: number;
  salary_min: number;
  salary_max: number;
  experience: string;
  job_type: string;
  image_url?: string | null;
}

const RECOMMENDED_LIMIT = 5;

function lc(s: string) {
  return s.trim().toLowerCase();
}

function scoreJob(job: Job, worker: Worker | null): number {
  if (!worker) return 0;
  let score = 0;
  if (worker.city && lc(job.city) === lc(worker.city)) score += 3;
  const hay = [job.title, job.industry, job.company].filter(Boolean).map((x) => lc(x!)).join(" ");
  for (const skill of worker.skills ?? []) {
    if (skill && hay.includes(lc(skill))) score += 2;
  }
  for (const ind of worker.industries ?? []) {
    const indLc = lc(ind);
    if (job.industry && lc(job.industry) === indLc) score += 2;
    else if (ind && hay.includes(indLc)) score += 1;
  }
  return score;
}

function pickRecommended(jobs: Job[], worker: Worker | null): Job[] {
  if (!jobs.length) return [];
  const scored = jobs
    .map((job) => ({ job, score: scoreJob(job, worker) }))
    .sort((a, b) => b.score - a.score);
  const withSignal = scored.filter((s) => s.score > 0);
  const pool = withSignal.length > 0 ? withSignal : scored;
  return pool.slice(0, RECOMMENDED_LIMIT).map((s) => s.job);
}

function filterJobsByChip(jobs: Job[], chip: string, worker: Worker | null): Job[] {
  switch (chip) {
    case "daily":
      return jobs.filter((j) => j.job_type === "Daily Wage");
    case "full":
      return jobs.filter((j) => j.job_type === "Full Time");
    case "construction":
      return jobs.filter((j) => j.industry === "construction");
    case "nearby":
      if (!worker?.city) return jobs;
      return jobs.filter((j) => lc(j.city) === lc(worker.city));
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
  { key: "nearby", label: () => t("nearby"), icon: "location" as const },
  { key: "daily", label: () => t("daily_wage"), icon: "cash-outline" as const },
  { key: "full", label: () => t("full_time"), icon: "briefcase-outline" as const },
  { key: "construction", label: () => "Construction", icon: "construct-outline" as const },
];

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
  const [appliedFilters, setAppliedFilters] = useState<JobFilterParams | null>(null);
  const [activeChip, setActiveChip] = useState("nearby");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) {
      router.replace("/onboarding/language");
      return;
    }
    try {
      setError(null);
      const w = await api.getWorker(wid);
      setWorker(w);
      const saved = await jobFilters.get();
      setAppliedFilters(saved);
      const params: Record<string, string | number> = { limit: 100 };
      if (saved?.job_type) params.job_type = saved.job_type;
      if (saved?.industry) params.industry = saved.industry;
      if (saved?.experience) params.experience = saved.experience;
      if (saved?.salary_min != null) params.salary_min = saved.salary_min;
      if (saved?.salary_max != null) params.salary_max = saved.salary_max;
      const data: Job[] = await api.listJobs(params);
      setAllJobs(data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load jobs."));
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

  const activeChipLabel = useMemo(
    () => FILTERS.find((f) => f.key === activeChip)?.label() ?? t("nearby"),
    [activeChip]
  );

  const allJobsList = useMemo(
    () => filterJobsBySearch(allJobs, search),
    [allJobs, search]
  );

  const recommendedJobs = useMemo(() => {
    const pool = filterJobsByChip(allJobs, activeChip, worker);
    return pickRecommended(pool, worker);
  }, [allJobs, activeChip, worker]);

  const filtersActive = Boolean(appliedFilters && Object.keys(appliedFilters).length > 0);

  const showProfileNudge = (worker?.profile_strength ?? 100) < 80;

  return (
    <SafeAreaView style={styles.container} testID="home-screen" edges={["top"]}>
      <ScreenContainer fill>
        <ScrollView
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        >
          {/* Hero */}
          <LinearGradient
            colors={["#FF6B1A", "#FF8534", "#FFA04D"]}
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

          {/* Sticky quick actions */}
          <View style={[styles.quickActionsBar, { paddingHorizontal: horizontalPadding }]}>
            <QuickAction
              icon="bookmark-outline"
              label={t("saved_jobs")}
              onPress={() => router.push("/saved")}
              testID="quick-saved"
            />
            <QuickAction
              icon="options-outline"
              label={t("filter_jobs")}
              onPress={() => router.push("/filter")}
              testID="quick-filter"
            />
          </View>

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
                  <Text style={styles.nudgeTitle}>Complete your profile</Text>
                  <Text style={styles.nudgeSub}>
                    {worker?.profile_strength ?? 0}% done — stronger profiles get more calls
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

            <View style={styles.sectionHeader}>
              <View style={styles.sectionLeft}>
                <Text style={styles.sectionTitle}>{t("jobs")}</Text>
                {!loading && allJobsList.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{allJobsList.length}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.sectionSub}>
              {loading
                ? "Loading..."
                : filtersActive
                  ? `${allJobsList.length} jobs · ${t("filters_applied")}`
                  : `${allJobsList.length} jobs`}
            </Text>

            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.loaderText}>Finding jobs for you...</Text>
              </View>
            ) : allJobsList.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="No jobs found"
                subtitle={
                  filtersActive || search.trim()
                    ? "Try clearing filters or your search."
                    : "Check back soon for new openings."
                }
              />
            ) : (
              <>
                {recommendedJobs.length > 0 ? (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>{t("recommended_for_you")}</Text>
                    <Text style={styles.subsectionSub}>{activeChipLabel}</Text>
                    {recommendedJobs.map((j) => (
                      <JobCard key={`rec-${j.id}`} job={j} />
                    ))}
                  </View>
                ) : null}
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>{t("all_jobs")}</Text>
                  {allJobsList.map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.quickAction} activeOpacity={0.8}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
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
  quickActionsBar: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 14,
    backgroundColor: COLORS.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 0,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
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
  subsection: { marginBottom: 8 },
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
