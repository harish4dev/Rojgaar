import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import ScreenHeader from "@/src/components/ScreenHeader";
import JobCard from "@/src/components/JobCard";
import { t } from "@/src/i18n/translations";

export default function SavedScreen() {
  const [jobs, setJobs] = useState<any[]>([]);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) return;
    const data = await api.listSavedJobs(wid);
    setJobs(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} testID="saved-screen">
      <ScreenHeader title={t("saved_jobs")} />
      <ScrollView contentContainerStyle={styles.list}>
        {jobs.length === 0 ? (
          <Text style={styles.empty}>No saved jobs yet.</Text>
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  list: { padding: 16 },
  empty: { textAlign: "center", color: COLORS.textSecondary, marginTop: 32 },
});
