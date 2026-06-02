import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t, LANGUAGES } from "@/src/i18n/translations";
import ScreenContainer from "@/src/components/ScreenContainer";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useTabBarInsets } from "@/src/hooks/useTabBarInsets";

function initials(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function strengthLabel(pct: number) {
  if (pct >= 80) return "Looking great!";
  if (pct >= 50) return "Almost there";
  return "Needs attention";
}

function strengthColor(pct: number) {
  if (pct >= 80) return COLORS.success;
  if (pct >= 50) return COLORS.warning;
  return COLORS.primary;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const { scrollBottomPadding } = useTabBarInsets();
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

  const confirmLogout = async () => {
    setShowLogout(false);
    await session.clear();
    if (Platform.OS === "web") {
      (window as any).location.replace("/onboarding/language");
    } else {
      router.replace("/onboarding/language");
    }
  };

  const stats = useMemo(() => {
    if (!worker) return { skills: 0, industries: 0, strength: 0 };
    return {
      skills: (worker.skills || []).length,
      industries: (worker.industries || []).length,
      strength: worker.profile_strength || 0,
    };
  }, [worker]);

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lang = LANGUAGES.find((l) => l.code === worker.language) || LANGUAGES[0];
  const pct = stats.strength;
  const barColor = strengthColor(pct);

  return (
    <SafeAreaView style={styles.container} testID="profile-screen" edges={["top"]}>
      <ScreenContainer fill>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
        >
          {/* Hero */}
          <LinearGradient
            colors={["#FF6B1A", "#FF8534", "#FFA04D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingHorizontal: horizontalPadding }]}
          >
            <View style={styles.heroTop}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(worker.name)}</Text>
                </View>
              </View>
              <TouchableOpacity
                testID="profile-edit"
                onPress={() => router.push("/profile/edit" as any)}
                style={styles.editBtn}
              >
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.editBtnText}>{t("edit")}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>{worker.name || "New User"}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.metaPill}>
                <Ionicons name="call-outline" size={13} color="#FFF" />
                <Text style={styles.metaPillText}>+91 {worker.phone}</Text>
              </View>
              {worker.city ? (
                <View style={styles.metaPill}>
                  <Ionicons name="location-outline" size={13} color="#FFF" />
                  <Text style={styles.metaPillText}>{worker.city}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
            {/* Strength card */}
            <View style={styles.strengthCard}>
              <View style={styles.strengthHeader}>
                <View>
                  <Text style={styles.strengthLabel}>{t("profile_strength")}</Text>
                  <Text style={styles.strengthHint}>{strengthLabel(pct)}</Text>
                </View>
                <View style={[styles.strengthBadge, { backgroundColor: `${barColor}18` }]}>
                  <Text style={[styles.strengthPct, { color: barColor }]}>{pct}%</Text>
                </View>
              </View>
              <View style={styles.barWrap}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.strengthSub}>
                {pct}% {t("complete")} — complete your profile to get more job calls
              </Text>
              {pct < 100 ? (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => router.push("/profile/edit" as any)}
                >
                  <Text style={styles.completeBtnText}>Complete profile</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <StatBox icon="construct-outline" value={stats.industries} label={t("industry")} />
              <StatBox icon="hammer-outline" value={stats.skills} label={t("skills")} />
              <StatBox icon="briefcase-outline" value={worker.experience ? "✓" : "—"} label={t("experience")} />
            </View>

            {/* Details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("my_details")}</Text>

              <DetailItem icon="person-outline" label={t("gender")} value={worker.gender || "—"} />
              <DetailItem icon="calendar-outline" label={t("age")} value={worker.age ? String(worker.age) : "—"} />
              <DetailItem icon="time-outline" label={t("experience")} value={worker.experience || "—"} />
              <DetailItem icon="cash-outline" label={t("expected_salary")} value={worker.expected_salary || "—"} />
              <DetailItem icon="today-outline" label={t("preferred_work")} value={worker.work_type || "—"} last />

              {(worker.industries || []).length > 0 && (
                <>
                  <Text style={styles.chipsLabel}>{t("industry")}</Text>
                  <View style={styles.chipsRow}>
                    {(worker.industries || []).map((ind: string) => (
                      <View key={ind} style={styles.chip}>
                        <Text style={styles.chipText}>{ind}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {(worker.skills || []).length > 0 && (
                <>
                  <Text style={styles.chipsLabel}>{t("skills")}</Text>
                  <View style={styles.chipsRow}>
                    {(worker.skills || []).map((skill: string) => (
                      <View key={skill} style={[styles.chip, styles.skillChip]}>
                        <Text style={[styles.chipText, styles.skillChipText]}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Settings */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("more")}</Text>
              <MenuRow
                testID="menu-language"
                icon="language-outline"
                label={t("language")}
                value={lang.label}
                onPress={() => setShowLang(true)}
              />
              <MenuRow
                testID="menu-help"
                icon="help-circle-outline"
                label={t("help_center")}
                onPress={() => router.push("/help" as any)}
              />
              <MenuRow
                testID="menu-settings"
                icon="settings-outline"
                label={t("settings")}
                onPress={() => router.push("/settings" as any)}
                last
              />
            </View>

            <TouchableOpacity
              testID="logout-btn"
              onPress={() => setShowLogout(true)}
              style={styles.logout}
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
              <Text style={styles.logoutText}>{t("logout")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>

      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
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

      <Modal visible={showLang} transparent animationType="fade" onRequestClose={() => setShowLang(false)}>
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

function StatBox({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailItem, !last && styles.detailBorder]}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  value,
  testID,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  testID?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[styles.menuRow, !last && styles.detailBorder]}
      activeOpacity={0.7}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgApp },
  scroll: {},
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loaderText: { color: COLORS.textSecondary, fontSize: 14 },
  hero: {
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { color: "#FFF", fontSize: 24, fontWeight: "700" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  editBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  heroName: { fontSize: 24, fontWeight: "700", color: "#FFF", marginBottom: 10 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  metaPillText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  body: { marginTop: -16 },
  strengthCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 12px rgba(17, 24, 39, 0.06)" } as any,
    }),
  },
  strengthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  strengthLabel: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  strengthHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  strengthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  strengthPct: { fontSize: 16, fontWeight: "800" },
  barWrap: {
    height: 10,
    backgroundColor: COLORS.borderLight,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 5 },
  strengthSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  completeBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 0,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailBody: { flex: 1, minWidth: 0 },
  detailLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  detailValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "600", marginTop: 2 },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.primary, textTransform: "capitalize" },
  skillChip: { backgroundColor: COLORS.bgApp, borderWidth: 1, borderColor: COLORS.borderLight },
  skillChipText: { color: COLORS.textPrimary },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgApp,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, color: COLORS.textPrimary, fontWeight: "500" },
  menuValue: { fontSize: 13, color: COLORS.textSecondary, marginRight: 6 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.errorBg,
    backgroundColor: COLORS.bgCard,
  },
  logoutText: { color: COLORS.error, fontWeight: "700", fontSize: 15 },
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
    backgroundColor: COLORS.bgCard,
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
    backgroundColor: COLORS.bgCard,
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
