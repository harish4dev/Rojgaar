import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PortalLayout, { StatCard } from "@/src/components/PortalLayout";
import { api } from "@/src/api/client";

const DEMO_PHONE = "9999999999";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "stats-chart" as const },
  { key: "jobs", label: "Jobs", icon: "briefcase" as const },
  { key: "applications", label: "Applications", icon: "documents" as const },
  { key: "workers", label: "Workers", icon: "people" as const },
  { key: "analytics", label: "Analytics", icon: "trending-up" as const },
  { key: "messages", label: "Messages", icon: "chatbubbles" as const },
  { key: "settings", label: "Settings", icon: "settings" as const },
];

const INDUSTRIES = [
  { key: "construction", label: "Construction", icon: "construct" as const },
  { key: "factory", label: "Factory", icon: "business" as const },
  { key: "delivery", label: "Delivery", icon: "car" as const },
  { key: "driver", label: "Driver", icon: "car-sport" as const },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" as const },
];

export default function BusinessPortal() {
  const [active, setActive] = useState("dashboard");
  const [business, setBusiness] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Post job form
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("construction");
  const [city, setCity] = useState("Bengaluru");
  const [salaryMin, setSalaryMin] = useState("10000");
  const [salaryMax, setSalaryMax] = useState("30000");
  const [description, setDescription] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      // Auto-login the demo business via mock OTP
      const res = await api.verifyOtp(DEMO_PHONE, "0000", "business");
      const biz = res.user;
      setBusiness(biz);
      const [s, j, apps] = await Promise.all([
        api.getBusinessStats(biz.id),
        api.getBusinessJobs(biz.id),
        api.getBusinessApplications(biz.id),
      ]);
      setStats(s);
      setJobs(j);
      setApplications(apps);
      const expanded: Record<string, boolean> = {};
      for (const app of apps) expanded[app.job_id] = true;
      setExpandedJobs(expanded);
    } catch (e) {
      console.warn("Business load failed", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePost = async () => {
    if (!business || !title) return;
    try {
      setPosting(true);
      await api.createJob({
        title,
        company: business.company,
        industry,
        city,
        salary_min: parseInt(salaryMin) || 0,
        salary_max: parseInt(salaryMax) || 0,
        description: description || "Posted via Business Portal.",
        posted_by_business_id: business.id,
      });
      setTitle("");
      setDescription("");
      Alert.alert("Job Posted", "Your job has been posted successfully.");
      load();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to post job");
    } finally {
      setPosting(false);
    }
  };

  const handleApplicationAction = async (appId: string, status: "Accepted" | "Rejected") => {
    setUpdatingId(appId);
    try {
      await api.updateApplicationStatus(appId, status);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update application");
    } finally {
      setUpdatingId(null);
    }
  };

  const appsByJob = applications.reduce<Record<string, any[]>>((acc, app) => {
    if (!acc[app.job_id]) acc[app.job_id] = [];
    acc[app.job_id].push(app);
    return acc;
  }, {});

  return (
    <PortalLayout
      title="Business Portal"
      userName={business?.name || "Business"}
      userRole="Owner"
      nav={NAV}
      activeKey={active}
      onNavSelect={setActive}
    >
      <Text style={styles.h1}>Dashboard</Text>

      <View style={styles.statsRow}>
        <StatCard testID="stat-active-jobs" icon="briefcase" value={String(stats?.active_jobs ?? "—")} label="Active Jobs" color="#FF6B1A" />
        <StatCard testID="stat-applications" icon="document-text" value={String(stats?.applications ?? "—")} label="Applications" color="#10B981" />
        <StatCard testID="stat-hired" icon="people" value={String(stats?.hired ?? "—")} label="Hired" color="#3B82F6" />
        <StatCard testID="stat-views" icon="eye" value={String(stats?.profile_views ?? "—")} label="Profile Views" color="#A855F7" />
      </View>

      <View style={[styles.card, { marginBottom: 16 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.h2}>Your Jobs & Applicants</Text>
          <Text style={styles.link}>{applications.length} total</Text>
        </View>
        {jobs.length === 0 ? (
          <Text style={styles.empty}>No jobs yet. Post your first job →</Text>
        ) : (
          jobs.map((job) => {
            const jobApps = appsByJob[job.id] || [];
            const isOpen = expandedJobs[job.id];
            return (
              <View key={job.id} style={styles.jobBlock}>
                <TouchableOpacity
                  onPress={() => setExpandedJobs((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
                  style={styles.jobBlockHeader}
                >
                  <Text style={styles.jobBlockTitle}>{job.title}</Text>
                  <Text style={styles.jobBlockMeta}>
                    {job.city} · {jobApps.length} applicants
                  </Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.jobBlockBody}>
                    {jobApps.length === 0 ? (
                      <Text style={styles.empty}>No applications yet.</Text>
                    ) : (
                      jobApps.map((app) => (
                        <View key={app.id} style={styles.applicantCard} testID={`biz-app-${app.id}`}>
                          <Text style={styles.applicantName}>
                            {app.worker?.name || app.worker?.phone || "Unknown"}
                          </Text>
                          <Text style={styles.applicantDetail}>Phone: {app.worker?.phone || "—"}</Text>
                          <Text style={styles.applicantDetail}>City: {app.worker?.city || "—"}</Text>
                          <Text style={styles.applicantDetail}>
                            Skills: {app.worker?.skills?.join(", ") || "—"}
                          </Text>
                          <Text style={styles.applicantDetail}>
                            Experience: {app.worker?.experience || "—"}
                          </Text>
                          <Text style={styles.applicantDetail}>Status: {app.status}</Text>
                          {app.status === "Pending" && (
                            <View style={styles.actionRow}>
                              <TouchableOpacity
                                style={styles.acceptBtn}
                                disabled={updatingId === app.id}
                                onPress={() => handleApplicationAction(app.id, "Accepted")}
                              >
                                <Text style={styles.acceptBtnText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectBtn}
                                disabled={updatingId === app.id}
                                onPress={() => handleApplicationAction(app.id, "Rejected")}
                              >
                                <Text style={styles.rejectBtnText}>Reject</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.card, { flex: 2 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.h2}>Recent Jobs</Text>
            <TouchableOpacity testID="biz-view-all-jobs">
              <Text style={styles.link}>View all jobs</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Job Title</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Location</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Posted On</Text>
            <Text style={[styles.th, { flex: 1 }]}>Applications</Text>
            <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          </View>
          {jobs.length === 0 ? (
            <Text style={styles.empty}>No jobs yet. Post your first job →</Text>
          ) : (
            jobs.slice(0, 6).map((j) => (
              <View key={j.id} style={styles.tr} testID={`biz-job-${j.id}`}>
                <Text style={[styles.td, { flex: 2, fontWeight: "600" }]} numberOfLines={1}>
                  {j.title}
                </Text>
                <Text style={[styles.td, { flex: 1.2 }]}>{j.city}</Text>
                <Text style={[styles.td, { flex: 1.4 }]}>
                  {new Date(j.created_at).toLocaleDateString()}
                </Text>
                <Text style={[styles.td, { flex: 1 }]}>{j.applications_count}</Text>
                <View style={[styles.statusBadge, { flex: 1 }]}>
                  <View style={[styles.dot, { backgroundColor: j.active ? COLORS.success : COLORS.error }]} />
                  <Text style={[styles.tdSmall, { color: j.active ? COLORS.success : COLORS.error }]}>
                    {j.active ? "Active" : "Closed"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.h2}>Post a New Job</Text>
          <Text style={styles.label}>Job Title</Text>
          <TextInput
            testID="post-title"
            style={styles.input}
            placeholder="e.g. Mason, Electrician"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>Select Industry</Text>
          <View style={styles.indGrid}>
            {INDUSTRIES.map((ind) => {
              const a = industry === ind.key;
              return (
                <TouchableOpacity
                  key={ind.key}
                  testID={`post-industry-${ind.key}`}
                  onPress={() => setIndustry(ind.key)}
                  style={[styles.indTile, a && styles.indTileActive]}
                >
                  <Ionicons name={ind.icon} size={18} color={a ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.indLabel, a && { color: COLORS.primary }]}>{ind.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Location</Text>
          <TextInput
            testID="post-city"
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>Salary Range (Min - Max)</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              testID="post-salary-min"
              style={[styles.input, { flex: 1 }]}
              keyboardType="number-pad"
              value={salaryMin}
              onChangeText={setSalaryMin}
              placeholder="10000"
              placeholderTextColor={COLORS.textSecondary}
            />
            <TextInput
              testID="post-salary-max"
              style={[styles.input, { flex: 1 }]}
              keyboardType="number-pad"
              value={salaryMax}
              onChangeText={setSalaryMax}
              placeholder="30000"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            testID="post-desc"
            style={[styles.input, { height: 70 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Tell workers about this role..."
            placeholderTextColor={COLORS.textSecondary}
          />

          <TouchableOpacity
            testID="post-job-btn"
            onPress={handlePost}
            disabled={!title || posting}
            style={[styles.cta, (!title || posting) && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaText}>{posting ? "Posting…" : "Post Job"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 16 },
  h2: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  twoCol: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    minWidth: 320,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  th: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, textTransform: "uppercase" },
  tr: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: "center",
  },
  td: { fontSize: 13, color: COLORS.textPrimary },
  tdSmall: { fontSize: 12, fontWeight: "600" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { color: COLORS.textSecondary, textAlign: "center", paddingVertical: 24 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  indGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  indTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  indTileActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  indLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 16,
  },
  ctaText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  jobBlock: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    marginTop: 10,
    overflow: "hidden",
  },
  jobBlockHeader: {
    padding: 12,
    backgroundColor: COLORS.bgApp,
  },
  jobBlockTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  jobBlockMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  jobBlockBody: { padding: 12, gap: 10 },
  applicantCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgApp,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 8,
  },
  applicantName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  applicantDetail: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  acceptBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  rejectBtnText: { color: COLORS.error, fontWeight: "700", fontSize: 13 },
});
