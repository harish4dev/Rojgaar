import { Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Logo.css'

interface LogoProps {
  variant?: 'light' | 'dark'
  linkTo?: string
  size?: 'sm' | 'md'
}

export default function Logo({ variant = 'dark', linkTo = '/', size = 'md' }: LogoProps) {
  const content = (
    <span className={`logo logo--${variant} logo--${size}`}>
      <span className="logo__icon">
        <Cpu size={size === 'sm' ? 16 : 20} strokeWidth={2.2} />
      </span>
      <span className="logo__text">
        R<span className="logo__accent">O</span>JGAAR
      </span>
    </span>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="logo__link">
        {content}
      </Link>
    )
  }

  return content
}
