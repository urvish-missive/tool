import { BadgeCheck, CircleAlert } from 'lucide-react'
import type { QaReport } from '../types/analysis'
import { clampScore, scoreRingColors } from '../utils/score'

function ScoreRing({ score, size = 104, strokeWidth = 9 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const { stroke, track } = scoreRingColors(score)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-[11px] text-slate-500">/ 100</span>
      </div>
    </div>
  )
}

function Count({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className="flex-1 rounded-lg bg-slate-50 px-2 py-1.5 text-center">
      <p className={`text-base font-semibold ${className}`}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

export default function ScoreCard({ report }: { report: QaReport }) {
  const score = clampScore(report.overallQualityScore ?? report.overall ?? report.ai?.overallScore)
  const counts = report.statusCounts || {}
  const readiness = report.ai?.publicationReadiness
  const certified = Boolean(report.certified)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Content QA</p>
      <div className="mt-2 flex items-center gap-4">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Overall score</p>
          {readiness && <p className="mt-0.5 text-base font-semibold text-slate-900">{readiness}</p>}
          <p
            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              certified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {certified ? <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden />}
            {report.certificationBadge || (certified ? 'QA Certified' : 'Action Required')}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Count value={counts.pass ?? 0} label="Passed" className="text-emerald-600" />
        <Count value={counts.warning ?? 0} label="Warnings" className="text-amber-600" />
        <Count value={counts.fail ?? 0} label="Failed" className="text-rose-600" />
      </div>
      {report.ai?.summary && <p className="mt-3 text-sm leading-relaxed text-slate-600">{report.ai.summary}</p>}
    </section>
  )
}
