const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function req(path: string, options: RequestInit = {}) {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  sendOtp: (phone: string, role: string = "worker") =>
    req("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone, role }) }),
  verifyOtp: (phone: string, otp: string, role: string = "worker") =>
    req("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp, role }) }),

  getWorker: (id: string) => req(`/workers/${id}`),
  updateWorker: (id: string, data: any) =>
    req(`/workers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listJobs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const q = qs.toString();
    return req(`/jobs${q ? `?${q}` : ""}`);
  },
  getJob: (id: string) => req(`/jobs/${id}`),
  createJob: (data: any) => req("/jobs", { method: "POST", body: JSON.stringify(data) }),

  apply: (worker_id: string, job_id: string) =>
    req("/applications", { method: "POST", body: JSON.stringify({ worker_id, job_id }) }),
  listApplications: (worker_id: string) => req(`/applications?worker_id=${worker_id}`),

  saveJob: (worker_id: string, job_id: string) =>
    req("/saved-jobs", { method: "POST", body: JSON.stringify({ worker_id, job_id }) }),
  unsaveJob: (worker_id: string, job_id: string) =>
    req(`/saved-jobs?worker_id=${worker_id}&job_id=${job_id}`, { method: "DELETE" }),
  listSavedJobs: (worker_id: string) => req(`/saved-jobs?worker_id=${worker_id}`),

  getBusiness: (id: string) => req(`/businesses/${id}`),
  getBusinessStats: (id: string) => req(`/businesses/${id}/stats`),
  getBusinessJobs: (id: string) => req(`/businesses/${id}/jobs`),

  getPartner: (id: string) => req(`/partners/${id}`),
  getPartnerStats: (id: string) => req(`/partners/${id}/stats`),
  getPartnerCandidates: (id: string) => req(`/partners/${id}/candidates`),
  addPartnerCandidate: (id: string, data: any) =>
    req(`/partners/${id}/candidates`, { method: "POST", body: JSON.stringify(data) }),

  getCities: () => req("/meta/cities"),
  getIndustries: () => req("/meta/industries"),
  getSkills: () => req("/meta/skills"),
};
