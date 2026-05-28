import { getLang } from "@/src/i18n/translations";

type JobLike = {
  title?: string;
  description?: string;
  requirements?: string[];
  experience?: string;
  job_type?: string;
  translations?: Record<string, any>;
};

/**
 * Return a translated field of a job for the current language.
 * Falls back to the English (base) field when no translation exists.
 */
export function getJobField(
  job: JobLike | null | undefined,
  field: "title" | "description" | "experience" | "job_type"
): string {
  if (!job) return "";
  const lang = getLang();
  const tr = job.translations?.[lang];
  if (tr && typeof tr[field] === "string" && tr[field]) {
    return tr[field];
  }
  return (job[field] as string) || "";
}

export function getJobRequirements(job: JobLike | null | undefined): string[] {
  if (!job) return [];
  const lang = getLang();
  const tr = job.translations?.[lang];
  if (tr && Array.isArray(tr.requirements) && tr.requirements.length > 0) {
    return tr.requirements as string[];
  }
  return job.requirements || [];
}
