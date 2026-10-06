import { CheckCircle2, Mail, ShieldAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError, linkDeviceEmail } from '../services/api'
import { setLinkedEmail } from '../services/identity'
import { WEB_APP_URL } from '../config'
import Button from './Button'

interface Props {
  usageCount?: number
  limit?: number
  defaultEmail?: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Mirrors the web app's DeviceLimitModal: link an email to request extended access. */
export default function LimitReached({ usageCount, limit, defaultEmail }: Props) {
  const [email, setEmail] = useState(defaultEmail || '')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) {
      setError('Please enter a valid email address.')
      return
    }
    setError(null)
    setState('sending')
    try {
      await linkDeviceEmail(value)
      await setLinkedEmail(value)
      setState('sent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your request. Please try again.')
      setState('idle')
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm" role="alert">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
            <ShieldAlert className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Complimentary limit reached</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {limit
                ? `You have used ${usageCount ?? limit} of ${limit} free Content QA analyses on this device.`
                : 'You have used all of your free Content QA analyses on this device.'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {state === 'sent' ? (
          <p className="flex items-start gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Thanks. The Missive team will review your request and extend your access.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-2.5" noValidate>
            <label htmlFor="limit-email" className="block text-xs font-medium text-slate-600">
              Enter your email to request extended access
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="limit-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <Button type="submit" disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Request'}
              </Button>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </form>
        )}
        <a
          href={WEB_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-medium text-brand hover:underline"
        >
          Visit Missive SEO tools →
        </a>
      </div>
    </section>
  )
}
