import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";
import { getJobField, getJobRequirements } from "@/src/utils/jobTranslation";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [j, savedList] = await Promise.all([
        api.getJob(id),
        session.getWorkerId().then((wid) => (wid ? api.listSavedJobs(wid) : [])),
      ]);
      setJob(j);
      setSaved(savedList.some((s: any) => s.id === id));
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
    const wid = await session.getWorkerId();
    if (wid && job) {
      await api.apply(wid, job.id);
    }
    if (Platform.OS === "web") {
      Alert.alert(t("applied_success"), t("applied_success_caption"));
    } else {
      Linking.openURL("tel:+919876543210").catch(() => {
        Alert.alert(t("applied_success"), t("applied_success_caption"));
      });
    }
  };

  if (loading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="job-detail" edges={["bottom"]}>
      <View style={styles.headerImageWrap}>
        {job.image_url ? (
          <Image source={{ uri: job.image_url }} style={styles.headerImage} />
        ) : (
          <View style={[styles.headerImage, { backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="briefcase" size={64} color={COLORS.primary} />
          </View>
        )}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
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

      <View style={styles.footer}>
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
    </SafeAreaView>
  );
}

function Meta({ label, sub, icon }: { label: string; sub: string; icon: any }) {
  return (
    <View style={styles.metaCol}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  headerImageWrap: { position: "relative" },
  headerImage: { width: "100%", height: 200 },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, paddingBottom: 120 },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  company: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  salary: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, marginTop: 12 },
  salaryMonth: { fontSize: 13, fontWeight: "400", color: COLORS.textSecondary },
  metaRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginTop: 16,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metaCol: { alignItems: "center", flex: 1 },
  metaLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 4 },
  metaSub: { fontSize: 11, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginTop: 20, marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  reqText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 12,
  },
  saveBtn: {
    width: 72,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
  },
  applyText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
