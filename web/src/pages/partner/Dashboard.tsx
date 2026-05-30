import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  DollarSign,
  FileText,
  GitBranch,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react'
import PortalLayout, { StatCard } from '@/components/PortalLayout'
import { api, type Partner, type PartnerCandidate } from '@/api/client'
import { clearSession, getSession, isPartner, isProfileComplete } from '@/store/auth'
import '../Dashboard.css'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'people', label: 'People / Candidates', icon: Users },
  { key: 'network', label: 'My Network', icon: GitBranch },
  { key: 'matches', label: 'Job Matches', icon: Briefcase },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const SKILLS = [
  'Mason',
  'Helper',
  'Painter',
  'Electrician',
  'Welder',
  'Plumber',
  'Carpenter',
  'Driver',
  'Security',
  'Other',
]

const EXP = ['Fresher', '1-2 Years', '3-5 Years', '5+ Years']
const GENDERS = ['Male', 'Female', 'Other']
const COLLAR_TYPES = ['Blue Collar', 'Gray Collar']

const STATUS_CLASS: Record<string, string> = {
  Looking: 'looking',
  Matched: 'matched',
  Placed: 'placed',
}

type AddStep = 'details' | 'otp'

export default function PartnerDashboard() {
  const session = useMemo(() => getSession(), [])
  const partnerUser = isPartner(session) ? session.user : null

  const [active, setActive] = useState('dashboard')
  const [stats, setStats] = useState<{
    people_added: number
    job_matches: number
    placed: number
    total_earnings: number
  } | null>(null)
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([])

  const [name, setName] = useState('')
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [skill, setSkill] = useState('Mason')
  const [exp, setExp] = useState('1-2 Years')
  const [city, setCity] = useState('Bengaluru')
  const [gender, setGender] = useState('Male')
  const [age, setAge] = useState('')
  const [collarType, setCollarType] = useState('Blue Collar')
  const [addStep, setAddStep] = useState<AddStep>('details')
  const [otp, setOtp] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async (p: Partner) => {
    const [s, c] = await Promise.all([
      api.getPartnerStats(p.id),
      api.getPartnerCandidates(p.id),
    ])
    setStats(s)
    setCandidates(c)
  }, [])

  useEffect(() => {
    if (!partnerUser) return
    refresh(partnerUser).catch(console.warn)
  }, [partnerUser, refresh])

  if (!partnerUser || !isProfileComplete('partner', partnerUser)) {
    return <Navigate to="/partner/login" replace />
  }

  const cleanedNumber = employeeNumber.replace(/\D/g, '')
  const ageNum = parseInt(age, 10)
  const detailsValid =
    name.trim().length >= 2 &&
    cleanedNumber.length === 10 &&
    !Number.isNaN(ageNum) &&
    ageNum >= 18 &&
    ageNum <= 70

  const resetForm = () => {
    setName('')
    setEmployeeNumber('')
    setAge('')
    setOtp('')
    setAddStep('details')
    setPendingPhone('')
  }

  const handleRequestOtp = async () => {
    if (!detailsValid) {
      setMessage('Fill name, 10-digit phone, gender, age (18–70), and collar type.')
      return
    }
    setAdding(true)
    setMessage('')
    try {
      const res = await api.requestPartnerCandidateOtp(partnerUser.id, {
        name: name.trim(),
        employee_number: cleanedNumber,
        skill,
        experience: exp,
        city: city.trim(),
        gender,
        age: ageNum,
        collar_type: collarType,
      })
      setPendingPhone(res.phone)
      setAddStep('otp')
      setMessage('OTP sent to employee. Enter the 4-digit code they received.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setAdding(false)
    }
  }

  const handleConfirmOtp = async () => {
    if (otp.replace(/\D/g, '').length !== 4) {
      setMessage('Enter the 4-digit OTP from the employee.')
      return
    }
    setAdding(true)
    setMessage('')
    try {
      await api.confirmPartnerCandidate(partnerUser.id, {
        employee_number: pendingPhone || cleanedNumber,
        otp: otp.replace(/\D/g, '').slice(0, 4),
      })
      resetForm()
      setMessage('Employee verified and added to your network.')
      await refresh(partnerUser)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setAdding(false)
    }
  }

  return (
    <PortalLayout
      title="Partner Portal"
      userName={partnerUser.name || 'Partner'}
      userRole="Agent"
      nav={NAV}
      activeKey={active}
      onNavSelect={setActive}
      onLogout={clearSession}
    >
      <h1 className="dash-title">Dashboard</h1>

      <div className="dash-stats">
        <StatCard icon={Users} value={String(stats?.people_added ?? '—')} label="People Added" />
        <StatCard
          icon={Briefcase}
          value={String(stats?.job_matches ?? '—')}
          label="Job Matches"
          color="#3B82F6"
        />
        <StatCard
          icon={CheckCircle2}
          value={String(stats?.placed ?? '—')}
          label="Placed"
          color="#10B981"
        />
        <StatCard
          icon={DollarSign}
          value={`₹${(stats?.total_earnings ?? 0).toLocaleString('en-IN')}`}
          label="Total Earnings"
          color="#A855F7"
        />
      </div>

      <div className="dash-grid">
        <section className="dash-card dash-card--wide">
          <div className="dash-card__header">
            <h2>Recently Added People</h2>
          </div>
          <div className="dash-table dash-table--partner">
            <div className="dash-table__head">
              <span>Name</span>
              <span>Employee No.</span>
              <span>Skill</span>
              <span>Collar</span>
              <span>Experience</span>
              <span>Location</span>
              <span>Status</span>
            </div>
            {candidates.length === 0 ? (
              <p className="dash-empty">No candidates yet. Add your first one →</p>
            ) : (
              candidates.slice(0, 10).map((c) => (
                <div key={c.id} className="dash-table__row">
                  <span className="dash-table__strong">{c.name}</span>
                  <span>{c.employee_number || '—'}</span>
                  <span>{c.skill}</span>
                  <span>{c.collar_type || '—'}</span>
                  <span>{c.experience}</span>
                  <span>{c.city}</span>
                  <span className={`dash-pill dash-pill--${STATUS_CLASS[c.status] || 'looking'}`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="dash-card">
          <h2>{addStep === 'details' ? 'Add New Person' : 'Verify Employee OTP'}</h2>

          {addStep === 'details' ? (
            <>
              <label className="dash-label">Name</label>
              <input
                className="dash-input"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="dash-label">Employee Number (Phone)</label>
              <input
                className="dash-input"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
              />

              <label className="dash-label">Gender</label>
              <div className="dash-chips">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`dash-chip${gender === g ? ' dash-chip--active' : ''}`}
                    onClick={() => setGender(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <label className="dash-label">Age</label>
              <input
                className="dash-input dash-input--narrow"
                type="number"
                min={18}
                max={70}
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))}
              />

              <label className="dash-label">Collar type</label>
              <div className="dash-chips">
                {COLLAR_TYPES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`dash-chip${collarType === c ? ' dash-chip--active' : ''}`}
                    onClick={() => setCollarType(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <label className="dash-label">Skill</label>
              <div className="dash-chips">
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`dash-chip${skill === s ? ' dash-chip--active' : ''}`}
                    onClick={() => setSkill(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label className="dash-label">Experience</label>
              <div className="dash-chips">
                {EXP.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`dash-chip${exp === e ? ' dash-chip--active' : ''}`}
                    onClick={() => setExp(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>

              <label className="dash-label">Location</label>
              <input className="dash-input" value={city} onChange={(e) => setCity(e.target.value)} />

              {message && !message.includes('verified') && (
                <p className="dash-message">{message}</p>
              )}

              <button
                type="button"
                className="dash-submit"
                disabled={!detailsValid || adding}
                onClick={handleRequestOtp}
              >
                {adding ? 'Sending OTP…' : 'Send OTP to Employee'}
              </button>
            </>
          ) : (
            <>
              <p className="dash-muted">
                OTP sent to <strong>{pendingPhone}</strong>. Ask the employee for their code and
                enter it below.
              </p>

              <label className="dash-label">4-digit OTP</label>
              <input
                className="dash-input dash-input--narrow"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />

              {message && (
                <p
                  className={`dash-message${message.includes('verified') || message.includes('added') ? ' dash-message--ok' : ''}`}
                >
                  {message}
                </p>
              )}

              <div className="dash-form-actions">
                <button
                  type="button"
                  className="dash-submit dash-submit--secondary"
                  onClick={() => {
                    setAddStep('details')
                    setOtp('')
                    setMessage('')
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="dash-submit"
                  disabled={otp.length !== 4 || adding}
                  onClick={handleConfirmOtp}
                >
                  {adding ? 'Verifying…' : 'Verify & Add'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </PortalLayout>
  )
}
