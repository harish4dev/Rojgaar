import type { LucideIcon } from 'lucide-react'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'
import './PortalLayout.css'

export interface NavItem {
  key: string
  label: string
  icon: LucideIcon
}

interface PortalLayoutProps {
  title: string
  userName: string
  userRole: string
  nav: NavItem[]
  activeKey: string
  onNavSelect: (key: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export function StatCard({
  icon: Icon,
  value,
  label,
  color = 'var(--primary)',
}: {
  icon: LucideIcon
  value: string
  label: string
  color?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ backgroundColor: `${color}22`, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  )
}

export default function PortalLayout({
  title,
  userName,
  userRole,
  nav,
  activeKey,
  onNavSelect,
  onLogout,
  children,
}: PortalLayoutProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  return (
    <div className="portal">
      <aside className="portal__sidebar">
        <Logo variant="dark" linkTo="/" size="sm" />
        <p className="portal__section">{title}</p>

        <nav className="portal__nav">
          {nav.map((item) => {
            const Icon = item.icon
            const active = activeKey === item.key
            return (
              <button
                key={item.key}
                type="button"
                className={`portal__nav-item${active ? ' portal__nav-item--active' : ''}`}
                onClick={() => onNavSelect(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="portal__user">
          <div className="portal__avatar">
            <User size={16} />
          </div>
          <div className="portal__user-info">
            <div className="portal__user-name">{userName}</div>
            <div className="portal__user-role">{userRole}</div>
          </div>
          <button type="button" className="portal__logout" onClick={handleLogout} aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="portal__main">
        <div className="portal__content">{children}</div>
      </main>
    </div>
  )
}
