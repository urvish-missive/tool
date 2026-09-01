import { useState } from 'react'

const MODELS = [
  {
    value: 'openrouter',
    label: 'OpenRouter',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'gemini',
    label: 'Gemini',
    description: 'Google AI direct',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 9.563C9 9.252 9.252 9 9.563 9h.874c.311 0 .563.252.563.563v4.874a.563.563 0 01-.563.563h-.874A.563.563 0 019 14.437V9.564zM14.437 9c-.311 0-.563.252-.563.563v4.874c0 .311.252.563.563.563h.874c.311 0 .563-.252.563-.563V9.563A.563.563 0 0015.311 9h-.874z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'groq',
    label: 'Groq',
    description: 'Fast, free tier',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function ModelSelector({ value = 'gemini', onChange }) {
  const [open, setOpen] = useState(false)
  const selected = MODELS.find(m => m.value === value) || MODELS[0]

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-900 mb-1">AI Model</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{selected.icon}</span>
          <span className="font-medium text-gray-900">{selected.label}</span>
          {selected.description && (
            <span className="text-xs text-gray-400">({selected.description})</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
            {MODELS.map((model) => (
              <button
                key={model.value}
                type="button"
                onClick={() => { onChange(model.value); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  value === model.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className={value === model.value ? 'text-blue-500' : 'text-gray-400'}>{model.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{model.label}</div>
                  <div className="text-xs text-gray-400">{model.description}</div>
                </div>
                {value === model.value && (
                  <svg className="w-4 h-4 text-blue-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
