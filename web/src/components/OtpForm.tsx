import { useState } from 'react'
import { ArrowRight, Smartphone, UserCircle } from 'lucide-react'
import { api, type Business, type Partner, type Role } from '@/api/client'
import { setSession } from '@/store/auth'
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
  const [city, setCity] = useState('Bengaluru')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await api.sendOtp(cleaned, role)
      setPhone(cleaned)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 4) {
      setError('Enter the 4-digit OTP')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.verifyOtp(phone, otp, role)
      if (res.needs_profile) {
        setPendingUser(res.user)
        setStep('profile')
        return
      }
      setSession(role, res.user)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingUser) return

    const trimmedName = name.trim()
    const trimmedCity = city.trim()
    if (trimmedName.length < 2 || trimmedCity.length < 2) {
      setError('Name and city are required')
      return
    }
    if (role === 'business' && company.trim().length < 2) {
      setError('Company name is required')
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
      setError(err instanceof Error ? err.message : 'Failed to save profile')
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
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          <p className="otp-form__hint">
            Any 4-digit code works in demo mode.
          </p>
          <label htmlFor="otp">Enter OTP</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoFocus
          />
          <button type="submit" disabled={loading || otp.length !== 4}>
            {loading ? 'Verifying…' : 'Verify OTP'}
            {!loading && <ArrowRight size={16} />}
          </button>
          <button
            type="button"
            className="otp-form__back"
            onClick={() => {
              setStep('phone')
              setOtp('')
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
            placeholder="Full name"
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
                placeholder="Business / company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </>
          )}

          <label htmlFor="profile-city">City</label>
          <input
            id="profile-city"
            type="text"
            placeholder="Bengaluru"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

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
