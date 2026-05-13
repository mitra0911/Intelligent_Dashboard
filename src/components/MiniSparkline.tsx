import type { BusinessService } from '../types'

function statusColor(s: BusinessService['status']) {
  if (s === 'healthy') return '#4ade80'
  if (s === 'degraded') return '#fbbf24'
  return '#f87171'
}

export function MiniSparkline({ service }: { service: BusinessService }) {
  const values = service.sparkline
  const w = 72
  const h = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        fill="none"
        stroke={statusColor(service.status)}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(' ')}
      />
    </svg>
  )
}
