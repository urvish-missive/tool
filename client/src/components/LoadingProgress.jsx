const STEPS = [
  { label: 'Reading content', key: 'reading' },
  { label: 'Checking content structure', key: 'structure' },
  { label: 'Analyzing SEO optimization', key: 'seo' },
  { label: 'Evaluating search intent', key: 'intent' },
  { label: 'Generating recommendations', key: 'recs' },
  { label: 'Preparing report', key: 'report' },
]

export default function LoadingProgress({ currentStep }) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 max-w-lg mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Analyzing your content...</h3>
      <ul className="space-y-3">
        {STEPS.map((step, i) => {
          const status = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending'
          return (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              {status === 'done' && (
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {status === 'active' && (
                <svg className="w-5 h-5 text-blue-500 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {status === 'pending' && (
                <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
              )}
              <span className={
                status === 'done' ? 'text-gray-500 line-through' :
                status === 'active' ? 'text-gray-900 font-medium' :
                'text-gray-400'
              }>
                {step.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
