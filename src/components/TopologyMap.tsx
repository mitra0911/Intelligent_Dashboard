import { useState } from 'react'
import type { BusinessService, MicroserviceEdge, MicroserviceNode, TopologyTelemetrySeverity } from '../types'
import { effectiveTelemetrySeverity, telemetrySeverityLabel } from '../lib/topologyStatus'

interface TopologyMapProps {
  nodes: MicroserviceNode[]
  edges: MicroserviceEdge[]
  highlightIds?: Set<string>
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  className?: string
  businessServices?: BusinessService[]
  showTooltips?: boolean
}

const VIEW_W = 104
/** Extra vertical room for mesh spread + labels under bottom nodes. */
const VIEW_H = 100

/** Bubble radius — filled disc + outer accent ring. */
const NODE_R = 3.85

/** Filled bubble + lighter concentric ring (purple / red / yellow family by severity). */
function bubbleStyle(s: TopologyTelemetrySeverity): { fill: string; ring: string } {
  switch (s) {
    case 'ok':
      return { fill: '#166534', ring: '#86efac' }
    case 'warning':
      return { fill: '#a16207', ring: '#fde047' }
    case 'error':
      return { fill: '#c2410c', ring: '#fdba74' }
    case 'critical':
      return { fill: '#991b1b', ring: '#fca5a5' }
    default:
      return { fill: '#475569', ring: '#94a3b8' }
  }
}

function trimSegment(ax: number, ay: number, bx: number, by: number, r: number) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return { x1: ax + ux * r, y1: ay + uy * r, x2: bx - ux * r, y2: by - uy * r }
}

/** Inner number: max SLO burn across mapped business services (compact). */
function nodeInnerMetric(node: MicroserviceNode, services: BusinessService[] | undefined): string {
  if (!services?.length || !node.businessServiceIds.length) return '—'
  let maxB = 0
  let found = false
  for (const id of node.businessServiceIds) {
    const s = services.find((x) => x.id === id)
    if (s) {
      found = true
      maxB = Math.max(maxB, s.sloBurnPct)
    }
  }
  if (!found) return '—'
  if (maxB >= 10) return `${Math.round(maxB)}x`
  if (maxB >= 1) return `${maxB.toFixed(1)}x`
  return `${maxB.toFixed(2)}x`
}

/** Link color = **target (`to`)** node severity so lines *toward* a green bubble are green. Blast radius stays teal. */
function edgeMeshStyle(targetSeverity: TopologyTelemetrySeverity, highlighted: boolean): {
  stroke: string
  width: number
  opacity: number
} {
  if (highlighted) {
    return { stroke: '#2dd4bf', width: 0.8, opacity: 0.95 }
  }
  switch (targetSeverity) {
    case 'critical':
      return { stroke: '#dc2626', width: 0.72, opacity: 0.92 }
    case 'error':
      return { stroke: '#f97316', width: 0.66, opacity: 0.9 }
    case 'warning':
      return { stroke: '#eab308', width: 0.58, opacity: 0.88 }
    default:
      return { stroke: '#22c55e', width: 0.52, opacity: 0.86 }
  }
}

function telemetryBadgeText(s: TopologyTelemetrySeverity): string | null {
  if (s === 'warning') return 'WARN'
  if (s === 'error') return 'ERR'
  if (s === 'critical') return 'SEV'
  return null
}

function mappingIdsLine(node: MicroserviceNode): string {
  if (!node.businessServiceIds.length) return ''
  return node.businessServiceIds.join(' · ')
}

function tooltipLines(node: MicroserviceNode, services: BusinessService[] | undefined) {
  const effective = effectiveTelemetrySeverity(node, services)
  const ids = node.businessServiceIds.length ? node.businessServiceIds.join(', ') : '—'
  const names =
    services?.length && node.businessServiceIds.length
      ? node.businessServiceIds
          .map((id) => services.find((s) => s.id === id)?.name)
          .filter(Boolean)
          .join(', ')
      : '—'
  const inner = nodeInnerMetric(node, services)

  return {
    lines: [
      { k: 'Tier', v: node.tier.charAt(0).toUpperCase() + node.tier.slice(1) },
      { k: 'Bubble number', v: `Max SLO burn (mapped services): ${inner}` },
      { k: 'Command Center ids', v: ids },
      { k: 'Business services', v: names },
      {
        k: 'Live signal (fill color)',
        v: `${telemetrySeverityLabel(effective)}${node.telemetryHint ? ` — ${node.telemetryHint}` : ''}`,
      },
    ],
  }
}

export function TopologyMap({
  nodes,
  edges,
  highlightIds,
  selectedId,
  onSelect,
  className,
  businessServices,
  showTooltips = false,
}: TopologyMapProps) {
  const [tip, setTip] = useState<{
    x: number
    y: number
    node: MicroserviceNode
  } | null>(null)

  const vectorEffect = 'nonScalingStroke' as const

  const graph = (
    <g>
      {/* Soft vignette only — mesh reference avoids rigid tier bands */}
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="6" fill="#0c1219" fillOpacity={0.14} />

      {edges.map((e, i) => {
        const a = nodes.find((n) => n.id === e.from)
        const b = nodes.find((n) => n.id === e.to)
        if (!a || !b) return null
        const hi = highlightIds?.has(e.from) || highlightIds?.has(e.to)
        const targetSev = effectiveTelemetrySeverity(b, businessServices)
        const { stroke, width: strokeW, opacity } = edgeMeshStyle(targetSev, Boolean(hi))
        const { x1, y1, x2, y2 } = trimSegment(a.x, a.y, b.x, b.y, NODE_R)
        return (
          <g
            key={`${e.from}-${e.to}-${i}`}
            className="topology-edge-blink"
            style={{
              animationDelay: `${(i * 0.42) % 2.4}s`,
              pointerEvents: 'none',
            }}
          >
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={strokeW}
              strokeOpacity={opacity}
              strokeLinecap="round"
              vectorEffect={vectorEffect}
            />
          </g>
        )
      })}

      {nodes.map((n) => {
        const hi = highlightIds?.has(n.id)
        const sel = selectedId === n.id
        const effective = effectiveTelemetrySeverity(n, businessServices)
        const { fill, ring } = bubbleStyle(effective)
        const metric = nodeInnerMetric(n, businessServices)
        const badge = telemetryBadgeText(effective)
        const mapLine = mappingIdsLine(n)
        const hitW = Math.max(20, n.label.length * 1.25 + mapLine.length * 0.55)

        const isErr = effective === 'error'
        const isCrit = effective === 'critical'

        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            className={onSelect || showTooltips ? 'cursor-pointer' : ''}
            onClick={(ev) => {
              ev.stopPropagation()
              onSelect?.(sel ? null : n.id)
            }}
            onKeyDown={(ev) => {
              if (!onSelect) return
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                onSelect(sel ? null : n.id)
              }
            }}
            onPointerEnter={
              showTooltips
                ? (ev) => {
                    setTip({ x: ev.clientX, y: ev.clientY, node: n })
                  }
                : undefined
            }
            onPointerMove={
              showTooltips
                ? (ev) => {
                    setTip((prev) =>
                      prev?.node.id === n.id
                        ? { x: ev.clientX, y: ev.clientY, node: n }
                        : prev,
                    )
                  }
                : undefined
            }
            onPointerLeave={
              showTooltips
                ? () => {
                    setTip((prev) => (prev?.node.id === n.id ? null : prev))
                  }
                : undefined
            }
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
          >
            {(showTooltips || onSelect) && (
              <rect
                x={-hitW / 2}
                y={-NODE_R - 2}
                width={hitW}
                height={NODE_R * 2 + 12}
                rx="3"
                fill="transparent"
                style={{ pointerEvents: 'all' }}
              />
            )}
            {hi && (
              <circle
                r={NODE_R + 2.6}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth={0.38}
                opacity={0.88}
                style={{ pointerEvents: 'none' }}
              />
            )}
            {isCrit || isErr ? (
              <g
                className="topology-bubble-blink"
                style={{
                  animationDelay: isCrit ? '0s' : '0.35s',
                  pointerEvents: 'none',
                }}
              >
                {isCrit && (
                  <circle r={NODE_R + 1.85} fill="none" stroke="#fecaca" strokeWidth={0.35} />
                )}
                {isErr && !isCrit && (
                  <circle r={NODE_R + 1.45} fill="none" stroke="#fdba74" strokeWidth={0.32} opacity={0.9} />
                )}
                <circle
                  r={NODE_R + 0.85}
                  fill="none"
                  stroke={ring}
                  strokeWidth={sel ? 0.42 : 0.32}
                  opacity={0.92}
                />
                <circle r={NODE_R} fill={fill} stroke={ring} strokeWidth={0.22} />
              </g>
            ) : (
              <>
                <circle
                  r={NODE_R + 0.85}
                  fill="none"
                  stroke={ring}
                  strokeWidth={sel ? 0.42 : 0.32}
                  opacity={0.92}
                  style={{ pointerEvents: 'none' }}
                />
                <circle r={NODE_R} fill={fill} stroke={ring} strokeWidth={0.22} style={{ pointerEvents: 'none' }} />
              </>
            )}
            <text
              y={0.45}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="1.52"
              fontWeight={700}
              className="pointer-events-none select-none font-sans"
            >
              {metric}
            </text>
            <text
              y={NODE_R + 2.7}
              textAnchor="middle"
              fill="#e8edf4"
              fontSize="1.78"
              fontWeight={600}
              className="pointer-events-none select-none font-sans"
            >
              {n.label}
            </text>
            {mapLine && (
              <text
                y={NODE_R + 4.45}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="1.22"
                fontWeight={500}
                className="pointer-events-none select-none font-mono"
              >
                {mapLine}
              </text>
            )}
            {badge && (
              <text
                y={NODE_R + 6.05}
                textAnchor="middle"
                fill={ring}
                fontSize="1.38"
                fontWeight={700}
                className="pointer-events-none select-none font-sans"
              >
                {badge}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )

  const tipContent =
    tip &&
    (() => {
      const { lines } = tooltipLines(tip.node, businessServices)
      return (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[100] max-w-[260px] rounded-lg border border-obs-border bg-obs-elevated/98 px-3 py-2 text-left shadow-xl backdrop-blur-md"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          <div className="text-xs font-semibold text-obs-text">{tip.node.label}</div>
          <dl className="mt-2 space-y-1.5 text-[11px]">
            {lines.map((row) => (
              <div key={row.k}>
                <dt className="font-medium text-obs-muted">{row.k}</dt>
                <dd className="text-obs-text">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    })()

  return (
    <div className="relative">
      {showTooltips && tipContent}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={['w-full touch-none text-obs-muted', className].filter(Boolean).join(' ')}
        preserveAspectRatio="xMidYMid meet"
      >
        {graph}
      </svg>
    </div>
  )
}
