import { t } from "@/src/i18n/translations";

interface SalaryJob {
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
}

export function formatJobSalary(job: SalaryJob): string {
  const min = job.salary_min ?? 0;
  const max = job.salary_max ?? 0;
  if (min <= 0 && max <= 0) return t("salary_discuss");

  const fmt = (n: number) => n.toLocaleString("en-IN");
  const isDaily = job.job_type === "Daily Wage";
  const suffix = isDaily ? t("per_day") : t("per_month");

  if (min > 0 && max > 0) return `₹${fmt(min)} – ₹${fmt(max)}${suffix}`;
  const single = min > 0 ? min : max;
  return `₹${fmt(single)}${suffix}`;
}

export function formatDistanceKm(distanceKm?: number | null): string | null {
  if (distanceKm == null || distanceKm < 0 || Number.isNaN(distanceKm)) return null;
  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000));
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dlng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatJobLocation(
  city: string,
  distanceKm?: number | null,
  locationLabel?: string | null
): string {
  const place = (locationLabel || city || "").trim();
  const distance = formatDistanceKm(distanceKm);
  if (distance) return `${place} • ${distance}`;
  return place || city;
}
