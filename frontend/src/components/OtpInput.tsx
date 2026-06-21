import { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { OTP_LENGTH, digitsOnlyOtp, otpDigitsArray } from "@/src/constants/otp";

interface Props {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  testID?: string;
}

export default function OtpInput({ value, onChange, onComplete, error, testID }: Props) {
  const inputRef = useRef<TextInput>(null);
  const digits = otpDigitsArray(value);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const handleChange = useCallback(
    (text: string) => {
      const cleaned = digitsOnlyOtp(text);
      onChange(cleaned);
      if (cleaned.length === OTP_LENGTH) {
        onComplete?.(cleaned);
      }
    },
    [onChange, onComplete]
  );

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const autofillProps: Partial<TextInputProps> =
    Platform.OS === "ios"
      ? { textContentType: "oneTimeCode", autoComplete: "one-time-code" }
      : { autoComplete: "sms-otp", textContentType: "oneTimeCode" };

  return (
    <Pressable style={styles.wrap} onPress={() => inputRef.current?.focus()}>
      <View style={styles.row} pointerEvents="none">
        {digits.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.box,
              digit ? styles.boxFilled : null,
              i === activeIndex && styles.boxActive,
              error && styles.boxError,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        testID={testID ?? "otp-input"}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        importantForAutofill="yes"
        autoFocus
        caretHidden={false}
        selectionColor={COLORS.primary}
        style={styles.input}
        accessibilityLabel="One-time password"
        {...autofillProps}
      />
    </Pressable>
  );
}

const BOX = 56;
const GAP = 12;
const WIDTH = BOX * OTP_LENGTH + GAP * (OTP_LENGTH - 1);

const styles = StyleSheet.create({
  wrap: {
    marginTop: 32,
    alignSelf: "center",
    width: WIDTH,
    height: BOX,
    position: "relative",
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    width: WIDTH,
    height: BOX,
  },
  box: {
    width: BOX,
    height: BOX,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  boxActive: { borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 6 },
  boxError: { borderColor: COLORS.error },
  digit: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
  input: {
    position: "absolute",
    top: 0,
    left: 0,
    width: WIDTH,
    height: BOX,
    fontSize: 1,
    color: "transparent",
    backgroundColor: "transparent",
  },
});
