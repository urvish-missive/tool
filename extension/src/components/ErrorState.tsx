import { AlertTriangle, Ban, Clock, KeyRound, ServerCrash, ShieldX, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'

export type ErrorKind =
  | 'OFFLINE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'BLOCKED'
  | 'TOOL_DISABLED'
  | 'AUTH_EXPIRED'
  | 'BAD_REQUEST'
  | 'SERVER'
  | 'RESTRICTED_PAGE'
  | 'NO_PERMISSION'
  | 'EXTRACTION_FAILED'
  | 'EMPTY_PAGE'

const META: Record<ErrorKind, { title: string; icon: typeof AlertTriangle; tone: string }> = {
  OFFLINE: { title: 'No internet connection', icon: WifiOff, tone: 'amber' },
  NETWORK: { title: 'Server unavailable', icon: ServerCrash, tone: 'rose' },
  TIMEOUT: { title: 'Analysis timed out', icon: Clock, tone: 'amber' },
  RATE_LIMIT: { title: 'Slow down a little', icon: Clock, tone: 'amber' },
  BLOCKED: { title: 'Access restricted', icon: ShieldX, tone: 'rose' },
  TOOL_DISABLED: { title: 'Content QA is paused', icon: Ban, tone: 'amber' },
  AUTH_EXPIRED: { title: 'Session expired', icon: KeyRound, tone: 'amber' },
  BAD_REQUEST: { title: 'Cannot analyze this page', icon: AlertTriangle, tone: 'amber' },
  SERVER: { title: 'Something went wrong', icon: ServerCrash, tone: 'rose' },
  RESTRICTED_PAGE: { title: 'This page can’t be analyzed', icon: Ban, tone: 'slate' },
  NO_PERMISSION: { title: 'Access needed', icon: KeyRound, tone: 'brand' },
  EXTRACTION_FAILED: { title: 'Could not read the page', icon: AlertTriangle, tone: 'amber' },
  EMPTY_PAGE: { title: 'No content found', icon: AlertTriangle, tone: 'slate' },
}

const TONES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-500',
  brand: 'bg-brand-soft text-brand',
}

interface Props {
  kind: ErrorKind
  message: string
  children?: ReactNode
}

export default function ErrorState({ kind, message, children }: Props) {
  const meta = META[kind] ?? META.SERVER
  const Icon = meta.icon
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" role="alert">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[meta.tone]}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{meta.title}</p>
          <p className="mt-0.5 text-sm text-slate-600">{message}</p>
        </div>
      </div>
      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </section>
  )
}
