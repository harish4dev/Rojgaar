import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";
import ScreenContainer from "@/src/components/ScreenContainer";
import EmptyState from "@/src/components/EmptyState";
import ErrorBanner from "@/src/components/ErrorBanner";
import { viewedJobs, type ViewedJobRecord } from "@/src/store/viewedJobs";
import { getApiErrorMessage } from "@/src/utils/apiError";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useTabBarInsets } from "@/src/hooks/useTabBarInsets";

type Tab = "applied" | "viewed" | "saved";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Contacted: { bg: COLORS.successBg, fg: COLORS.success },
  Pending: { bg: COLORS.warningBg, fg: COLORS.warning },
  "Not Selected": { bg: COLORS.errorBg, fg: COLORS.error },
  Hired: { bg: COLORS.successBg, fg: COLORS.success },
};

export default function ActivityScreen() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const { scrollBottomPadding } = useTabBarInsets();
  const [tab, setTab] = useState<Tab>("applied");
  const [applied, setApplied] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [viewed, setViewed] = useState<ViewedJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) return;
    setLoading(true);
    try {
      setError(null);
      const [apps, sv, recent] = await Promise.all([
        api.listApplications(wid),
        api.listSavedJobs(wid),
        viewedJobs.list(),
      ]);
      setApplied(apps);
      setSaved(sv);
      setViewed(recent);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load activity."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const counts = { applied: applied.length, viewed: viewed.length, saved: saved.length };

  return (
    <SafeAreaView style={styles.container} testID="activity-screen" edges={["top"]}>
      <ScreenContainer>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Text style={styles.title}>{t("activity")}</Text>
          <Text style={styles.subtitle}>Track applications and saved jobs</Text>
        </View>

        <View style={[styles.tabsRow, { paddingHorizontal: horizontalPadding }]}>
          {(["applied", "viewed", "saved"] as Tab[]).map((tk) => (
            <TouchableOpacity
              key={tk}
              testID={`activity-tab-${tk}`}
              onPress={() => setTab(tk)}
              style={[styles.tab, tab === tk && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === tk && styles.tabTextActive]} numberOfLines={1}>
                {t(tk)}
              </Text>
              {counts[tk] > 0 ? (
                <View style={[styles.countBadge, tab === tk && styles.countBadgeActive]}>
                  <Text style={[styles.countText, tab === tk && styles.countTextActive]}>
                    {counts[tk]}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingHorizontal: horizontalPadding, paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <ErrorBanner message={error} onRetry={load} onDismiss={() => setError(null)} />
          ) : null}
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading activity...</Text>
            </View>
          ) : null}

          {!loading && tab === "applied" && (
            applied.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No applications yet"
                subtitle="Jobs you apply to will show up here with their status."
              />
            ) : (
              applied.map((a) => (
                <ApplicationRow
                  key={a.id}
                  a={a}
                  wide={false}
                  onPress={() => router.push(`/job/${a.job_id}` as any)}
                />
              ))
            )
          )}

          {!loading && tab === "viewed" && (
            viewed.length === 0 ? (
              <EmptyState
                icon="eye-outline"
                title="No recently viewed jobs"
                subtitle="Jobs you open will appear here for quick access."
              />
            ) : (
              viewed.map((j) => (
                <TouchableOpacity
                  key={j.id}
                  testID={`viewed-row-${j.id}`}
                  onPress={() => router.push(`/job/${j.id}` as any)}
                  style={styles.row}
                >
                  {j.image_url ? (
                    <Image source={{ uri: j.image_url }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="briefcase" size={20} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {j.title}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {j.company}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      Viewed {new Date(j.viewed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))
            )
          )}

          {!loading && tab === "saved" && (
            saved.length === 0 ? (
              <EmptyState
                icon="bookmark-outline"
                title="No saved jobs"
                subtitle="Tap the bookmark icon on a job to save it for later."
              />
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
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="briefcase" size={20} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {j.title}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {j.company}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      ₹{j.salary_min.toLocaleString("en-IN")} - ₹{j.salary_max.toLocaleString("en-IN")} • {j.city}
                    </Text>
                  </View>
                  <Ionicons name="bookmark" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

function ApplicationRow({
  a,
  onPress,
  wide,
}: {
  a: any;
  onPress: () => void;
  wide?: boolean;
}) {
  const status = a.status || "Pending";
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  const job = a.job || {};

  return (
    <TouchableOpacity
      testID={`app-row-${a.id}`}
      onPress={onPress}
      style={[styles.row, wide && styles.rowWide]}
    >
      <View style={[styles.thumb, styles.thumbPlaceholder]}>
        <Ionicons name="briefcase" size={22} color={COLORS.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {job.title || "Job"}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {job.company || ""}
        </Text>
        <Text style={styles.rowMeta}>
          {t("applied_on")} {new Date(a.applied_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.badgeText, { color: colors.fg }]} numberOfLines={1}>
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  header: { paddingTop: 16, paddingBottom: 12, backgroundColor: COLORS.bgCard },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.bgCard,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgApp,
    minWidth: 0,
  },
  tabActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600", flexShrink: 1 },
  tabTextActive: { color: COLORS.primary },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeActive: { backgroundColor: COLORS.primary },
  countText: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  countTextActive: { color: "#FFF" },
  list: { paddingTop: 16 },
  loaderWrap: { alignItems: "center", paddingVertical: 32, gap: 10 },
  loaderText: { color: COLORS.textSecondary, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rowWide: { padding: 16 },
  rowBody: { flex: 1, minWidth: 0 },
  thumb: { width: 52, height: 52, borderRadius: RADIUS.md, flexShrink: 0 },
  thumbPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  rowSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  rowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    flexShrink: 0,
    maxWidth: 100,
  },
  badgeText: { fontSize: 11, fontWeight: "700", textAlign: "center" },
});
