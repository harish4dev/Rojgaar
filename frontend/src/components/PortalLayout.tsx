import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "@/src/constants/theme";

interface NavItem {
  key: string;
  label: string;
  icon: any;
}

interface Props {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: string;
  nav: NavItem[];
  activeKey: string;
  onNavSelect: (key: string) => void;
  children: React.ReactNode;
}

export default function PortalLayout({
  title,
  userName,
  userRole,
  nav,
  activeKey,
  onNavSelect,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const router = useRouter();

  return (
    <View style={styles.outer}>
      {isWide && (
        <View style={styles.sidebar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="hardware-chip-outline" size={20} color="#FFF" />
            </View>
            <Text style={styles.brandText}>
              R<Text style={{ color: COLORS.primary }}>O</Text>JGAAR
            </Text>
          </View>
          <Text style={styles.section}>{title}</Text>

          <ScrollView style={{ flex: 1 }}>
            {nav.map((n) => {
              const active = activeKey === n.key;
              return (
                <TouchableOpacity
                  key={n.key}
                  testID={`nav-${n.key}`}
                  onPress={() => onNavSelect(n.key)}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Ionicons name={n.icon} size={18} color={active ? COLORS.primary : "#9CA3AF"} />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>{n.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.userBox}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userRole}>{userRole}</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace("/role")} testID="portal-logout">
              <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {!isWide && (
          <View style={styles.mobileHeader}>
            <TouchableOpacity onPress={() => router.replace("/role")} testID="portal-back">
              <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.mobileTitle}>{title}</Text>
            <View style={{ width: 22 }} />
          </View>
        )}
        {!isWide && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileTabs}>
            {nav.map((n) => {
              const active = activeKey === n.key;
              return (
                <TouchableOpacity
                  key={n.key}
                  testID={`nav-${n.key}`}
                  onPress={() => onNavSelect(n.key)}
                  style={[styles.mobileTab, active && styles.mobileTabActive]}
                >
                  <Ionicons name={n.icon} size={14} color={active ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.mobileTabText, active && { color: COLORS.primary }]}>{n.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <ScrollView contentContainerStyle={styles.contentInner}>{children}</ScrollView>
      </View>
    </View>
  );
}

export function StatCard({
  testID,
  icon,
  value,
  label,
  color,
}: {
  testID?: string;
  icon: any;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View testID={testID} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: (color || COLORS.primary) + "22" }]}>
        <Ionicons name={icon} size={22} color={color || COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, flexDirection: "row", backgroundColor: COLORS.bgApp },
  sidebar: {
    width: 240,
    backgroundColor: COLORS.sidebarBg,
    paddingTop: 24,
    paddingBottom: 16,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 24 },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 18, fontWeight: "800", color: "#FFF", letterSpacing: 1 },
  section: { fontSize: 11, color: "#6B7280", paddingHorizontal: 20, marginBottom: 8, textTransform: "uppercase" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: RADIUS.md,
  },
  navItemActive: { backgroundColor: COLORS.sidebarHover },
  navLabel: { fontSize: 14, color: "#D1D5DB", fontWeight: "500" },
  navLabelActive: { color: COLORS.primary, fontWeight: "700" },
  userBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 12,
    padding: 10,
    backgroundColor: COLORS.sidebarHover,
    borderRadius: RADIUS.md,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  userRole: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  content: { flex: 1 },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  mobileTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  mobileTabs: { backgroundColor: "#FFF", paddingHorizontal: 12, paddingVertical: 10, maxHeight: 50 },
  mobileTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgApp,
    marginRight: 8,
  },
  mobileTabActive: { backgroundColor: COLORS.primaryLight },
  mobileTabText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  contentInner: { padding: 24, paddingTop: 32 },
  statCard: {
    flex: 1,
    minWidth: 160,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
