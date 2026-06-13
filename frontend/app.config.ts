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
  owner: undefined,
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "",
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
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#1565C0",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
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
        image: "./assets/images/splash-image.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
