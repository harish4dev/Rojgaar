import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import ScreenHeader from "@/src/components/ScreenHeader";
import JobCard from "@/src/components/JobCard";
import EmptyState from "@/src/components/EmptyState";
import { t } from "@/src/i18n/translations";
import { getApiErrorMessage, isAccountNotFoundError, isUnauthorizedError } from "@/src/utils/apiError";

export default function SavedScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    const token = await session.getAccessToken();
    if (!wid || !token) {
      setLoading(false);
      router.replace("/onboarding/language");
      return;
    }
    try {
      const data = await api.listSavedJobs(wid);
      setJobs(data);
    } catch (e) {
      if (isUnauthorizedError(e) || isAccountNotFoundError(e)) {
        await session.clear();
        router.replace("/onboarding/phone");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} testID="saved-screen">
      <ScreenHeader title={t("saved_jobs")} />
      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : jobs.length === 0 ? (
          <EmptyState icon="bookmark-outline" title="No saved jobs yet" subtitle="Save jobs to review them later." />
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} callToApply />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  list: { padding: 16 },
});
