/** Shared Recharts styling — white axis & legend text on dark panels */

export const CHART_TICK = { fill: '#ffffff', fontSize: 10 }

export const CHART_AXIS_LINE = { stroke: 'rgba(255,255,255,0.4)' }

export const CHART_TICK_LINE = { stroke: 'rgba(255,255,255,0.4)' }

export const CHART_GRID_STROKE = 'rgba(255,255,255,0.18)'

export const chartTooltipProps = {
  contentStyle: {
    background: '#181d26',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 8,
    fontSize: 12,
    color: '#ffffff',
  },
  labelStyle: { color: '#ffffff' },
  itemStyle: { color: '#ffffff' },
} as const

export const chartLegendProps = {
  wrapperStyle: { fontSize: 12, color: '#ffffff' },
} as const
