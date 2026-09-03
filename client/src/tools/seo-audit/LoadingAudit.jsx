const STEPS = [
  { key: 'connect', label: 'Connecting to website' },
  { key: 'technical', label: 'Checking technical SEO' },
  { key: 'structure', label: 'Analyzing page structure' },
  { key: 'content', label: 'Checking content quality' },
  { key: 'links', label: 'Analyzing links' },
  { key: 'schema', label: 'Checking structured data' },
  { key: 'report', label: 'Preparing report' },
]

export default function LoadingAudit({ currentStep = 'connect' }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center max-w-md mx-auto">
      <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Analyzing website...</h3>
      <p className="text-sm text-gray-500 mb-6">This may take 15-30 seconds</p>

      <div className="space-y-3 text-left">
        {STEPS.map((step, i) => {
          const status = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending'
          return (
            <div key={step.key} className="flex items-center gap-3">
              {status === 'done' && (
                <svg
                  className="w-5 h-5 text-green-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {status === 'active' && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {status === 'pending' && (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
              )}
              <span
                className={`text-sm ${status === 'active' ? 'font-medium text-gray-900' : status === 'done' ? 'text-green-700' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
