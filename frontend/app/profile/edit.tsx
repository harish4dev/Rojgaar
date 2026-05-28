import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
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

const GENDERS = ["Male", "Female", "Other"];
const EXPERIENCE = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];
const WORK_TYPES = ["Full Time", "Part Time", "Daily Wage", "Any"];
const SALARY = ["₹10k - ₹15k", "₹15k - ₹20k", "₹20k - ₹25k", "₹25k+"];

export default function EditProfile() {
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ key: string; label: string }[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [selectedIndustries, setSelIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<string | null>(null);
  const [salary, setSalary] = useState<string | null>(null);
  const [workType, setWorkType] = useState<string | null>(null);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) {
      router.replace("/onboarding/language");
      return;
    }
    const [w, sk, inds, cities] = await Promise.all([
      api.getWorker(wid),
      api.getSkills(),
      api.getIndustries(),
      api.getCities(),
    ]);
    setWorker(w);
    setSkills(sk);
    setIndustries(inds);
    setCityList([...cities.nearby, ...cities.popular]);
    setName(w.name || "");
    setGender(w.gender || null);
    setAge(w.age ? String(w.age) : "");
    setCity(w.city || "");
    setSelIndustries(w.industries || []);
    setSelSkills(w.skills || []);
    setExperience(w.experience || null);
    setSalary(w.expected_salary || null);
    setWorkType(w.work_type || null);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, key: string) => {
    setArr(arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]);
  };

  const handleSave = async () => {
    if (!worker) return;
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim() || null,
        gender,
        age: age ? parseInt(age, 10) : null,
        city: city || null,
        industries: selectedIndustries,
        skills: selectedSkills,
        experience,
        expected_salary: salary,
        work_type: workType,
      };
      await api.updateWorker(worker.id, payload);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="edit-profile-screen">
      <ScreenHeader title={t("edit_profile")} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.label}>{t("full_name")}</Text>
          <TextInput
            testID="edit-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("full_name_ph")}
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>{t("gender")}</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => {
              const active = gender === g;
              const label = g === "Male" ? t("male") : g === "Female" ? t("female") : t("other");
              return (
                <Chip
                  key={g}
                  testID={`edit-gender-${g}`}
                  label={label}
                  active={active}
                  onPress={() => setGender(g)}
                />
              );
            })}
          </View>

          <Text style={styles.label}>{t("age")}</Text>
          <TextInput
            testID="edit-age"
            style={[styles.input, { width: 140 }]}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, "").slice(0, 2))}
            placeholder={t("age_ph")}
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>{t("city")}</Text>
          <View style={styles.rowWrap}>
            {cityList.map((c) => (
              <Chip
                key={c}
                testID={`edit-city-${c}`}
                label={c}
                active={city === c}
                onPress={() => setCity(c)}
              />
            ))}
          </View>

          <Text style={styles.label}>{t("industry")}</Text>
          <View style={styles.rowWrap}>
            {industries.map((ind) => (
              <Chip
                key={ind.key}
                testID={`edit-ind-${ind.key}`}
                label={ind.label}
                active={selectedIndustries.includes(ind.key)}
                onPress={() => toggle(selectedIndustries, setSelIndustries, ind.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>{t("skills")}</Text>
          <View style={styles.rowWrap}>
            {skills.map((s) => (
              <Chip
                key={s}
                testID={`edit-skill-${s}`}
                label={s}
                active={selectedSkills.includes(s)}
                onPress={() => toggle(selectedSkills, setSelSkills, s)}
              />
            ))}
          </View>

          <Text style={styles.label}>{t("experience")}</Text>
          <View style={styles.rowWrap}>
            {EXPERIENCE.map((e) => (
              <Chip
                key={e}
                testID={`edit-exp-${e}`}
                label={e}
                active={experience === e}
                onPress={() => setExperience(e)}
              />
            ))}
          </View>

          <Text style={styles.label}>{t("expected_salary")}</Text>
          <View style={styles.rowWrap}>
            {SALARY.map((s) => (
              <Chip
                key={s}
                testID={`edit-sal-${s}`}
                label={s}
                active={salary === s}
                onPress={() => setSalary(s)}
              />
            ))}
          </View>

          <Text style={styles.label}>{t("preferred_work")}</Text>
          <View style={styles.rowWrap}>
            {WORK_TYPES.map((w) => (
              <Chip
                key={w}
                testID={`edit-work-${w}`}
                label={w}
                active={workType === w}
                onPress={() => setWorkType(w)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            testID="edit-save"
            title={t("save_changes")}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && { color: COLORS.primary }]}>{label}</Text>
      {active && <Ionicons name="checkmark" size={14} color={COLORS.primary} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { padding: 16, paddingBottom: 140 },
  empty: { textAlign: "center", marginTop: 32, color: COLORS.textSecondary },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 18, marginBottom: 8 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  row: { flexDirection: "row", gap: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
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
