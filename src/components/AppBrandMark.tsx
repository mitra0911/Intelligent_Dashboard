import { ChartNoAxesCombined } from 'lucide-react'
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand'

type AppBrandMarkProps = {
  /** `header` = compact rail; `sidebar` = larger mark + two-line title */
  placement?: 'header' | 'sidebar'
  className?: string
}

/** Generic wordmark + icon — swap `brand.ts` or replace this component for custom logos. */
export function AppBrandMark({ placement = 'header', className = '' }: AppBrandMarkProps) {
  const iconWrap =
    placement === 'sidebar'
      ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-obs-border bg-obs-bg ring-1 ring-obs-teal/25'
      : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-obs-border bg-obs-bg ring-1 ring-obs-teal/20'

  const titleClass =
    placement === 'sidebar'
      ? 'text-[15px] font-bold tracking-tight text-obs-text'
      : 'truncate text-sm font-bold tracking-tight text-obs-text'

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`} role="img" aria-label={BRAND_NAME}>
      <div className={iconWrap} aria-hidden>
        <ChartNoAxesCombined className={placement === 'sidebar' ? 'h-6 w-6 text-obs-teal' : 'h-5 w-5 text-obs-teal'} />
      </div>
      <div className="min-w-0 text-left leading-tight">
        {placement === 'sidebar' ? (
          <>
            <div className={titleClass}>{BRAND_NAME}</div>
            <div className="mt-0.5 text-[11px] font-medium text-obs-muted">{BRAND_TAGLINE}</div>
          </>
        ) : (
          <div className={titleClass}>{BRAND_NAME}</div>
        )}
      </div>
    </div>
  )
}
