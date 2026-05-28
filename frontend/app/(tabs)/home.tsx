import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import JobCard from "@/src/components/JobCard";
import { t } from "@/src/i18n/translations";

interface Worker {
  id: string;
  name?: string;
  city?: string;
  skills?: string[];
}

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

const CHIPS = [
  { key: "nearby", label: "Nearby" },
  { key: "daily", label: "Daily Wage" },
  { key: "full", label: "Full Time" },
  { key: "construction", label: "Construction" },
];

export default function Home() {
  const router = useRouter();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeChip, setActiveChip] = useState("nearby");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (chip = activeChip, q = search) => {
    const wid = await session.getWorkerId();
    if (!wid) {
      router.replace("/role");
      return;
    }
    try {
      const w = await api.getWorker(wid);
      setWorker(w);
      const params: any = {};
      if (chip === "daily") params.job_type = "Daily Wage";
      if (chip === "full") params.job_type = "Full Time";
      if (chip === "construction") params.industry = "construction";
      if (chip === "nearby" && w.city) params.city = w.city;
      if (q) params.search = q;
      const data = await api.listJobs(params);
      setJobs(data);
    } catch (e) {
      console.warn("Failed to load home", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeChip, search, router]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  useEffect(() => {
    const id = setTimeout(() => loadAll(activeChip, search), 300);
    return () => clearTimeout(id);
  }, [activeChip, search, loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>
            {t("hi_user")} {worker?.name || "there"} 👷
          </Text>
          <Text style={styles.city}>
            <Ionicons name="location" size={12} color={COLORS.textSecondary} />
            {"  "}
            {worker?.city || "Bengaluru"}
          </Text>
        </View>
        <TouchableOpacity
          testID="header-saved"
          onPress={() => router.push("/saved")}
          style={styles.bellBtn}
        >
          <Ionicons name="bookmark-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          testID="home-search"
          style={styles.searchInput}
          placeholder={t("search_jobs")}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CHIPS.map((c) => {
          const active = activeChip === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              testID={`chip-${c.key}`}
              onPress={() => setActiveChip(c.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("recommended_jobs")}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")} testID="view-all-jobs">
            <Text style={styles.viewAll}>{t("view_all")}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : jobs.length === 0 ? (
          <Text style={styles.empty}>No jobs found.</Text>
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  hi: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  city: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgApp,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  chipTextActive: { color: "#FFF" },
  list: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  viewAll: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", color: COLORS.textSecondary, marginTop: 24 },
});
