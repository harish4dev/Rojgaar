import { useCallback, useEffect, useMemo, useState } from "react";
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
const SALARY = ["₹10,000 - ₹15,000", "₹15,000 - ₹20,000", "₹20,000 - ₹25,000", "₹25,000+"];
const AVAILABILITY = ["Available", "Not Available"];

export default function EditProfile() {
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [industries, setIndustries] = useState<{ key: string; label: string }[]>([]);
  const [jobTitlesByIndustry, setJobTitlesByIndustry] = useState<Record<string, string[]>>({});
  const [cityList, setCityList] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [experience, setExperience] = useState<string | null>(null);
  const [salary, setSalary] = useState<string | null>(null);
  const [workType, setWorkType] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("Available");
  const [languagesKnown, setLanguagesKnown] = useState("");

  const availableRoles = useMemo(() => {
    if (!selectedIndustry) return [];
    return jobTitlesByIndustry[selectedIndustry] ?? [];
  }, [selectedIndustry, jobTitlesByIndustry]);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) {
      router.replace("/onboarding/language");
      return;
    }
    const [w, inds, titles, cities] = await Promise.all([
      api.getWorker(wid),
      api.getIndustries(),
      api.getIndustryJobTitles(),
      api.getCities(),
    ]);
    setWorker(w);
    setIndustries(inds);
    setJobTitlesByIndustry(titles);
    setCityList([...cities.nearby, ...cities.popular]);
    setName(w.name || "");
    setGender(w.gender || null);
    setAge(w.age ? String(w.age) : "");
    setCity(w.city || "");
    const industry = w.industry_preference || w.industries?.[0] || null;
    setSelectedIndustry(industry);
    setSelectedRoles(w.skills || []);
    setExperience(w.experience || null);
    setSalary(w.expected_salary || null);
    setWorkType(w.work_type || null);
    setAvailabilityStatus(w.availability_status || "Available");
    setLanguagesKnown((w.languages_known || []).join(", "));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
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
        industries: selectedIndustry ? [selectedIndustry] : [],
        industry_preference: selectedIndustry,
        skills: selectedRoles,
        preferred_job_title: selectedRoles[0] ?? null,
        experience,
        expected_salary: salary,
        work_type: workType,
        availability_status: availabilityStatus,
        languages_known: languagesKnown
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
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
          <Text style={styles.sectionHint}>Required</Text>
          <Text style={styles.label}>{t("full_name")}</Text>
          <TextInput
            testID="edit-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("full_name_ph")}
            placeholderTextColor={COLORS.textSecondary}
          />

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

          <Text style={[styles.sectionHint, { marginTop: 24 }]}>Optional</Text>

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
                active={selectedIndustry === ind.key}
                onPress={() => {
                  setSelectedIndustry(ind.key);
                  setSelectedRoles([]);
                }}
              />
            ))}
          </View>

          {selectedIndustry && availableRoles.length > 0 && (
            <>
              <Text style={styles.label}>Job role</Text>
              <View style={styles.rowWrap}>
                {availableRoles.map((role) => (
                  <Chip
                    key={role}
                    testID={`edit-role-${role}`}
                    label={role}
                    active={selectedRoles.includes(role)}
                    onPress={() => toggleRole(role)}
                  />
                ))}
              </View>
            </>
          )}

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

          <Text style={styles.label}>Languages known</Text>
          <TextInput
            style={styles.input}
            value={languagesKnown}
            onChangeText={setLanguagesKnown}
            placeholder="Hindi, English, Kannada"
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>Availability</Text>
          <View style={styles.rowWrap}>
            {AVAILABILITY.map((value) => (
              <Chip
                key={value}
                label={value}
                active={availabilityStatus === value}
                onPress={() => setAvailabilityStatus(value)}
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
  sectionHint: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 14, marginBottom: 8 },
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
