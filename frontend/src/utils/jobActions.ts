import { Alert, Linking, Platform } from "react-native";
import { api } from "@/src/api/client";
import { session } from "@/src/store/session";
import { t } from "@/src/i18n/translations";

const JOB_CONTACT_NUMBER = "tel:+919876543210";

export async function applyForJob(jobId: string): Promise<boolean> {
  const workerId = await session.getWorkerId();
  if (!workerId) {
    return false;
  }
  await api.apply(workerId, jobId);
  return true;
}

export async function callAfterApply(jobId: string): Promise<boolean> {
  const applied = await applyForJob(jobId).catch(() => false);
  if (Platform.OS === "web") {
    Alert.alert(t("applied_success"), t("applied_success_caption"));
    return applied;
  }

  await Linking.openURL(JOB_CONTACT_NUMBER).catch(() => {
    Alert.alert(t("applied_success"), t("applied_success_caption"));
  });
  return applied;
}
