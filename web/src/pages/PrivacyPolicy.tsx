import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import Logo from '@/components/Logo'
import './Legal.css'

const EFFECTIVE_DATE = '21 March 2026'
const CONTACT_EMAIL = 'support@rojgaar.in'

export default function PrivacyPolicy() {
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
        <p className="legal__eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal__meta">
          <strong>Rojgaar</strong> · Worker mobile app, business portal, and partner portal
          <br />
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="legal__prose">
          <p>
            Rojgaar (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Rojgaar worker
            mobile application (Android package <code>com.rojgaar.worker</code>), this website, and
            related web portals that help workers find jobs and help businesses and partners hire or
            place candidates. This Privacy Policy explains what information we collect, how we use it,
            and the choices you have.
          </p>
          <p>
            By using our services, you agree to this Privacy Policy. If you do not agree, please do
            not use the app or website.
          </p>

          <h2>1. Information we collect</h2>
          <h3>Information you provide</h3>
          <ul>
            <li>
              <strong>Phone number</strong> — to create your account and verify your identity via
              one-time password (OTP).
            </li>
            <li>
              <strong>Profile details</strong> — such as name, gender, age, city, preferred
              language, skills, industries, work experience, expected salary, and work type.
            </li>
            <li>
              <strong>Job activity</strong> — jobs you view, save, or apply to, and application
              status.
            </li>
            <li>
              <strong>Business or partner account details</strong> — if you use our web portals,
              including name, company, city, industry, and job postings.
            </li>
            <li>
              <strong>Support messages</strong> — when you contact us by email or in-app support.
            </li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li>
              <strong>Location</strong> — with your permission, we may use your device location to
              suggest your city and show nearby jobs. You can deny location access and enter your
              city manually.
            </li>
            <li>
              <strong>Device and usage data</strong> — such as app version, operating system, and
              basic logs needed to keep the service secure and reliable.
            </li>
            <li>
              <strong>Authentication tokens</strong> — stored securely on your device so you stay
              signed in.
            </li>
          </ul>

          <h2>2. How we use your information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Create and manage your account</li>
            <li>Verify your phone number using SMS OTP</li>
            <li>Recommend and display relevant job listings</li>
            <li>Let you apply for jobs and share your profile with employers when you apply</li>
            <li>Allow businesses to review applications and partners to manage candidates</li>
            <li>Send optional service notifications (for example, application updates via SMS or WhatsApp where enabled)</li>
            <li>Improve, secure, and troubleshoot our platform</li>
            <li>Comply with applicable law</li>
          </ul>

          <h2>3. How we share your information</h2>
          <p>We do not sell your personal information. We may share information only as follows:</p>
          <ul>
            <li>
              <strong>With employers</strong> — when you apply to a job, we share relevant profile
              and contact details with that employer so they can review your application.
            </li>
            <li>
              <strong>With placement partners</strong> — if you were registered or referred by a
              partner, limited profile information may be visible to that partner as part of the
              placement process.
            </li>
            <li>
              <strong>With service providers</strong> — who help us operate the platform, such as:
              <ul>
                <li>SMS/OTP providers (for example, Twilio) to send verification codes</li>
                <li>Cloud hosting and database providers to store data securely</li>
              </ul>
              These providers may only use your data to perform services for us.
            </li>
            <li>
              <strong>For legal reasons</strong> — if required by law, court order, or to protect
              the rights, safety, and security of users and Rojgaar.
            </li>
          </ul>

          <h2>4. Data storage and security</h2>
          <p>
            Your data is stored on secure servers. We use industry-standard measures such as
            encrypted connections (HTTPS), access controls, and secure authentication tokens.
            No method of transmission or storage is 100% secure; we work to protect your information
            but cannot guarantee absolute security.
          </p>

          <h2>5. Data retention</h2>
          <p>
            We keep your information for as long as your account is active or as needed to provide
            services, comply with legal obligations, resolve disputes, and enforce our agreements.
            You may request deletion of your account and associated data by contacting us.
          </p>

          <h2>6. Your choices and rights</h2>
          <ul>
            <li>
              <strong>Location</strong> — you can enable or disable location permissions in your
              device settings at any time.
            </li>
            <li>
              <strong>Profile</strong> — you can update your profile in the app at any time.
            </li>
            <li>
              <strong>Account deletion</strong> — email us to request deletion of your account and
              personal data, subject to legal retention requirements.
            </li>
            <li>
              <strong>Marketing</strong> — we do not send unsolicited marketing SMS without your
              consent.
            </li>
          </ul>
          <p>
            Depending on your location, you may have additional rights under applicable data
            protection laws (such as access, correction, or portability). Contact us to exercise
            these rights.
          </p>

          <h2>7. Children&apos;s privacy</h2>
          <p>
            Rojgaar is intended for users who are at least 18 years old and eligible to work.
            We do not knowingly collect personal information from children under 18. If you believe
            a child has provided us personal information, please contact us and we will take steps
            to delete it.
          </p>

          <h2>8. Third-party links</h2>
          <p>
            Our website or app may contain links to third-party sites or services. We are not
            responsible for their privacy practices. Please review their policies before providing
            personal information.
          </p>

          <h2>9. International users</h2>
          <p>
            Rojgaar is operated from India and primarily serves users in India. If you access our
            services from other regions, your information may be processed in India or where our
            service providers operate.
          </p>

          <h2>10. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version on
            this page and change the effective date above. Continued use of our services after
            changes means you accept the updated policy.
          </p>

          <h2>11. Contact us</h2>
          <p>
            If you have questions about this Privacy Policy or how we handle your data, contact us:
          </p>
          <p className="legal__contact">
            <Mail size={18} aria-hidden />
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            <strong>Rojgaar</strong>
            <br />
            India
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
