import { storage } from "@/src/utils/storage";

const K_JOB_FILTERS = "rojgaar.job_filters";

export type JobFilterParams = {
  job_type?: string;
  industry?: string;
  experience?: string;
  salary_min?: number;
  salary_max?: number;
};

export const jobFilters = {
  async get(): Promise<JobFilterParams | null> {
    const raw = await storage.getItem<JobFilterParams | null>(K_JOB_FILTERS, null);
    if (!raw || typeof raw !== "object") return null;
    const hasValue = Object.values(raw).some((v) => v !== undefined && v !== null && v !== "");
    return hasValue ? raw : null;
  },

  async set(params: JobFilterParams | null): Promise<void> {
    if (!params || !Object.values(params).some((v) => v !== undefined && v !== null && v !== "")) {
      await storage.removeItem(K_JOB_FILTERS);
      return;
    }
    await storage.setItem(K_JOB_FILTERS, params);
  },

  async clear(): Promise<void> {
    await storage.removeItem(K_JOB_FILTERS);
  },
};
