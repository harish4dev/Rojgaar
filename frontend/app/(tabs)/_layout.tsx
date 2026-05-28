import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { t } from "@/src/i18n/translations";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: COLORS.borderLight,
          backgroundColor: "#FFF",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t("jobs"),
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t("activity"),
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
