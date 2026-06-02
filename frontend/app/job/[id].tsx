import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";
import { getJobField, getJobRequirements } from "@/src/utils/jobTranslation";
import { callAfterApply } from "@/src/utils/jobActions";
import { viewedJobs } from "@/src/store/viewedJobs";
import { getApiErrorMessage } from "@/src/utils/apiError";
import ErrorBanner from "@/src/components/ErrorBanner";
import ScreenContainer from "@/src/components/ScreenContainer";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, 12);
  const [job, setJob] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setError(null);
      const [j, savedList] = await Promise.all([
        api.getJob(id),
        session.getWorkerId().then((wid) => (wid ? api.listSavedJobs(wid) : [])),
      ]);
      setJob(j);
      setSaved(savedList.some((s: any) => s.id === id));
      await viewedJobs.add({
        id: j.id,
        title: j.title,
        company: j.company,
        city: j.city,
        salary_min: j.salary_min,
        salary_max: j.salary_max,
        image_url: j.image_url,
      });
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load this job."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = async () => {
    const wid = await session.getWorkerId();
    if (!wid || !job) return;
    if (saved) {
      await api.unsaveJob(wid, job.id);
      setSaved(false);
    } else {
      await api.saveJob(wid, job.id);
      setSaved(true);
    }
  };

  const handleCall = async () => {
    if (!job) return;
    await callAfterApply(job.id, job.contact_phone);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.loaderWrap, { padding: 24 }]}>
          {error ? <ErrorBanner message={error} onRetry={load} /> : null}
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="job-detail" edges={["bottom"]}>
      <ScreenContainer>
        <View style={styles.headerImageWrap}>
          {job.image_url ? (
            <Image source={{ uri: job.image_url }} style={styles.headerImage} />
          ) : (
            <View
              style={[
                styles.headerImage,
                { backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Ionicons name="briefcase" size={64} color={COLORS.primary} />
            </View>
          )}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding, paddingBottom: 120 + footerBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleBody}>
              <Text style={styles.title}>{getJobField(job, "title") || job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
            </View>
            <View style={styles.ratingChip}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{job.rating}</Text>
            </View>
          </View>

          <Text style={styles.salary}>
            ₹{job.salary_min.toLocaleString("en-IN")} - ₹{job.salary_max.toLocaleString("en-IN")}{" "}
            <Text style={styles.salaryMonth}>/month</Text>
          </Text>

          <View style={styles.metaRow}>
            <Meta label={job.city} sub={`${job.distance_km} km away`} icon="location" />
            <Meta label={getJobField(job, "experience") || job.experience} sub={t("experience")} icon="briefcase" />
            <Meta label={getJobField(job, "job_type") || job.job_type} sub={t("job_type")} icon="time" />
          </View>

          <Text style={styles.sectionTitle}>{t("job_description")}</Text>
          <Text style={styles.desc}>{getJobField(job, "description") || job.description}</Text>

          {getJobRequirements(job).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t("requirements")}</Text>
              {getJobRequirements(job).map((r: string, i: number) => (
                <View key={i} style={styles.reqRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.reqText}>{r}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingHorizontal: horizontalPadding, paddingBottom: footerBottomPadding }]}>
          <TouchableOpacity testID="save-btn" onPress={toggleSave} style={styles.saveBtn}>
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={saved ? COLORS.primary : COLORS.textPrimary}
            />
            <Text style={[styles.saveLabel, saved && { color: COLORS.primary }]}>
              {saved ? t("saved") : t("save")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity testID="call-apply" onPress={handleCall} style={styles.applyBtn}>
            <Ionicons name="call" size={18} color="#FFF" />
            <Text style={styles.applyText}>{t("call_to_apply")}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

function Meta({ label, sub, icon }: { label: string; sub: string; icon: any }) {
  return (
    <View style={styles.metaCol}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.metaLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.metaSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loaderText: { color: COLORS.textSecondary, fontSize: 14 },
  headerImageWrap: { position: "relative" },
  headerImage: { width: "100%", height: 220 },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  content: { paddingTop: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleBody: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
  company: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  salary: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginTop: 14 },
  salaryMonth: { fontSize: 14, fontWeight: "400", color: COLORS.textSecondary },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: "space-between",
  },
  metaCol: { alignItems: "center", flex: 1, minWidth: 90 },
  metaLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 4, textAlign: "center" },
  metaSub: { fontSize: 11, color: COLORS.textSecondary, textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginTop: 22, marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 24, color: COLORS.textSecondary },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  reqText: { fontSize: 15, color: COLORS.textPrimary, flex: 1, lineHeight: 22 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingTop: 12,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 12,
  },
  saveBtn: {
    width: 76,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    flexShrink: 0,
  },
  saveLabel: { fontSize: 11, color: COLORS.textPrimary, marginTop: 4, fontWeight: "600" },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    minWidth: 0,
  },
  applyText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
