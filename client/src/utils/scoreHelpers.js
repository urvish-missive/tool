/**
 * Utility functions for score color formatting, badge styles, and gradients
 * across SEO intelligence tools (Content Analyzer, Content QA, etc.)
 */

export function getScoreColor(val) {
  if (val >= 80) return 'text-emerald-600'
  if (val >= 60) return 'text-amber-600'
  if (val >= 40) return 'text-orange-500'
  return 'text-rose-600'
}

export function getScoreBadge(val) {
  if (val >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (val >= 60) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (val >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-rose-100 text-rose-800 border-rose-200'
}

export function getScoreBarGradient(val) {
  if (val >= 80) return 'from-emerald-500 to-teal-400'
  if (val >= 60) return 'from-blue-500 to-indigo-400'
  if (val >= 40) return 'from-amber-500 to-orange-400'
  return 'from-rose-500 to-pink-500'
}

export function getScoreBg(score) {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200 text-emerald-800'
  if (score >= 60) return 'bg-amber-50 border-amber-200 text-amber-800'
  return 'bg-rose-50 border-rose-200 text-rose-800'
}

export function getScoreStatus(val) {
  if (val >= 80) return { label: 'Ready to Rank & Publish', icon: '✓', variant: 'success' }
  if (val >= 60) return { label: 'Minor Optimization Needed', icon: '⚡', variant: 'warning' }
  return { label: 'Critical Fixes Required', icon: '⚠️', variant: 'danger' }
}
