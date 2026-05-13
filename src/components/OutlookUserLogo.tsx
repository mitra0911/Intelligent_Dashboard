import { useId } from 'react'

/**
 * Outlook-inspired user avatar for the header (demo / mock enterprise identity).
 * Swap for an approved asset from your brand kit when needed.
 */
export function OutlookUserLogo({ className = '' }: { className?: string }) {
  const gid = useId().replace(/:/g, '')

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`oug-${gid}`} x1="8" y1="6" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0364B8" />
          <stop offset="0.45" stopColor="#1490DF" />
          <stop offset="1" stopColor="#28A8EA" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill={`url(#oug-${gid})`} />
      <path
        fill="white"
        fillOpacity={0.95}
        d="M12 18h24v16a2 2 0 01-2 2H14a2 2 0 01-2-2V18z"
      />
      <path fill="#C7E4F9" d="M12 18l12 9 12-9v2L24 29 12 20v-2z" />
      <path
        fill="none"
        stroke="white"
        strokeOpacity={0.9}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18l12 8 12-8"
      />
    </svg>
  )
}
