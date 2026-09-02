import { useState, useRef } from 'react'
import { Sparkles, Download, RefreshCw, Wand2, Check, Lightbulb, Image as ImageIcon, Globe, Smartphone, CreditCard, Layout, Moon, Sun } from 'lucide-react'
import ModelSelector from '../shared/ModelSelector'
import { useGenerateLogoVariationsMutation } from '../../services/apiSlice'

const INDUSTRIES = [
  { value: 'tech', label: 'Technology & Software' },
  { value: 'food', label: 'Food & Restaurant' },
  { value: 'health', label: 'Healthcare & Medical' },
  { value: 'fashion', label: 'Fashion & Beauty' },
  { value: 'finance', label: 'Finance & Business' },
  { value: 'education', label: 'Education & Training' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'fitness', label: 'Fitness & Wellness' },
]

const STYLES = [
  { value: 'modern', label: 'Modern', desc: 'Clean, contemporary, geometric' },
  { value: 'classic', label: 'Classic', desc: 'Timeless, elegant, traditional' },
  { value: 'playful', label: 'Playful', desc: 'Fun, energetic, creative' },
  { value: 'bold', label: 'Bold', desc: 'Strong, impactful, high-contrast' },
  { value: 'minimal', label: 'Minimal', desc: 'Simple, refined, essential' },
  { value: 'luxury', label: 'Luxury', desc: 'Premium, high-end, sophisticated' },
]

const COLOR_PALETTES = [
  { name: 'Ocean Blue', primary: '#0C81F3', secondary: '#67A7FF' },
  { name: 'Sunset Coral', primary: '#EA580C', secondary: '#FB923C' },
  { name: 'Forest Green', primary: '#16A34A', secondary: '#22C55E' },
  { name: 'Royal Purple', primary: '#7C3AED', secondary: '#8B5CF6' },
  { name: 'Rose Pink', primary: '#DB2777', secondary: '#EC4899' },
  { name: 'Midnight', primary: '#1E293B', secondary: '#334155' },
]

const LOADING_STEPS = [
  { label: 'Analyzing brand personality' },
  { label: 'Synthesizing geometric symbols' },
  { label: 'Selecting typography & color balance' },
  { label: 'Rendering vector SVG paths' },
  { label: 'Polishing contrast & scaling' },
]

function LogoSVG({ svg, className = '' }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    />
  )
}

function LogoVariationCard({ variation, isSelected, onSelect, onDownload }) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer group rounded-2xl border-2 transition-all overflow-hidden ${
        isSelected
          ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg bg-white'
      }`}
    >
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center min-h-[200px]">
        <LogoSVG svg={variation.svg} className="w-full max-w-[280px]" />
      </div>

      <div className="bg-white p-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
            {variation.style} style
          </span>
          {variation.colorPalette && (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {variation.colorPalette}
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Check size={14} color="white" strokeWidth={3} />
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDownload(variation)
        }}
        className="absolute bottom-3 right-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Download SVG"
      >
        <Download size={14} className="text-slate-600" />
      </button>
    </div>
  )
}

function LoadingState() {
  const [step, setStep] = useState(0)

  useState(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-lg mx-auto">
      <div className="relative w-16 h-16 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Wand2 size={20} className="text-blue-500" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">AI is crafting your vector logos</h3>
      <p className="text-sm text-slate-500 mb-8">Generating unique geometric marks and colorways</p>

      <div className="space-y-3 text-left">
        {LOADING_STEPS.map((s, i) => {
          const status = i < step ? 'done' : i === step ? 'active' : 'pending'
          return (
            <div key={i} className="flex items-center gap-3">
              {status === 'done' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
              )}
              {status === 'active' && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {status === 'pending' && (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  status === 'active'
                    ? 'font-medium text-slate-900'
                    : status === 'done'
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LogoMakerPage() {
  const [generateLogoVariations, { isLoading: isGenerating }] = useGenerateLogoVariationsMutation()
  const [brandName, setBrandName] = useState('')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('tech')
  const [style, setStyle] = useState('modern')
  const [preferredProvider, setPreferredProvider] = useState('openrouter')
  const [selectedPalette, setSelectedPalette] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [variations, setVariations] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [mockupView, setMockupView] = useState('web') // 'web' | 'card' | 'avatar'

  const handleGenerate = async (e) => {
    e?.preventDefault?.()
    setValidationError('')
    setErrorMessage('')

    if (!brandName.trim()) {
      setValidationError('Please enter your brand name.')
      return
    }

    if (brandName.trim().length < 2) {
      setValidationError('Brand name must be at least 2 characters.')
      return
    }

    setVariations(null)

    try {
      const data = await generateLogoVariations({
        brandName: brandName.trim(),
        description: description.trim(),
        industry,
        style,
        count: 4,
        preferredProvider,
      }).unwrap()

      setVariations(data.variations)
      setSelectedIndex(0)
      setTimeout(() => {
        document.getElementById('logo-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setErrorMessage(err?.data?.error || err.message || 'Failed to generate logos. Please try again.')
    }
  }

  const handleDownload = (variation) => {
    const blob = new Blob([variation.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-${variation.style}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = () => {
    if (!variations) return
    variations.forEach((v, i) => {
      setTimeout(() => handleDownload(v), i * 200)
    })
  }

  const handleStartOver = () => {
    setVariations(null)
    setSelectedIndex(0)
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRegenerateWithColors = async () => {
    if (!brandName.trim()) return

    try {
      const data = await generateLogoVariations({
        brandName: brandName.trim(),
        description: description.trim(),
        industry,
        style,
        count: 4,
        preferredProvider,
      }).unwrap()

      setVariations(data.variations)
      setSelectedIndex(0)
    } catch (err) {
      setErrorMessage(err?.data?.error || err.message || 'Failed to regenerate logos')
    }
  }

  const selectedVariation = variations?.[selectedIndex]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            AI Vector Brand Identity & Scalable SVG Engine
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI Vector Logo </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Generator</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate clean, scalable vector SVG logos with custom color palettes and real-world website and business card mockups.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Input Form */}
        {!variations && !isGenerating && (
          <form onSubmit={handleGenerate} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Brand or Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. NexusAI, Bloom Studio, Horizon SaaS"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium text-base"
                maxLength={40}
                required
              />
              <p className="text-xs text-slate-400 mt-1">{brandName.length}/40 characters</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Brand Description & Mission <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Modern AI marketing platform helping agencies scale content and backlinks."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm resize-y"
                maxLength={300}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Industry Vertical</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Design Aesthetic</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <ModelSelector
                value={preferredProvider}
                onChange={setPreferredProvider}
                compact={true}
              />

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-bold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate 4 Vector Logos</span>
              </button>
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {validationError}
              </div>
            )}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {errorMessage}
              </div>
            )}
          </form>
        )}

        {isGenerating && <LoadingState />}

        {/* Results */}
        {variations && !isGenerating && (
          <div id="logo-results" className="space-y-8 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Generated Vector Logos</h3>
                <p className="text-xs text-slate-500">4 scalable SVG variations for <strong className="text-slate-800">{brandName}</strong></p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New Brand</span>
                </button>
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All (SVG)</span>
                </button>
              </div>
            </div>

            {/* Selected Main Display */}
            {selectedVariation && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-12 flex items-center justify-center min-h-[300px]">
                  <LogoSVG svg={selectedVariation.svg} className="w-full max-w-[480px]" />
                </div>

                <div className="p-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Selected Logo</span>
                    <h4 className="font-bold text-slate-900 text-lg capitalize">{selectedVariation.style} Style</h4>
                  </div>

                  <button
                    onClick={() => handleDownload(selectedVariation)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download SVG Vector</span>
                  </button>
                </div>
              </div>
            )}

            {/* Real-World Mockup Simulator */}
            {selectedVariation && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Real-World Brand Mockup Preview</h4>
                    <p className="text-xs text-slate-500">Test how your logo renders across real digital and physical touchpoints.</p>
                  </div>

                  <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                    <button
                      onClick={() => setMockupView('web')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        mockupView === 'web' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website Header</span>
                    </button>
                    <button
                      onClick={() => setMockupView('card')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        mockupView === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Business Card</span>
                    </button>
                    <button
                      onClick={() => setMockupView('avatar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        mockupView === 'avatar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>App Icon</span>
                    </button>
                  </div>
                </div>

                {/* Mockup Render Area */}
                {mockupView === 'web' && (
                  <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-900 text-white">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
                      <div className="w-48 max-h-12 overflow-hidden flex items-center">
                        <LogoSVG svg={selectedVariation.svg} className="w-full scale-75 origin-left" />
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-xs text-slate-300 font-medium">
                        <span>Products</span>
                        <span>Solutions</span>
                        <span>Pricing</span>
                        <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">Get Started</span>
                      </div>
                    </div>
                    <div className="p-12 text-center text-slate-400 text-xs">
                      Live simulated SaaS navigation bar with dark contrast theme.
                    </div>
                  </div>
                )}

                {mockupView === 'card' && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-900 text-white p-8 rounded-2xl aspect-16/10 flex flex-col justify-between shadow-md">
                      <div className="w-40">
                        <LogoSVG svg={selectedVariation.svg} className="w-full scale-90 origin-left" />
                      </div>
                      <div className="text-[10px] text-slate-400">Premium Matte Card • Front View</div>
                    </div>

                    <div className="bg-white text-slate-900 p-8 rounded-2xl aspect-16/10 flex flex-col justify-between border border-slate-200 shadow-md">
                      <div className="text-right text-xs font-bold text-slate-800">Alex Morgan<br/><span className="text-[10px] text-slate-400 font-normal">Founder & CEO</span></div>
                      <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                        <div>hello@{brandName.toLowerCase().replace(/\s+/g, '')}.com</div>
                        <div>www.{brandName.toLowerCase().replace(/\s+/g, '')}.com</div>
                      </div>
                    </div>
                  </div>
                )}

                {mockupView === 'avatar' && (
                  <div className="p-8 bg-slate-100 rounded-2xl flex items-center justify-center gap-8">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                      <LogoSVG svg={selectedVariation.svg} className="w-full scale-110" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-white p-1.5 shadow-md flex items-center justify-center overflow-hidden">
                      <LogoSVG svg={selectedVariation.svg} className="w-full scale-90" />
                    </div>
                    <div className="text-xs text-slate-600">
                      Favicon and mobile app launcher icons.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Variations Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm">All Variations — Click to Choose</h4>
                <button
                  onClick={handleRegenerateWithColors}
                  disabled={isGenerating}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate New Styles</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {variations.map((v, i) => (
                  <LogoVariationCard
                    key={i}
                    variation={v}
                    isSelected={selectedIndex === i}
                    onSelect={() => setSelectedIndex(i)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
