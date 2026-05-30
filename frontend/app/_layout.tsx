import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { session } from "@/src/store/session";
import { setLang } from "@/src/i18n/translations";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    (async () => {
      const lang = await session.getLang();
      setLang(lang);
      setLangReady(true);
    })();
  }, []);

  useEffect(() => {
    if ((loaded || error) && langReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, langReady]);

  if ((!loaded && !error) || !langReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F9FAFB" } }} />
    </SafeAreaProvider>
  );
}
