import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { t } from "@/src/i18n/translations";

interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  distance_km: number;
  salary_min: number;
  salary_max: number;
  experience: string;
  job_type: string;
  image_url?: string | null;
}

export default function JobCard({ job, onCall }: { job: Job; onCall?: () => void }) {
  const router = useRouter();
  const handleCall = () => {
    if (onCall) {
      onCall();
      return;
    }
    if (Platform.OS !== "web") {
      Linking.openURL("tel:+919876543210").catch(() => {});
    }
  };
  return (
    <TouchableOpacity
      testID={`job-card-${job.id}`}
      activeOpacity={0.9}
      onPress={() => router.push(`/job/${job.id}` as any)}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.salary}>
            ₹{job.salary_min.toLocaleString("en-IN")} - ₹{job.salary_max.toLocaleString("en-IN")}{" "}
            <Text style={styles.salaryMonth}>/month</Text>
          </Text>
          <Text style={styles.location}>
            {job.city} • {job.distance_km} km
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{job.experience}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{job.job_type}</Text>
            </View>
          </View>
        </View>
        {job.image_url ? (
          <Image source={{ uri: job.image_url }} style={styles.thumb} />
        ) : null}
      </View>
      <TouchableOpacity
        testID={`job-call-${job.id}`}
        onPress={handleCall}
        style={styles.callBtn}
      >
        <Ionicons name="call" size={16} color="#FFF" />
        <Text style={styles.callText}>{t("call")}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  topRow: { flexDirection: "row", gap: 12 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
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
  },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  thumb: { width: 60, height: 60, borderRadius: RADIUS.md },
  callBtn: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  callText: { color: "#FFF", fontWeight: "600", fontSize: 13 },
});
