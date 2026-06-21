import { Image, StyleSheet, View, type ImageStyle, type ViewStyle } from "react-native";

const logo = require("@/assets/images/icon.png");

interface Props {
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export default function BrandLogo({ size = 96, style, imageStyle }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={logo}
        style={[styles.image, { width: size, height: size }, imageStyle]}
        resizeMode="contain"
        accessibilityLabel="Rojgaar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    borderRadius: 22,
  },
});
