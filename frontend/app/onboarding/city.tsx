import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { COLORS, RADIUS } from "@/src/constants/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import ScreenHeader from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";  

export default function CityScreen() {
  const router = useRouter();

  const [data, setData] = useState<{ 
    nearby: string[];
    popular: string[];
  } | null>(null);

  const [city, setCity] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detecting, setDetecting] = useState(true);
  const [showManualSelection, setShowManualSelection] = useState(false);

  useEffect(() => {
    api.getCities().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setShowManualSelection(true);
          return;
        }

        const location =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        const [place] =
          await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

        const detectedCity =
          place?.city ||
          place?.subregion ||
          place?.district ||
          null;

        if (detectedCity) {
          setCity(detectedCity);
        } else {
          setShowManualSelection(true);
        }
      } catch {
        setShowManualSelection(true);
      } finally {
        setDetecting(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!data)
      return {
        nearby: [],
        popular: [],
      };

    const filterFn = (arr: string[]) =>
      arr.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      );

    return {
      nearby: filterFn(data.nearby),
      popular: filterFn(data.popular),
    };
  }, [data, search]);

  const handleContinue = async () => {
    if (!city) return;

    try {
      const wid = await session.getWorkerId();

      if (wid) {
        await api.updateWorker(wid, {
          city,
        });
      }

      router.push("/onboarding/industry");
    } catch {
      router.push("/onboarding/industry");
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/industry");
  };

  return (
    <SafeAreaView
      style={styles.container}
      testID="city-screen"
    >
      <ScreenHeader title={t("select_city")} />

      {detecting ? (
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loaderTitle}>
            Detecting your location
          </Text>

          <Text style={styles.loaderSubtitle}>
            This will only take a few seconds
          </Text>
        </View>
      ) : !showManualSelection && city ? (
        <View style={styles.centerContent}>
          <View style={styles.locationIcon}>
            <Ionicons
              name="location"
              size={40}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.cityName}>
            {city}
          </Text>

          <Text style={styles.cityDescription}>
            We detected your current city
          </Text>

          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Confirm & Continue"
              onPress={handleContinue}
            />
          </View>

          <TouchableOpacity
            onPress={() =>
              setShowManualSelection(true)
            }
          >
            <Text style={styles.changeText}>
              Select Different City
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={18}
                color={COLORS.textSecondary}
              />

              <TextInput
                style={styles.searchInput}
                placeholder={t("search_city")}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={
                  COLORS.textSecondary
                }
              />
            </View>

            {filtered.nearby.length > 0 && (
              <>
                <Text style={styles.section}>
                  {t("nearby_cities")}
                </Text>

                <View style={styles.grid}>
                  {filtered.nearby.map((c) => (
                    <CityTile
                      key={c}
                      city={c}
                      icon="business"
                      active={city === c}
                      onPress={() => setCity(c)}
                    />
                  ))}
                </View>
              </>
            )}

            {filtered.popular.length > 0 && (
              <>
                <Text style={styles.section}>
                  {t("popular_cities")}
                </Text>

                <View style={styles.grid}>
                  {filtered.popular.map((c) => (
                    <CityTile
                      key={c}
                      city={c}
                      icon="location"
                      active={city === c}
                      onPress={() => setCity(c)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
            <PrimaryButton
              title={t("continue")}
              onPress={handleContinue}
              disabled={!city}
            />
          </View>
        </>
      )}
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
      style={[
        styles.tile,
        active && styles.tileActive,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.tileIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.tileText}>
        {city}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    color: COLORS.textPrimary,
  },

  loaderSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    color: COLORS.textSecondary,
  },

  locationIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  cityName: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  cityDescription: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  buttonContainer: {
    width: "100%",
    marginTop: 32,
  },

  changeText: {
    marginTop: 20,
    color: COLORS.primary,
    fontWeight: "600",
  },

  scroll: {
    padding: 16,
    paddingBottom: 120,
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
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  section: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

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

  tileActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  tileText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    gap: 8,
  },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
});