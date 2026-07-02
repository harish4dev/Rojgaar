import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Users } from 'lucide-react'
import Logo from '@/components/Logo'
import './PortalGateway.css'

export default function PortalGateway() {
  return (
    <div className="portal-gateway">
      <header className="portal-gateway__header">
        <Link to="/" className="portal-gateway__back">
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <Logo variant="light" linkTo="/" size="sm" />
      </header>

      <main className="portal-gateway__main">
        <h1>Sign in to your portal</h1>
        <p>Choose your account type to log in or create a new account.</p>

        <div className="portal-gateway__cards">
          <Link to="/business/login" className="portal-gateway__card">
            <div className="portal-gateway__card-icon portal-gateway__card-icon--orange">
              <Building2 size={28} />
            </div>
            <h2>Business</h2>
            <p>Post jobs, review applications, and hire workers for your company.</p>
            <span className="portal-gateway__card-cta">Login / Sign up →</span>
          </Link>

          <Link to="/partner/login" className="portal-gateway__card">
            <div className="portal-gateway__card-icon portal-gateway__card-icon--blue">
              <Users size={28} />
            </div>
            <h2>Partner</h2>
            <p>Add candidates, track placements, and manage your agent network.</p>
            <span className="portal-gateway__card-cta">Login / Sign up →</span>
          </Link>
        </div>

        <p className="portal-gateway__note">
          Looking for work?{' '}
          <Link to="/#download">Download the Rojgaar app</Link> for workers.
        </p>
        <p className="portal-gateway__note">
          <Link to="/privacy">Privacy Policy</Link>
          {' · '}
          <Link to="/deleteacc">Delete worker account</Link>
        </p>
      </main>
    </div>
  )
}
