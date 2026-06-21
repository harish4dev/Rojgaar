import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "Rojgaar";
const SLUG = "rojgaar-worker";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: SLUG,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "rojgaar",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "harish4dev",
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "501ebb9e-b947-4e28-80a3-d10b4ee99d85",
    },
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? "",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.rojgaar.worker",
    buildNumber: "1",
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
    },
  },
  android: {
    package: "com.rojgaar.worker",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#1565C0",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Rojgaar uses your location to detect your city and show nearby jobs.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
