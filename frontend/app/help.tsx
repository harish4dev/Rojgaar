import { ScrollView, Text, StyleSheet, Linking, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS } from "@/src/constants/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import ScreenContainer from "@/src/components/ScreenContainer";
import { t } from "@/src/i18n/translations";
import { useResponsive } from "@/src/hooks/useResponsive";

const FAQ = [
  {
    q: "How do I apply for a job?",
    a: "Open a job and tap Call to Apply. Your application is recorded and you can call the employer.",
  },
  {
    q: "How do filters work?",
    a: "Use Filter jobs from Home, choose options, then tap Show jobs. Filters apply to the All jobs list on Home.",
  },
  {
    q: "How do I save a job?",
    a: "Tap the bookmark icon on a job card or job details page. Saved jobs appear under Activity → Saved.",
  },
  {
    q: "Who can I contact for support?",
    a: "Email support@rojgaar.in during business hours.",
  },
];

export default function HelpScreen() {
  const { horizontalPadding } = useResponsive();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenContainer>
        <ScreenHeader title={t("help_center")} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding }]}>
          {FAQ.map((item) => (
            <View key={item.q} style={styles.card}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          ))}
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
  question: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  answer: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  link: { fontSize: 14, color: COLORS.primary, fontWeight: "700", textAlign: "center", marginTop: 8 },
});
