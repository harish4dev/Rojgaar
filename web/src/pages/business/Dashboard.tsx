import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
} from 'lucide-react'
import PortalLayout, { StatCard } from '@/components/PortalLayout'
import { api, type Business, type Job, type JobApplication } from '@/api/client'
import { clearSession, getSession, isBusiness, isProfileComplete } from '@/store/auth'
import { getApiErrorMessage } from '@/utils/apiError'
import '../Dashboard.css'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'applications', label: 'Applications', icon: FileText },
]

const GENDER_PREFERENCES = ['Male', 'Female', 'Any']
const EXPERIENCE_BANDS = ['Fresher', '1-2 Years', '3-5 Years', '5+ Years']
const SHIFT_TYPES = ['Day', 'Night', 'Rotational']
const BENEFITS = ['PF', 'ESI', 'Medical Insurance', 'Bonus', 'Incentives', 'Overtime Pay']

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
  } | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [matchScores, setMatchScores] = useState<Record<string, Record<string, number>>>({})
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [title, setTitle] = useState('')
  const [industry, setIndustry] = useState('garments')
  const [metaIndustries, setMetaIndustries] = useState<{ key: string; label: string }[]>([])
  const [jobTitlesByIndustry, setJobTitlesByIndustry] = useState<Record<string, string[]>>({})
  const [city, setCity] = useState('Bengaluru')
  const [salaryMin, setSalaryMin] = useState('10000')
  const [salaryMax, setSalaryMax] = useState('30000')
  const [description, setDescription] = useState('')
  const [genderPreference, setGenderPreference] = useState('Any')
  const [ageMin, setAgeMin] = useState('18')
  const [ageMax, setAgeMax] = useState('60')
  const [experienceBand, setExperienceBand] = useState('Fresher')
  const [salaryNegotiable, setSalaryNegotiable] = useState(false)
  const [preferredLanguages, setPreferredLanguages] = useState('')
  const [workingHours, setWorkingHours] = useState('')
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState('6')
  const [shiftType, setShiftType] = useState('Day')
  const [accommodationProvided, setAccommodationProvided] = useState(false)
  const [foodProvided, setFoodProvided] = useState(false)
  const [transportationProvided, setTransportationProvided] = useState(false)
  const [benefits, setBenefits] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState('')

  const appsByJob = useMemo(() => groupApplicationsByJob(applications), [applications])

  const refresh = useCallback(async (biz: Business) => {
    setLoadError('')
    try {
      const [s, j, apps] = await Promise.all([
        api.getBusinessStats(biz.id),
        api.getBusinessJobs(biz.id),
        api.getBusinessApplications(biz.id),
      ])
      setStats(s)
      setJobs(j)
      setApplications(apps)
      const jobIds = [...new Set(apps.map((a) => a.job_id))]
      const scoreMaps: Record<string, Record<string, number>> = {}
      await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const ranked = await api.getJobCandidatesRanking(jobId)
            scoreMaps[jobId] = {}
            for (const row of ranked) {
              if (row.worker?.id) scoreMaps[jobId][row.worker.id] = row.match_score
            }
          } catch {
            scoreMaps[jobId] = {}
          }
        }),
      )
      setMatchScores(scoreMaps)
      setExpandedJobs((prev) => {
        const next = new Set(prev)
        for (const app of apps) {
          next.add(app.job_id)
        }
        return next
      })
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load dashboard data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!businessUser) return
    refresh(businessUser).catch(console.warn)
  }, [businessUser, refresh])

  useEffect(() => {
    Promise.all([api.getIndustries(), api.getIndustryJobTitles()])
      .then(([inds, titles]) => {
        setMetaIndustries(inds)
        setJobTitlesByIndustry(titles)
      })
      .catch(console.warn)
  }, [])

  useEffect(() => {
    if (businessUser?.industry) setIndustry(businessUser.industry)
    if (businessUser?.city) setCity(businessUser.city)
  }, [businessUser])

  const jobRoles = jobTitlesByIndustry[industry] ?? []

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
        salary_negotiable: salaryNegotiable,
        gender_preference: genderPreference,
        age_min: parseInt(ageMin, 10) || undefined,
        age_max: parseInt(ageMax, 10) || undefined,
        experience_band: experienceBand,
        requirements: [title.trim()],
        preferred_languages: preferredLanguages
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        working_hours: workingHours.trim() || undefined,
        working_days_per_week: parseInt(workingDaysPerWeek, 10) || undefined,
        shift_type: shiftType,
        accommodation_provided: accommodationProvided,
        food_provided: foodProvided,
        transportation_provided: transportationProvided,
        benefits,
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

  const handleStopHiring = async (jobId: string) => {
    try {
      await api.updateJobHiringStatus(jobId, 'stopped')
      setMessage('Hiring stopped for selected job.')
      await refresh(businessUser)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to stop hiring')
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setMessage('Location detected. You can still edit location manually.'),
      () => setMessage('Could not auto-detect location. Please enter manually.'),
    )
  }

  const pageTitle = active === 'applications' ? 'Applications' : 'Dashboard'

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

      {loadError && (
        <p className="dash-message dash-message--banner">
          {loadError}{' '}
          <button type="button" className="dash-link-btn" onClick={() => businessUser && refresh(businessUser)}>
            Retry
          </button>
        </p>
      )}

      <div className="dash-stats">
        <StatCard icon={Briefcase} value={String(stats?.active_jobs ?? '—')} label="Active Jobs" />
        <StatCard
          icon={FileText}
          value={String(stats?.applications ?? '—')}
          label="Applications"
          color="#10B981"
        />
        <StatCard icon={Users} value={String(stats?.hired ?? '—')} label="Hired" color="#3B82F6" />
      </div>

      {message && active === 'applications' && (
        <p className={`dash-message dash-message--banner${message.includes('success') ? ' dash-message--ok' : ''}`}>
          {message}
        </p>
      )}

      {active === 'dashboard' && (
        <div className="dash-layout dash-layout--single">
          <section className="dash-card dash-card--wide">
            <div className="dash-card__header">
              <h2>Post a new job</h2>
              {jobs.length > 0 && (
                <button
                  type="button"
                  className="dash-link-btn"
                  onClick={() => setActive('applications')}
                >
                  View {applications.length} applications →
                </button>
              )}
            </div>

            <label className="dash-label">Industry</label>
            <div className="dash-chips">
              {metaIndustries.map((ind) => (
                <button
                  key={ind.key}
                  type="button"
                  className={`dash-chip${industry === ind.key ? ' dash-chip--active' : ''}`}
                  onClick={() => {
                    setIndustry(ind.key)
                    setTitle('')
                  }}
                >
                  {ind.label}
                </button>
              ))}
            </div>

            <label className="dash-label">Job role</label>
            <div className="dash-chips">
              {jobRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`dash-chip${title === role ? ' dash-chip--active' : ''}`}
                  onClick={() => setTitle(role)}
                >
                  {role}
                </button>
              ))}
            </div>

            <label className="dash-label">Location</label>
            <div className="dash-row">
              <input className="dash-input" value={city} onChange={(e) => setCity(e.target.value)} />
              <button type="button" className="dash-submit dash-submit--secondary" onClick={detectLocation}>
                Auto-detect
              </button>
            </div>

            <label className="dash-label">Salary range (min – max)</label>
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
            <label className="dash-label">Gender preference</label>
            <div className="dash-chips">
              {GENDER_PREFERENCES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`dash-chip${genderPreference === value ? ' dash-chip--active' : ''}`}
                  onClick={() => setGenderPreference(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <label className="dash-label">Age requirement (min-max)</label>
            <div className="dash-row">
              <input className="dash-input" type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
              <input className="dash-input" type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
            </div>
            <label className="dash-label">Experience requirement</label>
            <div className="dash-chips">
              {EXPERIENCE_BANDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`dash-chip${experienceBand === value ? ' dash-chip--active' : ''}`}
                  onClick={() => setExperienceBand(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <label className="dash-label">Preferred languages (comma-separated)</label>
            <input className="dash-input" value={preferredLanguages} onChange={(e) => setPreferredLanguages(e.target.value)} />
            <label className="dash-label">Working hours</label>
            <input className="dash-input" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
            <label className="dash-label">Working days/week</label>
            <input className="dash-input" type="number" value={workingDaysPerWeek} onChange={(e) => setWorkingDaysPerWeek(e.target.value)} />
            <label className="dash-label">Shift type</label>
            <div className="dash-chips">
              {SHIFT_TYPES.map((value) => (
                <button key={value} type="button" className={`dash-chip${shiftType === value ? ' dash-chip--active' : ''}`} onClick={() => setShiftType(value)}>
                  {value}
                </button>
              ))}
            </div>
            <div className="dash-chips">
              <button type="button" className={`dash-chip${salaryNegotiable ? ' dash-chip--active' : ''}`} onClick={() => setSalaryNegotiable(!salaryNegotiable)}>
                Salary Negotiable
              </button>
              <button type="button" className={`dash-chip${accommodationProvided ? ' dash-chip--active' : ''}`} onClick={() => setAccommodationProvided(!accommodationProvided)}>
                Accommodation
              </button>
              <button type="button" className={`dash-chip${foodProvided ? ' dash-chip--active' : ''}`} onClick={() => setFoodProvided(!foodProvided)}>
                Food
              </button>
              <button type="button" className={`dash-chip${transportationProvided ? ' dash-chip--active' : ''}`} onClick={() => setTransportationProvided(!transportationProvided)}>
                Transport
              </button>
            </div>
            <label className="dash-label">Benefits</label>
            <div className="dash-chips">
              {BENEFITS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`dash-chip${benefits.includes(item) ? ' dash-chip--active' : ''}`}
                  onClick={() =>
                    setBenefits((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]))
                  }
                >
                  {item}
                </button>
              ))}
            </div>

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
              {posting ? 'Posting…' : 'Post job'}
            </button>
          </section>
        </div>
      )}

      {active === 'applications' && (
        <div className="dash-layout dash-layout--full">
          <section className="dash-jobs-list">
            <div className="dash-card__header">
              <h2>Your Jobs & Applicants</h2>
              <span className="dash-muted">{applications.length} applications across {jobs.length} jobs</span>
            </div>

            {jobs.length === 0 ? (
              <p className="dash-empty">No jobs yet. Post your first job to start receiving applications.</p>
            ) : (
              jobs.map((job) => {
                const jobApps = (appsByJob.get(job.id) ?? []).slice().sort((a, b) => {
                  const sa = matchScores[job.id]?.[a.worker_id] ?? 0
                  const sb = matchScores[job.id]?.[b.worker_id] ?? 0
                  return sb - sa
                })
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
                      {job.active && (
                        <button
                          type="button"
                          className="dash-submit dash-submit--secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleStopHiring(job.id)
                          }}
                        >
                          Stop Hiring
                        </button>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="job-block__applicants">
                        {jobApps.length === 0 ? (
                          <p className="job-block__empty">No applications for this job yet.</p>
                        ) : (
                          jobApps.map((app) => (
                            <div key={app.id} className="applicant-card">
                              <div className="applicant-card__main">
                                <div className="applicant-card__name">
                                  {workerLabel(app)}
                                  {matchScores[job.id]?.[app.worker_id] ? (
                                    <span className="dash-pill dash-pill--matched" style={{ marginLeft: 8 }}>
                                      {matchScores[job.id][app.worker_id]}% match
                                    </span>
                                  ) : null}
                                </div>
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
        </div>
      )}
    </PortalLayout>
  )
}
