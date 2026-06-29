import { useState, useEffect } from 'react'
import { ArrowRight, Smartphone, UserCircle } from 'lucide-react'
import { api, type Business, type Partner, type Role } from '@/api/client'
import { setSession } from '@/store/auth'
import { OTP_LENGTH, digitsOnlyOtp, isValidOtp, DEV_OTP } from '@/constants/otp'
import { getApiErrorMessage } from '@/utils/apiError'
import LocationInput from '@/components/LocationInput'
import { emptyLocation, type LocationValue } from '@/utils/location'
import './OtpForm.css'

interface OtpFormProps {
  role: Role
  title: string
  subtitle: string
  onSuccess: () => void
}

type Step = 'phone' | 'otp' | 'profile'

export default function OtpForm({ role, title, subtitle, onSuccess }: OtpFormProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingUser, setPendingUser] = useState<Business | Partner | null>(null)

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState<LocationValue>(emptyLocation())
  const [industry, setIndustry] = useState('')
  const [industries, setIndustries] = useState<{ key: string; label: string }[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    if (step !== 'profile' || role !== 'business') return
    api.getIndustries()
      .then((inds) => {
        setIndustries(inds)
        if (inds.length === 1) setIndustry(inds[0].key)
      })
      .catch(() => {})
  }, [step, role])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.sendOtp(cleaned, role)
      setPhone(cleaned)
      setDevMode(Boolean(res.dev_mode))
      if (res.dev_mode) {
        setOtp(DEV_OTP)
      } else {
        setOtp('')
      }
      setStep('otp')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send OTP'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidOtp(otp)) {
      setError(`Enter the ${OTP_LENGTH}-digit OTP`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.verifyOtp(phone, otp, role)
      if (res.needs_profile) {
        setPendingUser(res.user)
        setLocation(emptyLocation())
        setStep('profile')
        return
      }
      setSession(role, res.user)
      onSuccess()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid OTP'))
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingUser) return

    const trimmedName = name.trim()
    const trimmedCity = location.city.trim()
    if (trimmedName.length < 2 || trimmedCity.length < 2) {
      setError('Name and city are required')
      return
    }
    if (role === 'business' && company.trim().length < 2) {
      setError('Company name is required')
      return
    }
    if (role === 'business' && !industry) {
      setError('Please select your industry')
      return
    }

    setError('')
    setLoading(true)
    try {
      let user: Business | Partner
      if (role === 'business') {
        user = await api.updateBusiness(pendingUser.id, {
          name: trimmedName,
          company: company.trim(),
          city: trimmedCity,
          industry,
          locality: location.locality.trim() || undefined,
          location_label: location.location_label.trim() || undefined,
          location_lat: location.location_lat,
          location_lng: location.location_lng,
        })
      } else {
        user = await api.updatePartner(pendingUser.id, {
          name: trimmedName,
          city: trimmedCity,
        })
      }
      setSession(role, user)
      onSuccess()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save profile'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="otp-form">
      <div className="otp-form__icon">
        {step === 'profile' ? <UserCircle size={28} /> : <Smartphone size={28} />}
      </div>
      <h1>
        {step === 'profile'
          ? role === 'business'
            ? 'Set up your business'
            : 'Set up your profile'
          : title}
      </h1>
      <p className="otp-form__subtitle">
        {step === 'phone' && subtitle}
        {step === 'otp' && `Enter the OTP sent to +91 ${phone}`}
        {step === 'profile' &&
          (role === 'business'
            ? 'Tell us about your business to finish registration.'
            : 'Tell us a bit about yourself to finish registration.')}
      </p>

      {step === 'phone' && (
        <form onSubmit={handleSendOtp}>
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            autoComplete="off"
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send OTP'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify}>
          <label htmlFor="otp">Enter OTP</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(e) => setOtp(digitsOnlyOtp(e.target.value))}
            autoComplete="one-time-code"
            autoFocus
          />
          {devMode && (
            <p className="otp-form__hint">Development mode: OTP auto-filled as {DEV_OTP}.</p>
          )}
          <button type="submit" disabled={loading || !isValidOtp(otp)}>
            {loading ? 'Verifying…' : 'Verify OTP'}
            {!loading && <ArrowRight size={16} />}
          </button>
          <button
            type="button"
            className="otp-form__back"
            onClick={() => {
              setStep('phone')
              setPhone('')
              setOtp('')
              setDevMode(false)
              setError('')
            }}
          >
            Change phone number
          </button>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleCompleteProfile}>
          <label htmlFor="profile-name">Your name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {role === 'business' && (
            <>
              <label htmlFor="profile-company">Company name</label>
              <input
                id="profile-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />

              <label>Industry</label>
              <div className="otp-form__chips">
                {industries.map((ind) => (
                  <button
                    key={ind.key}
                    type="button"
                    className={`otp-form__chip${industry === ind.key ? ' otp-form__chip--active' : ''}`}
                    onClick={() => setIndustry(ind.key)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <LocationInput value={location} onChange={setLocation} autoDetect />

          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Continue to dashboard'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      )}

      {error && <p className="otp-form__error">{error}</p>}
    </div>
  )
}
