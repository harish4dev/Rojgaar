import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  MessageSquare,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react'
import PortalLayout, { StatCard } from '@/components/PortalLayout'
import { api, type Business, type Job, type JobApplication } from '@/api/client'
import { clearSession, getSession, isBusiness, isProfileComplete } from '@/store/auth'
import '../Dashboard.css'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'applications', label: 'Applications', icon: FileText },
  { key: 'workers', label: 'Workers', icon: Users },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const INDUSTRIES = [
  { key: 'construction', label: 'Construction' },
  { key: 'factory', label: 'Factory' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'driver', label: 'Driver' },
  { key: 'other', label: 'Other' },
]

function workerLabel(app: JobApplication) {
  return app.worker?.name || app.worker?.phone || 'Unknown worker'
}

function statusClass(status: string) {
  if (status === 'Accepted' || status === 'Hired') return 'accepted'
  if (status === 'Rejected') return 'rejected'
  return 'pending'
}

function groupApplicationsByJob(apps: JobApplication[]) {
  const map = new Map<string, JobApplication[]>()
  for (const app of apps) {
    const list = map.get(app.job_id) ?? []
    list.push(app)
    map.set(app.job_id, list)
  }
  return map
}

export default function BusinessDashboard() {
  const session = useMemo(() => getSession(), [])
  const businessUser = isBusiness(session) ? session.user : null

  const [active, setActive] = useState('dashboard')
  const [stats, setStats] = useState<{
    active_jobs: number
    applications: number
    hired: number
    profile_views: number
  } | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [industry, setIndustry] = useState('construction')
  const [city, setCity] = useState('Bengaluru')
  const [salaryMin, setSalaryMin] = useState('10000')
  const [salaryMax, setSalaryMax] = useState('30000')
  const [description, setDescription] = useState('')
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState('')

  const appsByJob = useMemo(() => groupApplicationsByJob(applications), [applications])

  const refresh = useCallback(async (biz: Business) => {
    const [s, j, apps] = await Promise.all([
      api.getBusinessStats(biz.id),
      api.getBusinessJobs(biz.id),
      api.getBusinessApplications(biz.id),
    ])
    setStats(s)
    setJobs(j)
    setApplications(apps)
    setExpandedJobs((prev) => {
      const next = new Set(prev)
      for (const app of apps) {
        next.add(app.job_id)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!businessUser) return
    refresh(businessUser).catch(console.warn)
  }, [businessUser, refresh])

  if (!businessUser || !isProfileComplete('business', businessUser)) {
    return <Navigate to="/business/login" replace />
  }

  const toggleJob = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  const handleApplicationAction = async (appId: string, status: 'Accepted' | 'Rejected') => {
    setUpdatingId(appId)
    try {
      await api.updateApplicationStatus(appId, status)
      await refresh(businessUser)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePost = async () => {
    if (!title.trim()) return
    setPosting(true)
    setMessage('')
    try {
      await api.createJob({
        title: title.trim(),
        company: businessUser.company,
        industry,
        city,
        salary_min: parseInt(salaryMin, 10) || 0,
        salary_max: parseInt(salaryMax, 10) || 0,
        description: description.trim() || 'Posted via Business Portal.',
        posted_by_business_id: businessUser.id,
      })
      setTitle('')
      setDescription('')
      setMessage('Job posted successfully.')
      await refresh(businessUser)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to post job')
    } finally {
      setPosting(false)
    }
  }

  const showJobsSection = active === 'dashboard' || active === 'jobs' || active === 'applications'
  const showPostForm = active === 'dashboard' || active === 'jobs'

  const pageTitle =
    active === 'applications' ? 'Applications' : active === 'jobs' ? 'Jobs' : 'Dashboard'

  return (
    <PortalLayout
      title="Business Portal"
      userName={businessUser.name || 'Business'}
      userRole="Owner"
      nav={NAV}
      activeKey={active}
      onNavSelect={setActive}
      onLogout={clearSession}
    >
      <h1 className="dash-title">{pageTitle}</h1>

      <div className="dash-stats">
        <StatCard icon={Briefcase} value={String(stats?.active_jobs ?? '—')} label="Active Jobs" />
        <StatCard
          icon={FileText}
          value={String(stats?.applications ?? '—')}
          label="Applications"
          color="#10B981"
        />
        <StatCard icon={Users} value={String(stats?.hired ?? '—')} label="Hired" color="#3B82F6" />
        <StatCard
          icon={Eye}
          value={String(stats?.profile_views ?? '—')}
          label="Profile Views"
          color="#A855F7"
        />
      </div>

      {showJobsSection && (
        <div className={`dash-layout${showPostForm ? '' : ' dash-layout--full'}`}>
          <section className="dash-jobs-list">
            <div className="dash-card__header">
              <h2>Your Jobs & Applicants</h2>
              <span className="dash-muted">{applications.length} applications across {jobs.length} jobs</span>
            </div>

            {jobs.length === 0 ? (
              <p className="dash-empty">No jobs yet. Post your first job to start receiving applications.</p>
            ) : (
              jobs.map((job) => {
                const jobApps = appsByJob.get(job.id) ?? []
                const isExpanded = expandedJobs.has(job.id)

                return (
                  <article key={job.id} className="job-block">
                    <button
                      type="button"
                      className="job-block__header"
                      onClick={() => toggleJob(job.id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="job-block__toggle">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <div className="job-block__info">
                        <span className="job-block__title">{job.title}</span>
                        <span className="job-block__meta">
                          {job.city} · ₹{job.salary_min.toLocaleString('en-IN')}–
                          {job.salary_max.toLocaleString('en-IN')} · Posted{' '}
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="job-block__count">{jobApps.length} applicants</span>
                      <span className={`dash-status dash-status--${job.active ? 'active' : 'closed'}`}>
                        {job.active ? 'Active' : 'Closed'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="job-block__applicants">
                        {jobApps.length === 0 ? (
                          <p className="job-block__empty">No applications for this job yet.</p>
                        ) : (
                          jobApps.map((app) => (
                            <div key={app.id} className="applicant-card">
                              <div className="applicant-card__main">
                                <div className="applicant-card__name">{workerLabel(app)}</div>
                                <div className="applicant-card__grid">
                                  <div>
                                    <span className="applicant-card__label">Phone</span>
                                    <span>{app.worker?.phone ?? '—'}</span>
                                  </div>
                                  <div>
                                    <span className="applicant-card__label">City</span>
                                    <span>{app.worker?.city ?? '—'}</span>
                                  </div>
                                  <div>
                                    <span className="applicant-card__label">Skills</span>
                                    <span>
                                      {app.worker?.skills?.length
                                        ? app.worker.skills.join(', ')
                                        : '—'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="applicant-card__label">Experience</span>
                                    <span>{app.worker?.experience ?? '—'}</span>
                                  </div>
                                  <div>
                                    <span className="applicant-card__label">Expected Salary</span>
                                    <span>{app.worker?.expected_salary ?? '—'}</span>
                                  </div>
                                  <div>
                                    <span className="applicant-card__label">Applied On</span>
                                    <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="applicant-card__actions">
                                <span className={`dash-pill dash-pill--${statusClass(app.status)}`}>
                                  {app.status}
                                </span>
                                {app.status === 'Pending' && (
                                  <div className="applicant-card__buttons">
                                    <button
                                      type="button"
                                      className="btn-accept"
                                      disabled={updatingId === app.id}
                                      onClick={() => handleApplicationAction(app.id, 'Accepted')}
                                    >
                                      {updatingId === app.id ? '…' : 'Accept'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-reject"
                                      disabled={updatingId === app.id}
                                      onClick={() => handleApplicationAction(app.id, 'Rejected')}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </section>

          {showPostForm && (
            <section className="dash-card dash-card--sticky">
              <h2>Post a New Job</h2>

              <label className="dash-label">Job Title</label>
              <input
                className="dash-input"
                placeholder="e.g. Mason, Electrician"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label className="dash-label">Industry</label>
              <div className="dash-chips">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.key}
                    type="button"
                    className={`dash-chip${industry === ind.key ? ' dash-chip--active' : ''}`}
                    onClick={() => setIndustry(ind.key)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>

              <label className="dash-label">Location</label>
              <input className="dash-input" value={city} onChange={(e) => setCity(e.target.value)} />

              <label className="dash-label">Salary Range (Min – Max)</label>
              <div className="dash-row">
                <input
                  className="dash-input"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
                <input
                  className="dash-input"
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
              </div>

              <label className="dash-label">Description</label>
              <textarea
                className="dash-input dash-textarea"
                placeholder="Tell workers about this role..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              {message && (
                <p className={`dash-message${message.includes('success') ? ' dash-message--ok' : ''}`}>
                  {message}
                </p>
              )}

              <button
                type="button"
                className="dash-submit"
                disabled={!title.trim() || posting}
                onClick={handlePost}
              >
                {posting ? 'Posting…' : 'Post Job'}
              </button>
            </section>
          )}
        </div>
      )}
    </PortalLayout>
  )
}
