/** Same thresholds and colours as client/src/utils/scoreHelpers.js and ScoreRing.jsx. */

export function scoreTextClass(val: number): string {
  if (val >= 80) return 'text-emerald-600'
  if (val >= 60) return 'text-amber-600'
  if (val >= 40) return 'text-orange-500'
  return 'text-rose-600'
}

export function scoreBarClass(val: number): string {
  if (val >= 80) return 'bg-emerald-500'
  if (val >= 60) return 'bg-amber-500'
  if (val >= 40) return 'bg-orange-500'
  return 'bg-rose-500'
}

export function scoreRingColors(val: number): { stroke: string; track: string } {
  if (val >= 80) return { stroke: '#16a34a', track: '#dcfce7' }
  if (val >= 60) return { stroke: '#ca8a04', track: '#fef9c3' }
  if (val >= 40) return { stroke: '#ea580c', track: '#ffedd5' }
  return { stroke: '#dc2626', track: '#fecaca' }
}

export function clampScore(val: unknown): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? val : 0
  return Math.round(Math.min(100, Math.max(0, n)))
}
