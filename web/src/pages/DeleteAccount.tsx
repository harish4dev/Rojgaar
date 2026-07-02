import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import Logo from '@/components/Logo'
import './Legal.css'

const CONTACT_EMAIL = 'support@rojgaar.in'
const DELETE_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Delete my Rojgaar worker account')}&body=${encodeURIComponent(
  'Please delete my Rojgaar worker account.\n\nRegistered phone number:\n\nReason (optional):\n',
)}`

export default function DeleteAccount() {
  return (
    <div className="legal">
      <header className="legal__header">
        <Link to="/" className="legal__back">
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <Logo variant="light" linkTo="/" size="sm" />
      </header>

      <main className="legal__main">
        <p className="legal__eyebrow">Workers</p>
        <h1>Delete your account</h1>
        <p className="legal__meta">
          <strong>Rojgaar worker app</strong>
          <br />
          Request permanent deletion of your worker profile and associated data.
        </p>

        <div className="legal__prose">
          <p>
            This page is for workers who use the Rojgaar mobile app. If you want to remove your
            account, follow the steps below. Businesses and partners should contact us from the
            email linked to their portal account.
          </p>

          <h2>How to request deletion</h2>
          <ol>
            <li>
              Email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you can
              access (or include your registered phone number in the message).
            </li>
            <li>
              Use the subject line <strong>Delete my Rojgaar worker account</strong> and include
              your <strong>registered mobile number</strong> so we can verify ownership.
            </li>
            <li>
              We will confirm by reply and process your request within <strong>30 days</strong>.
            </li>
          </ol>

          <p>
            <a href={DELETE_MAILTO} className="legal__contact">
              <Mail size={18} aria-hidden />
              Request account deletion by email
            </a>
          </p>

          <h2>What we delete</h2>
          <p>When your request is approved, we remove or anonymise:</p>
          <ul>
            <li>Your worker profile (name, phone, city, skills, experience, and preferences)</li>
            <li>Saved jobs and in-app activity linked to your account</li>
            <li>Job applications submitted from your account</li>
          </ul>

          <h2>What may be kept</h2>
          <ul>
            <li>
              Records we must retain for legal, tax, or fraud-prevention purposes (for example,
              application timestamps already shared with an employer)
            </li>
            <li>Aggregated or anonymised analytics that cannot identify you</li>
          </ul>

          <h2>Before you delete</h2>
          <p>
            Deletion is permanent. You will need to sign up again with OTP if you want to use
            Rojgaar in the future. Pending job applications may no longer be visible to you after
            deletion.
          </p>

          <h2>Questions</h2>
          <p>
            For privacy or data requests, see our <Link to="/privacy">Privacy Policy</Link> or
            email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </main>

      <footer className="legal__footer">
        <p>© {new Date().getFullYear()} Rojgaar</p>
        <Link to="/">Home</Link>
      </footer>
    </div>
  )
}
