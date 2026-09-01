export default function ScoreCard({ score, label, icon }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : score >= 40 ? '#ea580c' : '#dc2626'
  const bgColor = score >= 80 ? '#dcfce7' : score >= 60 ? '#fef9c3' : score >= 40 ? '#ffedd5' : '#fecaca'
  const radius = 28
  const strokeWidth = 5
  const size = 66
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{score}</span>
        </div>
      </div>
      <div className="mt-2">
        {icon && <span className="text-lg block mb-0.5">{icon}</span>}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
    </div>
  )
}
