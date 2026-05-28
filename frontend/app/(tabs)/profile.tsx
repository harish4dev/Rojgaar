import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t, LANGUAGES } from "@/src/i18n/translations";

export default function ProfileScreen() {
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const load = useCallback(async () => {
    const wid = await session.getWorkerId();
    if (!wid) return;
    const w = await api.getWorker(wid);
    setWorker(w);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const switchLanguage = () => setShowLang(true);

  const pickLanguage = async (code: string) => {
    setShowLang(false);
    await session.setLang(code as any);
    if (worker?.id) {
      try {
        await api.updateWorker(worker.id, { language: code });
      } catch {
        /* ignore */
      }
    }
    if (Platform.OS === "web") {
      (window as any).location.reload();
    } else {
      router.replace("/(tabs)/home");
      setTimeout(() => router.replace("/(tabs)/profile"), 50);
    }
  };

  const handleLogout = () => setShowLogout(true);

  const confirmLogout = async () => {
    setShowLogout(false);
    await session.clear();
    if (Platform.OS === "web") {
      // Force a full reload on web so the tab layout fully unmounts and storage state resets cleanly.
      (window as any).location.replace("/onboarding/language");
    } else {
      router.replace("/onboarding/language");
    }
  };

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const lang = LANGUAGES.find((l) => l.code === worker.language) || LANGUAGES[0];

  return (
    <SafeAreaView style={styles.container} testID="profile-screen" edges={["bottom"]}>
      <ScrollView>
        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{worker.name || "New User"}</Text>
              <Text style={styles.heroSub}>+91 {worker.phone}</Text>
              <Text style={styles.heroSub}>
                <Ionicons name="location" size={11} color="#FFF" /> {worker.city || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("profile_strength")}</Text>
          <View style={styles.barWrap}>
            <View style={[styles.barFill, { width: `${worker.profile_strength || 0}%` }]} />
          </View>
          <Text style={styles.cardSub}>{worker.profile_strength || 0}% {t("complete")}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t("my_details")}</Text>
            <TouchableOpacity testID="profile-edit" onPress={() => router.push("/profile/edit" as any)}>
              <Text style={styles.editLink}>{t("edit")}</Text>
            </TouchableOpacity>
          </View>
          <DetailRow label={t("gender")} value={worker.gender || "—"} />
          <DetailRow label={t("age")} value={worker.age ? String(worker.age) : "—"} />
          <DetailRow label={t("industry")} value={(worker.industries || []).join(", ") || "—"} />
          <DetailRow label={t("skills")} value={(worker.skills || []).join(", ") || "—"} />
          <DetailRow label={t("experience")} value={worker.experience || "—"} />
          <DetailRow label="Expected Salary" value={worker.expected_salary || "—"} />
          <DetailRow label={t("preferred_work")} value={worker.work_type || "—"} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("more")}</Text>
          <MenuRow
            testID="menu-language"
            icon="language"
            label={t("language")}
            value={lang.label}
            onPress={switchLanguage}
          />
          <MenuRow testID="menu-help" icon="help-circle" label={t("help_center")} />
          <MenuRow testID="menu-settings" icon="settings" label={t("settings")} />
        </View>

        <TouchableOpacity testID="logout-btn" onPress={handleLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout confirm modal — cross-platform */}
      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogout(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowLogout(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>{t("logout")}</Text>
            <Text style={styles.modalDesc}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                testID="logout-cancel"
                onPress={() => setShowLogout(false)}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="logout-confirm"
                onPress={confirmLogout}
                style={[styles.modalBtn, styles.modalBtnDanger]}
              >
                <Text style={styles.modalBtnTextDanger}>{t("logout")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language picker modal */}
      <Modal
        visible={showLang}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLang(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowLang(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Choose Language</Text>
            <Text style={styles.modalDesc}>Pick your preferred language</Text>
            <View style={{ marginTop: 8 }}>
              {LANGUAGES.map((l) => {
                const active = lang.code === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    testID={`lang-pick-${l.code}`}
                    onPress={() => pickLanguage(l.code)}
                    style={[styles.langOpt, active && styles.langOptActive]}
                  >
                    <Ionicons
                      name="language"
                      size={18}
                      color={active ? COLORS.primary : COLORS.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langOptLabel, active && { color: COLORS.primary }]}>
                        {l.label}
                      </Text>
                      <Text style={styles.langOptNative}>{l.native}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              testID="lang-cancel"
              onPress={() => setShowLang(false)}
              style={[styles.modalBtn, styles.modalBtnSecondary, { marginTop: 8 }]}
            >
              <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  value,
  testID,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  testID?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.menuRow} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={COLORS.textSecondary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  empty: { textAlign: "center", marginTop: 32, color: COLORS.textSecondary },
  heroWrap: { backgroundColor: COLORS.primary, paddingTop: 30, paddingBottom: 60 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  heroName: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  heroSub: { color: "#FFF", fontSize: 12, marginTop: 4, opacity: 0.9 },
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: -40,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  barWrap: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 4 },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  editLink: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  detailValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600", flex: 2, textAlign: "right" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "500" },
  menuValue: { fontSize: 13, color: COLORS.textSecondary, marginRight: 6 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.errorBg,
    backgroundColor: "#FFF",
  },
  logoutText: { color: COLORS.error, fontWeight: "700" },
  // Modal styles
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.xl,
    padding: 24,
  },
  modalIconWrap: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  modalDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSecondary: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalBtnDanger: { backgroundColor: COLORS.error },
  modalBtnTextSecondary: { color: COLORS.textPrimary, fontWeight: "700" },
  modalBtnTextDanger: { color: "#FFF", fontWeight: "700" },
  langOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    marginTop: 8,
  },
  langOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  langOptLabel: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  langOptNative: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
