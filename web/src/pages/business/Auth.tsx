import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import OtpForm from '@/components/OtpForm'
import Logo from '@/components/Logo'
import { getSession, isProfileComplete } from '@/store/auth'
import '../AuthPage.css'

export default function BusinessAuth() {
  const navigate = useNavigate()
  const session = getSession()

  if (session?.role === 'business' && isProfileComplete('business', session.user)) {
    return <Navigate to="/business/dashboard" replace />
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
          role="business"
          title="Business login"
          subtitle="Enter your phone number, verify OTP, then complete your profile if you're new."
          onSuccess={() => navigate('/business/dashboard')}
        />
      </main>
    </div>
  )
}
