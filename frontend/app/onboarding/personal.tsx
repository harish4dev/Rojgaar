import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

const GENDERS = [
  { key: "Male", icon: "male" as const },
  { key: "Female", icon: "female" as const },
  { key: "Other", icon: "person" as const },
];

export default function PersonalScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [saving, setSaving] = useState(false);

  const ageNum = parseInt(age, 10);
  const valid = name.trim().length >= 2 && !Number.isNaN(ageNum) && ageNum >= 18 && ageNum <= 70;

  const labelFor = (k: string) => (k === "Male" ? t("male") : k === "Female" ? t("female") : t("other"));

  const handleContinue = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const wid = await session.getWorkerId();
      if (wid) {
        await api.updateWorker(wid, { name: name.trim(), gender: gender ?? null, age: ageNum });
      }
      router.push("/onboarding/city");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="personal-screen">
      <ScreenHeader title="" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{t("about_you")}</Text>
          <Text style={styles.subtitle}>{t("about_you_caption")}</Text>

          <Text style={styles.label}>{t("full_name")}</Text>
          <TextInput
            testID="personal-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("full_name_ph")}
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="words"
          />

          <Text style={styles.label}>{t("gender")}</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => {
              const active = gender === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  testID={`gender-${g.key}`}
                  activeOpacity={0.85}
                  onPress={() => setGender(g.key)}
                  style={[styles.tile, active && styles.tileActive]}
                >
                  <View style={[styles.tileIcon, active && { backgroundColor: COLORS.primary }]}>
                    <Ionicons name={g.icon} size={20} color={active ? "#FFF" : COLORS.primary} />
                  </View>
                  <Text style={[styles.tileText, active && { color: COLORS.primary }]}>{labelFor(g.key)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>{t("age")}</Text>
          <TextInput
            testID="personal-age"
            style={[styles.input, { width: 140 }]}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, "").slice(0, 2))}
            placeholder={t("age_ph")}
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            testID="personal-continue"
            title={t("continue")}
            onPress={handleContinue}
            disabled={!valid}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 24, paddingBottom: 140 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 18, marginBottom: 8 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  row: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  tileActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
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
