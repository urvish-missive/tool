import { useState } from 'react'

const MODELS = [
  {
    value: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash Lite',
    description: 'Fastest (~1-2s)',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 text-emerald-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    description: 'Google AI direct',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M9 9.563C9 9.252 9.252 9 9.563 9h.874c.311 0 .563.252.563.563v4.874a.563.563 0 01-.563.563h-.874A.563.563 0 019 14.437V9.564zM14.437 9c-.311 0-.563.252-.563.563v4.874c0 .311.252.563.563.563h.874c.311 0 .563-.252.563-.563V9.563A.563.563 0 0015.311 9h-.874z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'gemini-3.7-flash',
    label: 'Gemini 3.7 Flash',
    description: 'Google AI direct',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M9 9.563C9 9.252 9.252 9 9.563 9h.874c.311 0 .563.252.563.563v4.874a.563.563 0 01-.563.563h-.874A.563.563 0 019 14.437V9.564zM14.437 9c-.311 0-.563.252-.563.563v4.874c0 .311.252.563.563.563h.874c.311 0 .563-.252.563-.563V9.563A.563.563 0 0015.311 9h-.874z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'groq',
    label: 'Groq',
    description: 'Fast, free tier',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function ModelSelector({ value = 'gemini-3.7-flash', onChange, compact = false, label = 'AI Model' }) {
  const [open, setOpen] = useState(false)
  const normalizedValue = value === 'gemini' ? 'gemini-3.7-flash' : value
  const selected = MODELS.find((m) => m.value === normalizedValue) || MODELS[0]

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm hover:border-gray-400 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-colors text-left cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
          <span className="text-gray-500 shrink-0">{selected.icon}</span>
          <span className="font-semibold text-gray-900 truncate whitespace-nowrap">
            {selected.label}
          </span>
          {!compact && selected.description && (
            <span className="text-xs text-gray-400 truncate whitespace-nowrap shrink-0 hidden md:inline">
              ({selected.description})
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#0C81F3]' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-50 w-full min-w-[270px] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden py-1">
            {MODELS.map((model) => {
              const isSelected = normalizedValue === model.value
              return (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => {
                    onChange(model.value)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm hover:bg-blue-50/60 transition-colors cursor-pointer text-left ${
                    isSelected ? 'bg-blue-50 text-[#0C81F3]' : 'text-gray-700'
                  }`}
                >
                  <span className={`shrink-0 ${isSelected ? 'text-[#0C81F3]' : 'text-gray-400'}`}>
                    {model.icon}
                  </span>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold truncate whitespace-nowrap">{model.label}</div>
                    {model.description && (
                      <div className="text-[11px] text-gray-400 truncate whitespace-nowrap">
                        {model.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-[#0C81F3] ml-auto shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
