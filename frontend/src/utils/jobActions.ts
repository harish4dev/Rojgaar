import { Alert, Linking, Platform } from "react-native";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

function toTelUri(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  if (local.length < 10) return null;
  return `tel:+91${local}`;
}

export async function applyForJob(jobId: string): Promise<boolean> {
  const workerId = await session.getWorkerId();
  if (!workerId) {
    return false;
  }
  await api.apply(workerId, jobId);
  return true;
}

export async function callAfterApply(jobId: string, contactPhone?: string | null): Promise<boolean> {
  const applied = await applyForJob(jobId).catch(() => false);
  const tel = toTelUri(contactPhone);
  if (!tel) {
    Alert.alert(
      applied ? t("applied_success") : t("call"),
      applied
        ? "Your application was recorded. Employer phone is not available yet."
        : "Employer phone is not available. Please try again from the job details screen."
    );
    return applied;
  }
  if (Platform.OS === "web") {
    Alert.alert(t("applied_success"), t("applied_success_caption"));
    return applied;
  }

  await Linking.openURL(tel).catch(() => {
    Alert.alert(t("applied_success"), t("applied_success_caption"));
  });
  return applied;
}
