import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OnboardingFooter from "@/src/components/OnboardingFooter";

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
  skipLabel?: string;
  onSkip?: () => void;
  header?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  testID?: string;
}

export default function OnboardingScreen({
  children,
  footer,
  skipLabel,
  onSkip,
  header,
  scroll = true,
  contentStyle,
  testID,
}: Props) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scroll, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.scroll, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID={testID}>
      {header}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 4 : 0}
      >
        {body}
        {footer ? (
          <OnboardingFooter skipLabel={skipLabel} onSkip={onSkip}>
            {footer}
          </OnboardingFooter>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 16 },
});
