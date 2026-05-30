import { Link } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  ChevronRight,
  Download,
  HardHat,
  MapPin,
  Shield,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react'
import Logo from '@/components/Logo'
import './Landing.css'

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__header">
        <Logo variant="light" linkTo="/" />
        <Link to="/portal" className="landing__portal-btn">
          Business & Partner Login
          <ChevronRight size={16} />
        </Link>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <span className="landing__badge">India&apos;s blue-collar job platform</span>
          <h1>
            Find jobs <span className="landing__highlight">near you</span>
          </h1>
          <p>
            Rojgaar connects masons, electricians, drivers, helpers, and more with local
            employers. Browse jobs, apply in one tap, and track your applications — all from
            your phone.
          </p>

          <div className="landing__cta">
            <p className="landing__cta-label">
              <Download size={18} />
              Download the app
            </p>
            <div className="landing__store-btns">
              <a href="#download" className="landing__store-btn">
                <Smartphone size={20} />
                <span>
                  <small>Get it on</small>
                  Google Play
                </span>
              </a>
              <a href="#download" className="landing__store-btn">
                <Smartphone size={20} />
                <span>
                  <small>Download on the</small>
                  App Store
                </span>
              </a>
            </div>
            <p className="landing__cta-note">
              Available in English, Hindi & Kannada. More languages coming soon.
            </p>
          </div>
        </div>

        <div className="landing__hero-visual">
          <div className="landing__phone-mock">
            <div className="landing__phone-notch" />
            <div className="landing__phone-screen">
              <div className="landing__phone-header">
                <Logo variant="light" size="sm" linkTo={undefined} />
              </div>
              <div className="landing__job-card">
                <div className="landing__job-title">Mason — Construction</div>
                <div className="landing__job-meta">
                  <MapPin size={12} /> Bengaluru · ₹18,000–25,000/mo
                </div>
              </div>
              <div className="landing__job-card landing__job-card--alt">
                <div className="landing__job-title">Electrician</div>
                <div className="landing__job-meta">
                  <MapPin size={12} /> Bengaluru · ₹15,000–22,000/mo
                </div>
              </div>
              <div className="landing__job-card landing__job-card--alt">
                <div className="landing__job-title">Delivery Driver</div>
                <div className="landing__job-meta">
                  <MapPin size={12} /> Bengaluru · ₹12,000–18,000/mo
                </div>
              </div>
              <div className="landing__phone-cta">Apply Now</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__stats">
        <div>
          <strong>11+</strong>
          <span>Job categories</span>
        </div>
        <div>
          <strong>3</strong>
          <span>Languages</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>Free for workers</span>
        </div>
      </section>

      <section className="landing__features" id="features">
        <h2>Built for everyone in the hiring chain</h2>
        <div className="landing__feature-grid">
          <article>
            <div className="landing__feature-icon">
              <HardHat size={22} />
            </div>
            <h3>Workers</h3>
            <p>
              Create your profile, set skills and salary expectations, browse nearby jobs, and
              apply instantly from the mobile app.
            </p>
          </article>
          <article>
            <div className="landing__feature-icon landing__feature-icon--blue">
              <Building2 size={22} />
            </div>
            <h3>Businesses</h3>
            <p>
              Post jobs, manage applications, and hire verified workers. Sign in from the top
              right to access your dashboard.
            </p>
          </article>
          <article>
            <div className="landing__feature-icon landing__feature-icon--green">
              <Users size={22} />
            </div>
            <h3>Partners</h3>
            <p>
              Placement agents can add candidates, track matches and placements, and monitor
              earnings from the partner portal.
            </p>
          </article>
        </div>
      </section>

      <section className="landing__how">
        <h2>How it works</h2>
        <ol>
          <li>
            <Zap size={18} />
            <div>
              <strong>Download & sign up</strong>
              <span>Enter your phone, verify OTP, and complete a quick profile.</span>
            </div>
          </li>
          <li>
            <Briefcase size={18} />
            <div>
              <strong>Browse local jobs</strong>
              <span>Filter by city, industry, salary, and job type.</span>
            </div>
          </li>
          <li>
            <Shield size={18} />
            <div>
              <strong>Apply & get hired</strong>
              <span>Track applications and connect with employers directly.</span>
            </div>
          </li>
        </ol>
      </section>

      <section className="landing__download" id="download">
        <div className="landing__download-inner">
          <h2>Ready to find your next job?</h2>
          <p>Download Rojgaar on your phone and start browsing jobs in minutes.</p>
          <div className="landing__store-btns landing__store-btns--center">
            <a href="#" className="landing__store-btn landing__store-btn--light">
              <Smartphone size={20} />
              <span>
                <small>Get it on</small>
                Google Play
              </span>
            </a>
            <a href="#" className="landing__store-btn landing__store-btn--light">
              <Smartphone size={20} />
              <span>
                <small>Download on the</small>
                App Store
              </span>
            </a>
          </div>
          <p className="landing__portal-link">
            Are you a business or partner?{' '}
            <Link to="/portal">Sign in to your dashboard →</Link>
          </p>
        </div>
      </section>

      <footer className="landing__footer">
        <Logo variant="light" linkTo="/" size="sm" />
        <p>© {new Date().getFullYear()} Rojgaar. Find jobs near you.</p>
      </footer>
    </div>
  )
}
