import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Visible tab bar content height (icons + labels), excluding the home-indicator area. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 0 : insets.bottom;
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomInset;
  const scrollBottomPadding = tabBarHeight + 12;

  return {
    insets,
    bottomInset,
    tabBarHeight,
    scrollBottomPadding,
    tabBarStyle: {
      height: tabBarHeight,
      paddingTop: 6,
      paddingBottom: bottomInset,
    },
  };
}
