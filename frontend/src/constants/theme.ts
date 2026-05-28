export const COLORS = {
  primary: "#FF6B1A",
  primaryHover: "#E65A12",
  primaryLight: "#FFF0E6",
  bgApp: "#F9FAFB",
  bgCard: "#FFFFFF",
  sidebarBg: "#111827",
  sidebarHover: "#1F2937",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textInverse: "#FFFFFF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  successBg: "#D1FAE5",
  warningBg: "#FEF3C7",
  errorBg: "#FEE2E2",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const FONT = {
  // We rely on system fonts to avoid loading custom fonts at startup.
  bold: "700" as const,
  semibold: "600" as const,
  medium: "500" as const,
  regular: "400" as const,
};
