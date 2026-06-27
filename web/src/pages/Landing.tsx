import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Download,
  HardHat,
  Languages,
  MapPin,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import Logo from '@/components/Logo'
import StoreBadges from '@/components/StoreBadges'
import rojgaarLogo from '@/assets/brand'
import './Landing.css'

const JOB_PREVIEWS = [
  { title: 'Mason', company: 'Sharma Construction', pay: '₹18,000 – 25,000/mo', tag: 'Full time' },
  { title: 'Electrician', company: 'PowerTech Services', pay: '₹20,000 – 25,000/mo', tag: 'On-site' },
  { title: 'Delivery Driver', company: 'QuickRoute Logistics', pay: '₹12,000 – 18,000/mo', tag: 'Daily wage' },
]

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden>
        <div className="landing__bg-orb landing__bg-orb--1" />
        <div className="landing__bg-orb landing__bg-orb--2" />
        <div className="landing__bg-grid" />
      </div>

      <header className="landing__header">
        <Logo variant="light" linkTo="/" size="md" />
        <nav className="landing__nav" aria-label="Main">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#download">Download</a>
        </nav>
        <Link to="/portal" className="landing__portal-btn">
          Business & Partner
          <ArrowRight size={16} />
        </Link>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <div className="landing__badge">
            <Sparkles size={14} />
            India&apos;s blue-collar job platform
          </div>
          <h1>
            Find trusted jobs
            <span className="landing__highlight"> near you</span>
          </h1>
          <p className="landing__lead">
            Rojgaar connects masons, electricians, drivers, helpers, and skilled workers with
            local employers. Browse roles, apply in one tap, and track every application from your
            phone.
          </p>

          <ul className="landing__trust">
            <li>
              <CheckCircle2 size={18} />
              Free for workers
            </li>
            <li>
              <Languages size={18} />
              English, Hindi & Kannada
            </li>
            <li>
              <MapPin size={18} />
              Jobs in your city
            </li>
          </ul>

          <div className="landing__cta" id="download">
            <p className="landing__cta-label">
              <Download size={18} />
              Get the worker app
            </p>
            <StoreBadges theme="dark" />
            <p className="landing__cta-note">Coming soon on stores — join the pilot via your partner or employer.</p>
          </div>
        </div>

        <div className="landing__hero-visual">
          <div className="landing__brand-showcase">
            <div className="landing__brand-glow" aria-hidden />
            <img src={rojgaarLogo} alt="Rojgaar" className="landing__brand-img" />
          </div>

          <div className="landing__phone-mock">
            <div className="landing__phone-frame">
              <div className="landing__phone-notch" />
              <div className="landing__phone-screen">
                <div className="landing__phone-top">
                  <Logo variant="light" size="sm" linkTo={undefined} />
                  <span className="landing__phone-greeting">Jobs near you</span>
                </div>
                {JOB_PREVIEWS.map((job, i) => (
                  <article
                    key={job.title}
                    className={`landing__job-card${i > 0 ? ' landing__job-card--dim' : ''}`}
                  >
                    <div className="landing__job-card-top">
                      <strong>{job.title}</strong>
                      <span className="landing__job-tag">{job.tag}</span>
                    </div>
                    <p className="landing__job-company">{job.company}</p>
                    <p className="landing__job-meta">
                      <MapPin size={12} />
                      Bengaluru · {job.pay}
                    </p>
                  </article>
                ))}
                <div className="landing__phone-cta">Apply now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__stats" aria-label="Platform highlights">
        <div className="landing__stat">
          <strong>11+</strong>
          <span>Job categories</span>
        </div>
        <div className="landing__stat">
          <strong>3</strong>
          <span>Languages</span>
        </div>
        <div className="landing__stat">
          <strong>1 tap</strong>
          <span>Apply from app</span>
        </div>
        <div className="landing__stat">
          <strong>100%</strong>
          <span>Free for workers</span>
        </div>
      </section>

      <section className="landing__features" id="features">
        <div className="landing__section-head">
          <span className="landing__section-label">Who it&apos;s for</span>
          <h2>Built for everyone in the hiring chain</h2>
          <p>Workers, employers, and placement partners on one platform.</p>
        </div>
        <div className="landing__feature-grid">
          <article className="landing__feature-card">
            <div className="landing__feature-icon">
              <HardHat size={22} />
            </div>
            <h3>Workers</h3>
            <p>
              Build your profile with skills and salary expectations. Browse nearby jobs, save
              favourites, and apply instantly from the mobile app.
            </p>
            <a href="#download" className="landing__feature-link">
              Download app <ArrowRight size={14} />
            </a>
          </article>
          <article className="landing__feature-card landing__feature-card--accent">
            <div className="landing__feature-icon landing__feature-icon--blue">
              <Building2 size={22} />
            </div>
            <h3>Businesses</h3>
            <p>
              Post openings, review applicants, and hire faster. Manage active jobs and
              applications from your web dashboard.
            </p>
            <Link to="/business/login" className="landing__feature-link">
              Business login <ArrowRight size={14} />
            </Link>
          </article>
          <article className="landing__feature-card">
            <div className="landing__feature-icon landing__feature-icon--green">
              <Users size={22} />
            </div>
            <h3>Partners</h3>
            <p>
              Onboard candidates with OTP verification, track matches and placements, and grow your
              agent network with clear earnings visibility.
            </p>
            <Link to="/partner/login" className="landing__feature-link">
              Partner login <ArrowRight size={14} />
            </Link>
          </article>
        </div>
      </section>

      <section className="landing__how" id="how">
        <div className="landing__section-head landing__section-head--light">
          <span className="landing__section-label">Simple steps</span>
          <h2>How it works for workers</h2>
        </div>
        <ol className="landing__steps">
          <li>
            <span className="landing__step-num">1</span>
            <div className="landing__step-icon">
              <Zap size={20} />
            </div>
            <div>
              <strong>Sign up with your phone</strong>
              <span>Verify OTP and complete a quick profile in your language.</span>
            </div>
          </li>
          <li>
            <span className="landing__step-num">2</span>
            <div className="landing__step-icon">
              <Briefcase size={20} />
            </div>
            <div>
              <strong>Browse local jobs</strong>
              <span>Filter by city, industry, salary, and job type that fits you.</span>
            </div>
          </li>
          <li>
            <span className="landing__step-num">3</span>
            <div className="landing__step-icon">
              <Shield size={20} />
            </div>
            <div>
              <strong>Apply and get hired</strong>
              <span>Track applications and connect with employers directly.</span>
            </div>
          </li>
        </ol>
      </section>

      <section className="landing__download-banner">
        <div className="landing__download-inner">
          <img src={rojgaarLogo} alt="" className="landing__download-logo" aria-hidden />
          <h2>Ready to find your next job?</h2>
          <p>Download Rojgaar and start browsing roles in minutes.</p>
          <StoreBadges theme="light" className="landing__store-badges--center" />
          <p className="landing__portal-link">
            Hiring or placing workers?{' '}
            <Link to="/portal">Sign in to your dashboard →</Link>
          </p>
        </div>
      </section>

      <footer className="landing__footer">
        <Logo variant="light" linkTo="/" size="sm" />
        <nav className="landing__footer-nav" aria-label="Footer">
          <a href="#features">Features</a>
          <Link to="/portal">Portals</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <a href="#download">Download</a>
        </nav>
        <p>© {new Date().getFullYear()} Rojgaar. Find jobs near you.</p>
      </footer>
    </div>
  )
}
