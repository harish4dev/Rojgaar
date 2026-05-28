import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { LANGUAGES, COMING_SOON_LANGUAGES, type Lang } from "@/src/i18n/translations";
import { session } from "@/src/store/session";
import PrimaryButton from "@/src/components/PrimaryButton";
import { t } from "@/src/i18n/translations";

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Lang>("en");

  const showComingSoon = (lang: string) => {
    Alert.alert(t("coming_soon"), `${lang} - ${t("coming_soon")}`);
  };

  const handleContinue = async () => {
    await session.setLang(selected);
    router.push("/onboarding/phone");
  };

  return (
    <SafeAreaView style={styles.container} testID="language-screen">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t("choose_language")}</Text>
        <Text style={styles.subtitle}>{t("change_later")}</Text>

        {LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              testID={`lang-${lang.code}`}
              activeOpacity={0.85}
              onPress={() => setSelected(lang.code)}
              style={[styles.row, active && styles.rowActive]}
            >
              <View style={styles.iconBox}>
                <Ionicons name="language" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.langLabel}>{lang.label}</Text>
                <Text style={styles.langNative}>{lang.native}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionTag}>{t("more_languages")}</Text>
        {COMING_SOON_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            testID={`lang-${lang.code}`}
            onPress={() => showComingSoon(lang.label)}
            activeOpacity={0.7}
            style={[styles.row, styles.rowDisabled]}
          >
            <View style={styles.iconBox}>
              <Ionicons name="language" size={20} color={COLORS.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.langLabel, { color: COLORS.textSecondary }]}>{lang.label}</Text>
              <Text style={styles.langNative}>{lang.native}</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{t("coming_soon")}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton testID="lang-continue" title={t("continue")} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 24, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  rowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  rowDisabled: { backgroundColor: "#FAFAFA", opacity: 0.85 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  langLabel: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  langNative: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sectionTag: { fontSize: 12, color: COLORS.textSecondary, marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
  comingSoonBadge: {
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  comingSoonText: { fontSize: 11, color: COLORS.warning, fontWeight: "600" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
