import { useEffect } from "react";
import { useRouter } from "expo-router";

/** Legacy route — industry + job role are collected on /onboarding/industry */
export default function SkillsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/experience");
  }, [router]);
  return null;
}
