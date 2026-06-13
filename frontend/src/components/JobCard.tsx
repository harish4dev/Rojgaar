import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
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

export default function JobCard({
  job,
  matchScore,
  callToApply,
  onApplied,
}: {
  job: Job;
  matchScore?: number;
  callToApply?: boolean;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(false);

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
      style={styles.card}
    >
      <View style={styles.topRow}>
        {job.image_url ? (
          <Image source={{ uri: job.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="briefcase" size={22} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {tTitle}
            </Text>
            {matchScore != null && matchScore > 0 ? (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{matchScore}% match</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.company} numberOfLines={1}>
            {job.company}
          </Text>
          <Text style={styles.salary}>
            ₹{job.salary_min.toLocaleString("en-IN")} - ₹{job.salary_max.toLocaleString("en-IN")}{" "}
            <Text style={styles.salaryMonth}>/month</Text>
          </Text>
          <Text style={styles.location}>{job.city}</Text>
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
        style={[styles.callBtn, applied && styles.appliedBtn]}
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
  topRow: { flexDirection: "row", gap: 12 },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, flex: 1 },
  matchBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
  matchBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
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
  appliedBtn: { backgroundColor: COLORS.success },
  callText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
});
