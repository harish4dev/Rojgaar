import { t } from "@/src/i18n/translations";

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const now = Date.now();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return t("seen_today");
  if (diffDays === 1) return t("seen_yesterday");
  return t("seen_days_ago").replace("{days}", String(diffDays));
}
