export default function ScoreCircle({ score, size = 140, strokeWidth = 10, label }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : score >= 40 ? '#ea580c' : '#dc2626'
  const bgColor =
    score >= 80 ? '#dcfce7' : score >= 60 ? '#fef9c3' : score >= 40 ? '#ffedd5' : '#fecaca'
  const rating =
    score >= 90
      ? 'Excellent'
      : score >= 75
        ? 'Good'
        : score >= 50
          ? 'Needs Improvement'
          : 'Critical'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-gray-600">{label}</span>}
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          score >= 80
            ? 'bg-green-100 text-green-700'
            : score >= 60
              ? 'bg-yellow-100 text-yellow-700'
              : score >= 40
                ? 'bg-orange-100 text-orange-700'
                : 'bg-red-100 text-red-700'
        }`}
      >
        {rating}
      </span>
    </div>
  )
}
