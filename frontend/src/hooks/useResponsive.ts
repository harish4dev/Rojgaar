import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isNative = Platform.OS === "ios" || Platform.OS === "android";

  return useMemo(() => {
    const isSmall = width < BREAKPOINTS.sm;
    const isTablet = !isNative && width >= BREAKPOINTS.md;
    const isDesktop = !isNative && width >= BREAKPOINTS.lg;
    const contentMaxWidth = isNative ? width : isDesktop ? 760 : isTablet ? 680 : width;
    const gridColumns = isNative ? 3 : isDesktop ? 5 : isTablet ? 4 : 3;
    const horizontalPadding = 16;
    const gutter = 10;
    const usableWidth = width - horizontalPadding * 2;
    const tileSize = (usableWidth - gutter * (gridColumns - 1)) / gridColumns;

    return {
      width,
      height,
      isSmall,
      isTablet,
      isDesktop,
      isNative,
      contentMaxWidth,
      gridColumns,
      horizontalPadding,
      gutter,
      tileSize,
      isWide: !isNative && width >= BREAKPOINTS.md,
    };
  }, [width, height, isNative]);
}
