import { Link } from 'react-router-dom'
import rojgaarLogo from '@/assets/brand'
import './Logo.css'

interface LogoProps {
  variant?: 'light' | 'dark'
  linkTo?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Set true only if you want extra text beside the image (logo PNG already includes ROJGAAR). */
  showWordmark?: boolean
}

export default function Logo({
  variant = 'light',
  linkTo = '/',
  size = 'md',
  showWordmark = false,
}: LogoProps) {
  const content = (
    <span className={`logo logo--${variant} logo--${size}`}>
      <img src={rojgaarLogo} alt="Rojgaar" className="logo__img" />
      {showWordmark && (
        <span className="logo__text">
          R<span className="logo__accent">O</span>JGAAR
        </span>
      )}
    </span>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="logo__link" aria-label="Rojgaar home">
        {content}
      </Link>
    )
  }

  return content
}
