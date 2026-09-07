import React from 'react'
import { Smartphone, Monitor, ShieldCheck, ExternalLink } from 'lucide-react'

/**
 * Official Google PageSpeed Insights Rating & Color Thresholds
 * 90-100: Good (#0CCE6B / Green)
 * 50-89: Needs Improvement (#FFA400 / Orange)
 * 0-49: Poor (#FF4E42 / Red)
 */
export function getPageSpeedRating(score) {
  const num = Math.round(Number(score) || 0)
  if (num >= 90) {
    return {
      status: 'good',
      label: 'Good',
      color: '#0CCE6B',
      strokeColor: '#0CCE6B',
      textColor: 'text-[#0CCE6B]',
      bgTint: 'bg-emerald-50/70',
      borderTint: 'border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      shape: 'circle',
      symbol: '●',
    }
  }
  if (num >= 50) {
    return {
      status: 'average',
      label: 'Needs Improvement',
      color: '#FFA400',
      strokeColor: '#FFA400',
      textColor: 'text-[#FFA400]',
      bgTint: 'bg-amber-50/70',
      borderTint: 'border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      shape: 'square',
      symbol: '■',
    }
  }
  return {
    status: 'poor',
    label: 'Poor',
    color: '#FF4E42',
    strokeColor: '#FF4E42',
    textColor: 'text-[#FF4E42]',
    bgTint: 'bg-rose-50/70',
    borderTint: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    shape: 'triangle',
    symbol: '▲',
  }
}

/**
 * Shape indicator component matching Google PageSpeed Insights
 */
export function PageSpeedShape({ shape, className = 'w-2.5 h-2.5' }) {
  if (shape === 'triangle') {
    return (
      <svg className={`${className} text-[#FF4E42] inline-block shrink-0`} viewBox="0 0 10 10" fill="currentColor">
        <polygon points="5,1 1,9 9,9" />
      </svg>
    )
  }
  if (shape === 'square') {
    return (
      <svg className={`${className} text-[#FFA400] inline-block shrink-0`} viewBox="0 0 10 10" fill="currentColor">
        <rect x="1" y="1" width="8" height="8" rx="1.5" />
      </svg>
    )
  }
  return (
    <svg className={`${className} text-[#0CCE6B] inline-block shrink-0`} viewBox="0 0 10 10" fill="currentColor">
      <circle cx="5" cy="5" r="4" />
    </svg>
  )
}

/**
 * Official Google PageSpeed Score Range Legend
 */
export function PageSpeedLegend({ className = '' }) {
  return (
    <div className={`flex items-center gap-3.5 text-[11px] font-bold text-gray-600 flex-wrap ${className}`}>
      <span className="flex items-center gap-1.5 text-rose-600">
        <PageSpeedShape shape="triangle" />
        <span>0–49 Poor</span>
      </span>
      <span className="flex items-center gap-1.5 text-amber-600">
        <PageSpeedShape shape="square" />
        <span>50–89 Needs Improvement</span>
      </span>
      <span className="flex items-center gap-1.5 text-emerald-600">
        <PageSpeedShape shape="circle" />
        <span>90–100 Good</span>
      </span>
    </div>
  )
}

/**
 * Evaluates Core Web Vitals metric values against official Google thresholds
 */
export function getCwvMetricRating(metricKey, rawValue) {
  const key = (metricKey || '').toLowerCase()
  const valStr = String(rawValue || '')
  
  // Parse numeric part
  const num = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0
  const isMs = valStr.includes('ms')
  const isSec = valStr.includes('s') && !isMs

  let status = 'good'
  let benchmark = ''
  let label = 'Good'

  if (key.includes('lcp')) {
    // Largest Contentful Paint: Good <= 2.5s, Avg <= 4.0s, Poor > 4.0s
    benchmark = 'Good: ≤ 2.5s'
    const seconds = isMs ? num / 1000 : num
    if (seconds <= 2.5) status = 'good'
    else if (seconds <= 4.0) { status = 'average'; label = 'Needs Improvement' }
    else { status = 'poor'; label = 'Poor' }
  } else if (key.includes('fcp')) {
    // First Contentful Paint: Good <= 1.8s, Avg <= 3.0s, Poor > 3.0s
    benchmark = 'Good: ≤ 1.8s'
    const seconds = isMs ? num / 1000 : num
    if (seconds <= 1.8) status = 'good'
    else if (seconds <= 3.0) { status = 'average'; label = 'Needs Improvement' }
    else { status = 'poor'; label = 'Poor' }
  } else if (key.includes('cls')) {
    // Cumulative Layout Shift: Good <= 0.1, Avg <= 0.25, Poor > 0.25
    benchmark = 'Good: ≤ 0.1'
    if (num <= 0.1) status = 'good'
    else if (num <= 0.25) { status = 'average'; label = 'Needs Improvement' }
    else { status = 'poor'; label = 'Poor' }
  } else if (key.includes('tbt') || key.includes('fid')) {
    // Total Blocking Time: Good <= 200ms, Avg <= 600ms, Poor > 600ms
    benchmark = 'Good: ≤ 200ms'
    const ms = isSec ? num * 1000 : num
    if (ms <= 200) status = 'good'
    else if (ms <= 600) { status = 'average'; label = 'Needs Improvement' }
    else { status = 'poor'; label = 'Poor' }
  } else if (key.includes('speedindex') || key.includes('speed_index')) {
    // Speed Index: Good <= 3.4s, Avg <= 5.8s, Poor > 5.8s
    benchmark = 'Good: ≤ 3.4s'
    const seconds = isMs ? num / 1000 : num
    if (seconds <= 3.4) status = 'good'
    else if (seconds <= 5.8) { status = 'average'; label = 'Needs Improvement' }
    else { status = 'poor'; label = 'Poor' }
  } else if (key.includes('ttfb')) {
    // Time to First Byte: Good <= 800ms, Avg <= 1800ms, Poor > 1800ms
    benchmark = 'Good: ≤ 800ms'
    const ms = isSec ? num * 1000 : num
    if (ms <= 800) status = 'good'
    else if (ms <= 1800) { status = 'average'; label = 'Needs Improvement' }
    else { status = 'poor'; label = 'Poor' }
  } else {
    // Default fallback
    benchmark = 'Optimal'
    status = 'good'
  }

  const shape = status === 'good' ? 'circle' : status === 'average' ? 'square' : 'triangle'
  const color = status === 'good' ? '#0CCE6B' : status === 'average' ? '#FFA400' : '#FF4E42'
  const badgeClass =
    status === 'good'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'average'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200'

  return { status, label, benchmark, shape, color, badgeClass }
}

/**
 * Circular Radial PageSpeed Gauge Component matching Google PageSpeed Insights
 */
export default function PageSpeedGauge({
  score = 0,
  label = 'Performance',
  device = 'overall', // 'overall' | 'mobile' | 'desktop'
  size = 114,
  strokeWidth = 9,
  showLabel = true,
  showDeviceIcon = true,
  showRatingBadge = true,
  interactive = false,
  active = false,
  onClick = null,
  className = '',
}) {
  const numericScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)))
  const rating = getPageSpeedRating(numericScore)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - numericScore / 100)

  const isCompact = size <= 96
  const scoreFontSize = size >= 120 ? 'text-3xl sm:text-4xl' : size >= 96 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'

  const renderIcon = () => {
    if (device === 'mobile') {
      return <Smartphone className="w-3.5 h-3.5 text-gray-500" />
    }
    if (device === 'desktop') {
      return <Monitor className="w-3.5 h-3.5 text-gray-500" />
    }
    return <ShieldCheck className="w-3.5 h-3.5 text-[#0C81F3]" />
  }

  const content = (
    <div
      className={`relative flex flex-col items-center ${isCompact ? 'p-1.5' : 'p-3'} rounded-2xl transition-all ${
        interactive
          ? 'cursor-pointer hover:bg-gray-50/80 hover:shadow-md hover:-translate-y-0.5'
          : ''
      } ${
        active
          ? 'ring-2 ring-[#0C81F3] bg-blue-50/30'
          : 'bg-white border border-gray-100 shadow-xs'
      } ${className}`}
      onClick={onClick}
    >
      {/* Device & Label Header */}
      {showLabel && (
        <div className="flex items-center gap-1.5 mb-1.5">
          {showDeviceIcon && renderIcon()}
          <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
            {label}
          </span>
        </div>
      )}

      {/* Circular SVG Radial Meter */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform"
        >
          {/* Subtle Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EEF2F6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Colored Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={rating.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Centered Score Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={`${scoreFontSize} font-black tracking-tight`}
            style={{ color: rating.color }}
          >
            {numericScore}
          </span>
          {!isCompact && (
            <span className="text-[10px] font-bold text-gray-400 -mt-1">/100</span>
          )}
        </div>
      </div>

      {/* Official PageSpeed Rating Badge with Shape Indicator */}
      {showRatingBadge && (
        <div className={isCompact ? 'mt-1.5' : 'mt-2.5'}>
          <span
            className={`inline-flex items-center gap-1.5 ${
              isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
            } rounded-full font-bold border ${rating.badgeBg}`}
          >
            <PageSpeedShape shape={rating.shape} className={isCompact ? 'w-1.5 h-1.5' : 'w-2 h-2'} />
            <span>{rating.label}</span>
          </span>
        </div>
      )}
    </div>
  )

  return content
}
