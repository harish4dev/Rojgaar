import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { COLORS, RADIUS } from "@/src/constants/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import ScreenContainer from "@/src/components/ScreenContainer";
import { t } from "@/src/i18n/translations";
import { useResponsive } from "@/src/hooks/useResponsive";
import { storage } from "@/src/utils/storage";

const K_NOTIFY = "rojgaar.settings.notify";

export default function SettingsScreen() {
  const { horizontalPadding } = useResponsive();
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    storage.getItem<boolean>(K_NOTIFY, true).then((v) => setNotify(Boolean(v)));
  }, []);

  const toggleNotify = async (value: boolean) => {
    setNotify(value);
    await storage.setItem(K_NOTIFY, value);
  };

  const version = Constants.expoConfig?.version ?? "1.0.0";
  const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? "Not configured";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenContainer>
        <ScreenHeader title={t("settings")} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Job alerts</Text>
              <Switch
                value={notify}
                onValueChange={toggleNotify}
                trackColor={{ false: COLORS.borderLight, true: COLORS.primaryLight }}
                thumbColor={notify ? COLORS.primary : "#f4f3f4"}
              />
            </View>
            <Text style={styles.hint}>Get notified about new jobs in your city (coming soon).</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>About</Text>
            <Text style={styles.meta}>App version: {version}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              API: {apiUrl}
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  section: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
});
