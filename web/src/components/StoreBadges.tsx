import './StoreBadges.css'

type StoreBadgeTheme = 'dark' | 'light'

interface StoreBadgesProps {
  theme?: StoreBadgeTheme
  className?: string
  playStoreUrl?: string
  appStoreUrl?: string
}

function GooglePlayBadge({ theme }: { theme: StoreBadgeTheme }) {
  const isLight = theme === 'light'
  const bg = isLight ? '#fff' : '#000'
  const text = isLight ? '#000' : '#fff'
  const subtext = isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)'

  return (
    <svg
      className="store-badge store-badge--play"
      viewBox="0 0 155 46"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="155" height="46" rx="6" fill={bg} />
      <g transform="translate(10, 8)">
        <path
          d="M2.5 2.2 16.8 14.5 2.5 26.8V2.2z"
          fill="#00D0FF"
        />
        <path
          d="M2.5 2.2 16.8 14.5 10.5 14.5 2.5 8.5V2.2z"
          fill="#00F076"
        />
        <path
          d="M2.5 26.8 10.5 20.5 16.8 14.5 2.5 26.8z"
          fill="#FF3A44"
        />
        <path
          d="M16.8 14.5 10.5 14.5 2.5 8.5 10.5 14.5 16.8 14.5z"
          fill="#FFB900"
        />
      </g>
      <text
        x="42"
        y="17"
        fill={subtext}
        fontSize="7"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="500"
        letterSpacing="0.04em"
      >
        GET IT ON
      </text>
      <text
        x="42"
        y="32"
        fill={text}
        fontSize="14"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        letterSpacing="-0.02em"
      >
        Google Play
      </text>
    </svg>
  )
}

function AppStoreBadge({ theme }: { theme: StoreBadgeTheme }) {
  const isLight = theme === 'light'
  const bg = isLight ? '#fff' : '#000'
  const text = isLight ? '#000' : '#fff'
  const subtext = isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)'

  return (
    <svg
      className="store-badge store-badge--apple"
      viewBox="0 0 155 46"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="155" height="46" rx="6" fill={bg} />
      <path
        fill={text}
        transform="translate(11, 7) scale(0.88)"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
      <text
        x="42"
        y="17"
        fill={subtext}
        fontSize="7"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="500"
        letterSpacing="0.02em"
      >
        Download on the
      </text>
      <text
        x="42"
        y="32"
        fill={text}
        fontSize="14"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        letterSpacing="-0.02em"
      >
        App Store
      </text>
    </svg>
  )
}

export default function StoreBadges({
  theme = 'dark',
  className = '',
  playStoreUrl = '#download',
  appStoreUrl = '#download',
}: StoreBadgesProps) {
  return (
    <div className={`store-badges store-badges--${theme} ${className}`.trim()}>
      <a
        href={playStoreUrl}
        className="store-badges__link"
        aria-label="Get it on Google Play"
      >
        <GooglePlayBadge theme={theme} />
      </a>
      <a
        href={appStoreUrl}
        className="store-badges__link"
        aria-label="Download on the App Store"
      >
        <AppStoreBadge theme={theme} />
      </a>
    </div>
  )
}
