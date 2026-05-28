import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";
import PortalLayout, { StatCard } from "@/src/components/PortalLayout";
import { api } from "@/src/api/client";

const DEMO_PHONE = "8888888888";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "stats-chart" as const },
  { key: "people", label: "People / Candidates", icon: "people" as const },
  { key: "network", label: "My Network", icon: "git-network" as const },
  { key: "matches", label: "Job Matches", icon: "briefcase" as const },
  { key: "earnings", label: "Earnings", icon: "cash" as const },
  { key: "reports", label: "Reports", icon: "document-text" as const },
  { key: "messages", label: "Messages", icon: "chatbubbles" as const },
  { key: "settings", label: "Settings", icon: "settings" as const },
];

const SKILLS = [
  { label: "Mason", icon: "construct" as const },
  { label: "Helper", icon: "person" as const },
  { label: "Painter", icon: "color-palette" as const },
  { label: "Electrician", icon: "flash" as const },
  { label: "Welder", icon: "flame" as const },
  { label: "Plumber", icon: "water" as const },
  { label: "Carpenter", icon: "hammer" as const },
  { label: "Driver", icon: "car" as const },
  { label: "Security", icon: "shield-checkmark" as const },
  { label: "Other", icon: "ellipsis-horizontal" as const },
];

const EXP = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Looking: { bg: COLORS.successBg, fg: COLORS.success },
  Matched: { bg: "#DBEAFE", fg: "#1D4ED8" },
  Placed: { bg: COLORS.successBg, fg: COLORS.success },
};

export default function PartnerPortal() {
  const [active, setActive] = useState("dashboard");
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [skill, setSkill] = useState("Mason");
  const [exp, setExp] = useState("1-2 Years");
  const [city, setCity] = useState("Bengaluru");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.verifyOtp(DEMO_PHONE, "0000", "partner");
      const p = res.user;
      setPartner(p);
      const [s, c] = await Promise.all([api.getPartnerStats(p.id), api.getPartnerCandidates(p.id)]);
      setStats(s);
      setCandidates(c);
    } catch (e) {
      console.warn("Partner load failed", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!partner || !name) return;
    setAdding(true);
    try {
      await api.addPartnerCandidate(partner.id, { name, skill, experience: exp, city });
      setName("");
      Alert.alert("Person Added", "Candidate added to your network.");
      load();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  return (
    <PortalLayout
      title="Partner Portal"
      userName={partner?.name || "Partner"}
      userRole="Agent"
      nav={NAV}
      activeKey={active}
      onNavSelect={setActive}
    >
      <Text style={styles.h1}>Dashboard</Text>

      <View style={styles.statsRow}>
        <StatCard testID="stat-people" icon="people" value={String(stats?.people_added ?? "—")} label="People Added" color="#FF6B1A" />
        <StatCard testID="stat-matches" icon="briefcase" value={String(stats?.job_matches ?? "—")} label="Job Matches" color="#3B82F6" />
        <StatCard testID="stat-placed" icon="checkmark-done" value={String(stats?.placed ?? "—")} label="Placed" color="#10B981" />
        <StatCard
          testID="stat-earnings"
          icon="cash"
          value={`₹${(stats?.total_earnings ?? 0).toLocaleString("en-IN")}`}
          label="Total Earnings"
          color="#A855F7"
        />
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.card, { flex: 2 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.h2}>Recently Added People</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.6 }]}>Name</Text>
            <Text style={[styles.th, { flex: 1 }]}>Skill</Text>
            <Text style={[styles.th, { flex: 1 }]}>Experience</Text>
            <Text style={[styles.th, { flex: 1 }]}>Location</Text>
            <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          </View>
          {candidates.length === 0 ? (
            <Text style={styles.empty}>No candidates yet. Add your first one →</Text>
          ) : (
            candidates.slice(0, 8).map((c) => {
              const s = STATUS_STYLE[c.status] || STATUS_STYLE.Looking;
              return (
                <View key={c.id} style={styles.tr} testID={`cand-${c.id}`}>
                  <View style={[{ flex: 1.6, flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={14} color="#FFF" />
                    </View>
                    <Text style={[styles.td, { fontWeight: "600" }]}>{c.name}</Text>
                  </View>
                  <Text style={[styles.td, { flex: 1 }]}>{c.skill}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{c.experience}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{c.city}</Text>
                  <View style={[{ flex: 1, flexDirection: "row" }]}>
                    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.fg }]}>{c.status}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.h2}>Add New Person</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            testID="add-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>Select Skill</Text>
          <View style={styles.skillGrid}>
            {SKILLS.map((s) => {
              const a = skill === s.label;
              return (
                <TouchableOpacity
                  key={s.label}
                  testID={`add-skill-${s.label}`}
                  onPress={() => setSkill(s.label)}
                  style={[styles.skillTile, a && styles.skillTileActive]}
                >
                  <Ionicons name={s.icon} size={16} color={a ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.skillLabel, a && { color: COLORS.primary }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Experience</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {EXP.map((e) => {
              const a = exp === e;
              return (
                <TouchableOpacity
                  key={e}
                  testID={`add-exp-${e}`}
                  onPress={() => setExp(e)}
                  style={[styles.chip, a && styles.chipActive]}
                >
                  <Text style={[styles.chipText, a && { color: COLORS.primary }]}>{e}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Location</Text>
          <TextInput
            testID="add-city"
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholderTextColor={COLORS.textSecondary}
          />

          <TouchableOpacity
            testID="add-person-btn"
            onPress={handleAdd}
            disabled={!name || adding}
            style={[styles.cta, (!name || adding) && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaText}>{adding ? "Adding…" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 16 },
  h2: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  twoCol: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    minWidth: 320,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tableHeader: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  th: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, textTransform: "uppercase" },
  tr: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: "center",
  },
  td: { fontSize: 13, color: COLORS.textPrimary },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: "700" },
  empty: { color: COLORS.textSecondary, textAlign: "center", paddingVertical: 24 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  skillTileActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  skillLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: "#FFF",
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 16,
  },
  ctaText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
