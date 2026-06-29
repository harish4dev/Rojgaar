import { ScrollView, Text, StyleSheet, Linking, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/src/constants/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import ScreenContainer from "@/src/components/ScreenContainer";
import { t } from "@/src/i18n/translations";
import { useResponsive } from "@/src/hooks/useResponsive";

const WHATSAPP_URL = "https://wa.me/919876543210?text=Hi%20Rojgaar%20support";

const FAQ = [
  { qKey: "help_q_apply", aKey: "help_a_apply" },
  { qKey: "help_q_filters", aKey: "help_a_filters" },
  { qKey: "help_q_save", aKey: "help_a_save" },
  { qKey: "help_q_support", aKey: "help_a_support" },
] as const;

export default function HelpScreen() {
  const { horizontalPadding } = useResponsive();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenContainer>
        <ScreenHeader title={t("help_center")} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding }]}>
          {FAQ.map((item) => (
            <View key={item.qKey} style={styles.card}>
              <Text style={styles.question}>{t(item.qKey)}</Text>
              <Text style={styles.answer}>{t(item.aKey)}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => Linking.openURL(WHATSAPP_URL)}
            accessibilityRole="button"
            accessibilityLabel={t("whatsapp_support")}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
            <Text style={styles.whatsappText}>{t("whatsapp_support")}</Text>
          </TouchableOpacity>

          <Text
            style={styles.link}
            onPress={() => Linking.openURL("mailto:support@rojgaar.in")}
          >
            support@rojgaar.in
          </Text>
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
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  question: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 22 },
  answer: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#25D366",
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 48,
  },
  whatsappText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  link: { fontSize: 14, color: COLORS.primary, fontWeight: "700", textAlign: "center", marginTop: 16 },
});
