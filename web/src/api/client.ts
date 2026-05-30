const BASE = import.meta.env.VITE_BACKEND_URL ?? ''

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}/api${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error(
      `Cannot reach the API at ${BASE || window.location.origin}. Is the backend running on port 8000?`,
    )
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

export type Role = 'business' | 'partner'

export interface Business {
  id: string
  name: string
  phone: string
  company: string
  city: string
  profile_complete?: boolean
  created_at?: string
}

export interface Partner {
  id: string
  name: string
  phone: string
  agent_type: string
  city: string
  profile_complete?: boolean
  created_at?: string
}

export interface Job {
  id: string
  title: string
  company: string
  industry: string
  city: string
  salary_min: number
  salary_max: number
  description: string
  active: boolean
  applications_count?: number
  created_at: string
}

export interface WorkerProfile {
  id: string
  phone: string
  name?: string
  gender?: string
  age?: number
  city?: string
  skills?: string[]
  experience?: string
  expected_salary?: string
  work_type?: string
  profile_strength?: number
}

export interface JobApplication {
  id: string
  worker_id: string
  job_id: string
  status: string
  applied_at: string
  job?: Job
  worker?: WorkerProfile
}

export interface PartnerCandidate {
  id: string
  partner_id: string
  name: string
  employee_number: string
  skill: string
  experience: string
  city: string
  gender: string
  age: number
  collar_type: string
  phone_verified?: boolean
  status: 'Looking' | 'Matched' | 'Placed'
  created_at?: string
}

export interface PartnerCandidateCreate {
  name: string
  employee_number: string
  skill: string
  experience: string
  city: string
  gender: string
  age: number
  collar_type: string
}

export const api = {
  sendOtp: (phone: string, role: Role) =>
    req<{ success: boolean; message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    }),

  verifyOtp: (phone: string, otp: string, role: Role) =>
    req<{ success: boolean; user: Business | Partner; is_new: boolean; needs_profile: boolean }>(
      '/auth/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, otp, role }) },
    ),

  updateBusiness: (id: string, data: { name: string; company: string; city: string }) =>
    req<Business>(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updatePartner: (id: string, data: { name: string; city: string }) =>
    req<Partner>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getBusinessStats: (id: string) =>
    req<{
      active_jobs: number
      applications: number
      hired: number
      profile_views: number
    }>(`/businesses/${id}/stats`),

  getBusinessJobs: (id: string) => req<Job[]>(`/businesses/${id}/jobs`),

  getBusinessApplications: (id: string) =>
    req<JobApplication[]>(`/businesses/${id}/applications`),

  updateApplicationStatus: (applicationId: string, status: 'Accepted' | 'Rejected') =>
    req<JobApplication>(`/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  createJob: (data: {
    title: string
    company: string
    industry: string
    city: string
    salary_min: number
    salary_max: number
    description: string
    posted_by_business_id: string
  }) => req<Job>('/jobs', { method: 'POST', body: JSON.stringify(data) }),

  getPartnerStats: (id: string) =>
    req<{
      people_added: number
      job_matches: number
      placed: number
      total_earnings: number
    }>(`/partners/${id}/stats`),

  getPartnerCandidates: (id: string) =>
    req<PartnerCandidate[]>(`/partners/${id}/candidates`),

  requestPartnerCandidateOtp: (id: string, data: PartnerCandidateCreate) =>
    req<{ success: boolean; message: string; phone: string }>(
      `/partners/${id}/candidates/request-otp`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  confirmPartnerCandidate: (
    id: string,
    data: { employee_number: string; otp: string },
  ) =>
    req<{ success: boolean; candidate: PartnerCandidate; worker_id?: string }>(
      `/partners/${id}/candidates/confirm`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
}
