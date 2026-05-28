import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

export default function CityScreen() {
  const router = useRouter();
  const [data, setData] = useState<{ nearby: string[]; popular: string[] } | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getCities().then(setData).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!data) return { nearby: [], popular: [] };
    const f = (arr: string[]) =>
      arr.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
    return { nearby: f(data.nearby), popular: f(data.popular) };
  }, [data, search]);

  const handleContinue = async () => {
    if (!selected) return;
    const wid = await session.getWorkerId();
    if (wid) await api.updateWorker(wid, { city: selected });
    router.push("/onboarding/industry");
  };

  return (
    <SafeAreaView style={styles.container} testID="city-screen">
      <ScreenHeader title={t("select_city")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            testID="city-search"
            style={styles.searchInput}
            placeholder={t("search_city")}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {filtered.nearby.length > 0 && (
          <>
            <Text style={styles.section}>{t("nearby_cities")}</Text>
            <View style={styles.grid}>
              {filtered.nearby.map((c) => (
                <CityTile key={c} city={c} icon="business" active={selected === c} onPress={() => setSelected(c)} />
              ))}
            </View>
          </>
        )}
        {filtered.popular.length > 0 && (
          <>
            <Text style={styles.section}>{t("popular_cities")}</Text>
            <View style={styles.grid}>
              {filtered.popular.map((c) => (
                <CityTile key={c} city={c} icon="location" active={selected === c} onPress={() => setSelected(c)} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="city-continue"
          title={t("continue")}
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}

function CityTile({
  city,
  icon,
  active,
  onPress,
}: {
  city: string;
  icon: any;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      testID={`city-${city}`}
      style={[styles.tile, active && styles.tileActive]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.tileText}>{city}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 16, paddingBottom: 120 },
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
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  section: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tileActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
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
