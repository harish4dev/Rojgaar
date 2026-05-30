import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import OtpForm from '@/components/OtpForm'
import Logo from '@/components/Logo'
import { getSession, isProfileComplete } from '@/store/auth'
import '../AuthPage.css'

export default function PartnerAuth() {
  const navigate = useNavigate()
  const session = getSession()

  if (session?.role === 'partner' && isProfileComplete('partner', session.user)) {
    return <Navigate to="/partner/dashboard" replace />
  }

  return (
    <div className="auth-page">
      <header className="auth-page__header">
        <Link to="/portal" className="auth-page__back">
          <ArrowLeft size={18} />
          Back
        </Link>
        <Logo variant="light" linkTo="/" size="sm" />
      </header>
      <main className="auth-page__main">
        <OtpForm
          role="partner"
          title="Partner login"
          subtitle="Enter your phone number, verify OTP, then complete your profile if you're new."
          onSuccess={() => navigate('/partner/dashboard')}
        />
      </main>
    </div>
  )
}
