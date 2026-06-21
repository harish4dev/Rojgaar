import { session } from "@/src/store/session";

const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export function getApiBaseUrl(): string {
  return BASE;
}

async function req(path: string, options: RequestInit = {}, auth = true) {
  if (!BASE) {
    throw new Error(
      "EXPO_PUBLIC_BACKEND_URL is not set. Add it to frontend/.env before building."
    );
  }
  const url = `${BASE}/api${path}`;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = await session.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("Network request failed. Check your connection and API URL.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  sendOtp: (phone: string, role: string = "worker") =>
    req("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone, role }) }, false),
  verifyOtp: (phone: string, otp: string, role: string = "worker") =>
    req("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp, role }) }, false),

  getWorker: (id: string) => req(`/workers/${id}`),
  updateWorker: (id: string, data: any) =>
    req(`/workers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listJobs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const q = qs.toString();
    return req(`/jobs${q ? `?${q}` : ""}`, {}, false);
  },
  getJob: (id: string) => req(`/jobs/${id}`, {}, false),

  apply: (worker_id: string, job_id: string) =>
    req("/applications", { method: "POST", body: JSON.stringify({ worker_id, job_id }) }),
  listApplications: (worker_id: string) => req(`/applications?worker_id=${worker_id}`),

  saveJob: (worker_id: string, job_id: string) =>
    req("/saved-jobs", { method: "POST", body: JSON.stringify({ worker_id, job_id }) }),
  unsaveJob: (worker_id: string, job_id: string) =>
    req(`/saved-jobs?worker_id=${worker_id}&job_id=${job_id}`, { method: "DELETE" }),
  listSavedJobs: (worker_id: string) => req(`/saved-jobs?worker_id=${worker_id}`),

  getCities: () => req("/meta/cities", {}, false),
  getIndustries: () => req("/meta/industries", {}, false),
  getSkills: () => req("/meta/skills", {}, false),
  getIndustryJobTitles: () => req("/meta/industry-job-titles", {}, false),
  getGreyCollarSkills: () => req("/meta/grey-collar-skills", {}, false),
  getWorkerRecommendations: (
    workerId: string,
    limit: number = 20,
    params: Record<string, string | number> = {}
  ) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const q = qs.toString();
    return req(`/recommendations/workers/${workerId}/jobs${q ? `?${q}` : ""}`);
  },
};
