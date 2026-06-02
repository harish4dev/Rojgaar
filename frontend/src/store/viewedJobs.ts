import { storage } from "@/src/utils/storage";

const K_VIEWED = "rojgaar.viewed_jobs";
const MAX_ITEMS = 50;

export type ViewedJobRecord = {
  id: string;
  title: string;
  company: string;
  city: string;
  salary_min: number;
  salary_max: number;
  image_url?: string | null;
  viewed_at: string;
};

export const viewedJobs = {
  async list(): Promise<ViewedJobRecord[]> {
    const raw = await storage.getItem<ViewedJobRecord[]>(K_VIEWED, []);
    return Array.isArray(raw) ? raw : [];
  },

  async add(job: Omit<ViewedJobRecord, "viewed_at">): Promise<void> {
    const existing = await this.list();
    const next: ViewedJobRecord[] = [
      { ...job, viewed_at: new Date().toISOString() },
      ...existing.filter((j) => j.id !== job.id),
    ].slice(0, MAX_ITEMS);
    await storage.setItem(K_VIEWED, next);
  },

  async clear(): Promise<void> {
    await storage.removeItem(K_VIEWED);
  },
};
