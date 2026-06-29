import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import ScreenContainer from "@/src/components/ScreenContainer";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { jobFilters } from "@/src/store/jobFilters";
import { t } from "@/src/i18n/translations";
import { getApiErrorMessage } from "@/src/utils/apiError";
import { useResponsive } from "@/src/hooks/useResponsive";

const JOB_TYPES = ["Full Time", "Part Time", "Daily Wage"];
interface Industry {
  key: string;
  label: string;
}

const EXP = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];
const SALARY_BUCKETS = [
  { label: "₹10k - ₹15k", min: 10000, max: 15000 },
  { label: "₹15k - ₹20k", min: 15000, max: 20000 },
  { label: "₹20k - ₹25k", min: 20000, max: 25000 },
  { label: "₹25k+", min: 25000, max: 100000 },
];

export default function FilterScreen() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const [jobType, setJobType] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [exp, setExp] = useState<string | null>(null);
  const [salary, setSalary] = useState<typeof SALARY_BUCKETS[0] | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .getIndustries()
      .then((data) => setIndustries(data))
      .catch(() => setIndustries([]));
    jobFilters.get().then((saved) => {
      if (!saved) return;
      if (saved.job_type) setJobType(saved.job_type);
      if (saved.industry) setIndustry(saved.industry);
      if (saved.experience) setExp(saved.experience);
      if (saved.salary_min != null && saved.salary_max != null) {
        const bucket = SALARY_BUCKETS.find(
          (b) => b.min === saved.salary_min && b.max === saved.salary_max
        );
        if (bucket) setSalary(bucket);
      }
    });
  }, []);

  const buildParams = () => {
    const params: Record<string, string | number> = {};
    if (jobType) params.job_type = jobType;
    if (industry) params.industry = industry;
    if (exp) params.experience = exp;
    if (salary) {
      params.salary_min = salary.min;
      params.salary_max = salary.max;
    }
    return params;
  };

  const apply = async () => {
    const wid = await session.getWorkerId();
    const token = await session.getAccessToken();
    if (!wid || !token) {
      router.replace("/onboarding/language");
      return;
    }
    const params = buildParams();
    try {
      const jobs = await api.getWorkerRecommendations(wid, 100, params);
      await jobFilters.set(Object.keys(params).length ? params : null);
      setCount(jobs.length);
      setTimeout(() => router.back(), 450);
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e, "Could not apply filters."));
    }
  };

  const reset = async () => {
    setJobType(null);
    setIndustry(null);
    setExp(null);
    setSalary(null);
    setCount(null);
    await jobFilters.clear();
  };

  return (
    <SafeAreaView style={styles.container} testID="filter-screen">
      <ScreenContainer>
      <ScreenHeader
        title={t("filter_jobs")}
        right={
          <TouchableOpacity onPress={reset} testID="reset-btn">
            <Text style={styles.resetText}>{t("clear_all")}</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding }]}>
        <Section title={t("job_type")}>
          <Row>
            {JOB_TYPES.map((j) => (
              <Chip key={j} label={j} active={jobType === j} onPress={() => setJobType(jobType === j ? null : j)} />
            ))}
          </Row>
        </Section>
        <Section title={t("industry")}>
          <Row>
            {industries.map((i) => (
              <Chip
                key={i.key}
                label={i.label}
                active={industry === i.key}
                onPress={() => setIndustry(industry === i.key ? null : i.key)}
              />
            ))}
          </Row>
        </Section>
        <Section title={t("experience")}>
          <Row>
            {EXP.map((e) => (
              <Chip key={e} label={e} active={exp === e} onPress={() => setExp(exp === e ? null : e)} />
            ))}
          </Row>
        </Section>
        <Section title="Salary Range">
          <Row>
            {SALARY_BUCKETS.map((s) => (
              <Chip
                key={s.label}
                label={s.label}
                active={salary?.label === s.label}
                onPress={() => setSalary(salary?.label === s.label ? null : s)}
              />
            ))}
          </Row>
        </Section>
      </ScrollView>
      <View style={[styles.footer, { paddingHorizontal: horizontalPadding }]}>
        {count !== null ? <Text style={styles.resultCount}>{count} matching jobs</Text> : null}
        <PrimaryButton
          testID="show-jobs"
          title={count !== null ? `${t("show_jobs")} (${count})` : t("show_jobs")}
          onPress={apply}
        />
      </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      testID={`filter-chip-${label}`}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  scroll: { padding: 16, paddingBottom: 120 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: "#FFF",
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600", textTransform: "capitalize" },
  chipTextActive: { color: COLORS.primary },
  resetText: { color: COLORS.primary, fontWeight: "700" },
  resultCount: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
