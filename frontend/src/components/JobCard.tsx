import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { t } from "@/src/i18n/translations";
import { getJobField } from "@/src/utils/jobTranslation";
import { callAfterApply } from "@/src/utils/jobActions";

interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  distance_km?: number;
  salary_min: number;
  salary_max: number;
  experience: string;
  job_type: string;
  image_url?: string | null;
  translations?: Record<string, any>;
  contact_phone?: string | null;
}

function matchLabel(score: number): string {
  if (score >= 70) return "Best match";
  if (score >= 45) return "Good match";
  return "Match";
}

export default function JobCard({
  job,
  matchScore,
  callToApply,
  onApplied,
  layout = "list",
  style,
}: {
  job: Job;
  matchScore?: number;
  callToApply?: boolean;
  onApplied?: () => void;
  layout?: "list" | "carousel";
  style?: ViewStyle;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(false);
  const isCarousel = layout === "carousel";

  const tTitle = getJobField(job, "title") || job.title;
  const tExperience = getJobField(job, "experience") || job.experience;
  const tJobType = getJobField(job, "job_type") || job.job_type;

  const handleCall = async (e?: any) => {
    e?.stopPropagation?.();
    const didApply = await callAfterApply(job.id, job.contact_phone);
    if (!didApply) return;
    setApplied(true);
    onApplied?.();
  };

  return (
    <TouchableOpacity
      testID={`job-card-${job.id}`}
      activeOpacity={0.9}
      onPress={() => router.push(`/job/${job.id}` as any)}
      style={[styles.card, isCarousel && styles.cardCarousel, style]}
    >
      <View style={styles.topRow}>
        {job.image_url ? (
          <Image source={{ uri: job.image_url }} style={[styles.thumb, isCarousel && styles.thumbCarousel]} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, isCarousel && styles.thumbCarousel]}>
            <Ionicons name="briefcase" size={isCarousel ? 20 : 22} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.body}>
          {matchScore != null && matchScore > 0 ? (
            <View style={styles.matchBadge}>
              <Ionicons name="sparkles" size={11} color={COLORS.primary} />
              <Text style={styles.matchBadgeText}>
                {matchLabel(matchScore)}
                {matchScore >= 45 ? ` · ${matchScore}%` : ""}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.title, isCarousel && styles.titleCarousel]} numberOfLines={2}>
            {tTitle}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {job.company}
          </Text>
          <Text style={styles.salary} numberOfLines={1}>
            ₹{job.salary_min.toLocaleString("en-IN")} – ₹{job.salary_max.toLocaleString("en-IN")}
            <Text style={styles.salaryMonth}> /mo</Text>
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {job.city}
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {tExperience}
              </Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {tJobType}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        testID={`job-call-${job.id}`}
        onPress={handleCall}
        style={[styles.callBtn, applied && styles.appliedBtn, isCarousel && styles.callBtnCarousel]}
      >
        <Ionicons name={applied ? "checkmark" : "call"} size={16} color="#FFF" />
        <Text style={styles.callText}>
          {applied ? t("applied") : callToApply ? t("call_to_apply") : t("call")}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardCarousel: {
    marginBottom: 0,
    flex: 1,
  },
  topRow: { flexDirection: "row", gap: 12 },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  titleCarousel: { fontSize: 16 },
  matchBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  matchBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  company: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  salary: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginTop: 6 },
  salaryMonth: { fontSize: 12, fontWeight: "400", color: COLORS.textSecondary },
  location: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    maxWidth: "100%",
  },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  thumb: { width: 64, height: 64, borderRadius: RADIUS.md, flexShrink: 0 },
  thumbCarousel: { width: 56, height: 56 },
  thumbPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: {
    marginTop: 14,
    alignSelf: "stretch",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  callBtnCarousel: {
    marginTop: 12,
    paddingVertical: 11,
  },
  appliedBtn: { backgroundColor: COLORS.success },
  callText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
});
