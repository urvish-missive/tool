import { useState, useRef } from 'react'
import { Sparkles, Download, RefreshCw, Wand2, Check, Lightbulb, Image as ImageIcon } from 'lucide-react'

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
  { value: 'modern', label: 'Modern', desc: 'Clean, contemporary, professional' },
  { value: 'classic', label: 'Classic', desc: 'Timeless, elegant, traditional' },
  { value: 'playful', label: 'Playful', desc: 'Fun, energetic, creative' },
  { value: 'bold', label: 'Bold', desc: 'Strong, impactful, confident' },
  { value: 'minimal', label: 'Minimal', desc: 'Simple, refined, sophisticated' },
  { value: 'luxury', label: 'Luxury', desc: 'Premium, high-end, exclusive' },
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
  { label: 'Analyzing brand context' },
  { label: 'Selecting color palette' },
  { label: 'Designing typography' },
  { label: 'Building composition' },
  { label: 'Refining details' },
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

function BackgroundPreview({ svg, className = '' }) {
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
          ? 'border-blue-500 shadow-xl'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center min-h-[200px]">
        <LogoSVG svg={variation.svg} className="w-full max-w-[300px]" />
      </div>

      <div className="bg-white p-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-gray-700 tracking-wide">
            {variation.style} style
          </span>
          {variation.colorPalette && (
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
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
        className="absolute bottom-3 right-3 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Download SVG"
      >
        <Download size={14} className="text-gray-600" />
      </button>
    </div>
  )
}

function LoadingState() {
  const [step, setStep] = useState(0)

  // Animate through steps
  useState(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-lg mx-auto">
      <div className="relative w-16 h-16 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Wand2 size={20} className="text-blue-500" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">AI is designing your logos</h3>
      <p className="text-sm text-gray-500 mb-8">Creating unique, professional variations</p>

      <div className="space-y-3 text-left">
        {LOADING_STEPS.map((s, i) => {
          const status = i < step ? 'done' : i === step ? 'active' : 'pending'
          return (
            <div key={i} className="flex items-center gap-3">
              {status === 'done' && (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
              )}
              {status === 'active' && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {status === 'pending' && (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  status === 'active'
                    ? 'font-medium text-gray-900'
                    : status === 'done'
                    ? 'text-green-700'
                    : 'text-gray-400'
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
  const [brandName, setBrandName] = useState('')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('tech')
  const [style, setStyle] = useState('modern')
  const [selectedPalette, setSelectedPalette] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [variations, setVariations] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

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

    setIsGenerating(true)
    setVariations(null)

    try {
      const response = await fetch('/api/logo/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          description: description.trim(),
          industry,
          style,
          count: 4,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate logos')
      }

      setVariations(data.variations)
      setSelectedIndex(0)
      setTimeout(() => {
        document.getElementById('logo-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate logos. Please try again.')
    } finally {
      setIsGenerating(false)
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

    setIsRegenerating(true)
    try {
      const response = await fetch('/api/logo/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          description: description.trim(),
          industry,
          style,
          count: 4,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate logos')
      }

      setVariations(data.variations)
      setSelectedIndex(0)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to regenerate logos. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const selectedVariation = variations?.[selectedIndex]

  return (
    <div>
      {/* Hero */}
      <section className="relative !pt-36 overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">
            <Sparkles size={12} />
            AI-Powered
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">AI Logo </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Generator</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Enter your brand name and description. Our AI creates 4 unique, professional logos tailored to your industry and style — instantly.
          </p>
        </div>
      </section>

      {/* Form / Loading / Results */}
      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Form */}
          {!variations && !isGenerating && (
            <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. NovaTech, Bloom & Co, Velocity"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  maxLength={40}
                />
                <p className="text-xs text-gray-400 mt-1">{brandName.length}/40 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A modern SaaS platform for small businesses. We help teams collaborate better."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                  maxLength={300}
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/300 characters</p>
              </div>

              {/* Industry + Style */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {INDUSTRIES.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label} — {s.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {validationError}
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Generate 4 AI Logos
              </button>

              <p className="text-xs text-center text-gray-400">
                Free, no credit card required. Logos are saved as SVG (scalable vector).
              </p>
            </form>
          )}

          {/* Loading */}
          {isGenerating && <LoadingState />}

          {/* Results */}
          {variations && !isGenerating && (
            <div id="logo-results" className="space-y-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your AI Logos</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    4 unique designs for <span className="font-semibold">{brandName}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    New Brand
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download size={14} />
                    Download All
                  </button>
                </div>
              </div>

              {/* Main Selected Logo */}
              {selectedVariation && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 flex items-center justify-center min-h-[280px]">
                    <LogoSVG svg={selectedVariation.svg} className="w-full max-w-[500px]" />
                  </div>
                  <div className="p-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Style</div>
                        <div className="text-sm font-bold text-gray-900 capitalize">{selectedVariation.style}</div>
                      </div>
                      {selectedVariation.colorPalette && (
                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Palette</div>
                          <div className="text-sm font-bold text-gray-900">{selectedVariation.colorPalette}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Format</div>
                        <div className="text-sm font-bold text-gray-900">SVG Vector</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(selectedVariation)}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-sm font-semibold rounded-xl hover:from-[#0D73D1] hover:to-[#E77771] transition-all shadow-md flex items-center gap-2"
                    >
                      <Download size={14} />
                      Download SVG
                    </button>
                  </div>
                </div>
              )}

              {/* Background previews */}
              {selectedVariation && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <ImageIcon size={14} />
                    Preview on Different Backgrounds
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'White', bg: '#ffffff', textColor: '#000' },
                      { name: 'Dark', bg: '#111827', textColor: '#fff' },
                      { name: 'Brand', bg: 'linear-gradient(135deg, #0C81F3, #EB8988)', textColor: '#fff' },
                    ].map(({ name, bg, textColor }) => (
                      <div
                        key={name}
                        className="rounded-xl overflow-hidden flex items-center justify-center min-h-[120px] border border-gray-200"
                        style={{ background: bg }}
                      >
                        <div className="p-4" style={{ width: '100%', maxWidth: 180 }}>
                          {/* Extract just the logo part from SVG without background */}
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedVariation.svg.replace(
                                /<rect[^>]*fill="[^"]*#(?:[a-fA-F0-9]{3,6})[^"]*"[^>]*\/>/g,
                                (match) => {
                                  // Keep only the background rect, remove others
                                  if (match.includes('width="100%"') || match.includes('width="350"') || match.includes('width="400"') || match.includes('width="420"')) {
                                    return match // Keep the background rect
                                  }
                                  return '' // Remove other rects
                                }
                              ),
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Palette Switcher */}
              {selectedVariation && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-bold text-gray-700">Try Different Color Themes</h3>
                    <span className="text-xs text-gray-400">— Click a palette to apply to the selected style</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {COLOR_PALETTES.map((palette, i) => (
                      <button
                        key={palette.name}
                        onClick={async () => {
                          setSelectedPalette(i)
                          // Regenerate just the selected variation with new colors
                          try {
                            const response = await fetch('/api/logo/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                brandName: brandName.trim(),
                                description: description.trim(),
                                industry,
                                style: selectedVariation.style,
                                primaryColor: palette.primary,
                                secondaryColor: palette.secondary,
                              }),
                            })
                            const data = await response.json()
                            if (response.ok) {
                              const newVariations = [...variations]
                              newVariations[selectedIndex] = {
                                ...newVariations[selectedIndex],
                                svg: data.svg,
                                colorPalette: palette.name,
                                primaryColor: palette.primary,
                                secondaryColor: palette.secondary,
                              }
                              setVariations(newVariations)
                            }
                          } catch (err) {
                            console.error('Color change failed:', err)
                          }
                        }}
                        className={`p-2 rounded-xl transition-all hover:scale-105 ${
                          selectedPalette === i
                            ? 'ring-2 ring-blue-500 shadow-md'
                            : 'hover:shadow-md'
                        }`}
                        title={palette.name}
                      >
                        <div
                          className="w-full h-10 rounded-lg mb-1.5"
                          style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
                        />
                        <div className="text-[10px] text-center font-semibold text-gray-700 truncate">
                          {palette.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Variations Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">All Variations — Click to Select</h3>
                  <button
                    onClick={handleRegenerateWithColors}
                    disabled={isRegenerating}
                    className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isRegenerating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        Regenerate New Designs
                      </>
                    )}
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

              {/* Tips */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Lightbulb size={16} className="text-amber-500" />
                  Tips for Using Your Logo
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    SVG files scale infinitely without losing quality — perfect for any size
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    Test on light and dark backgrounds before finalizing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    Use the bold variation for maximum visibility and impact
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    Combine with a tagline for complete brand identity
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm">
                    Need More?
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Want a Fully Custom Logo?</h3>
                  <p className="mt-3 text-white/80 max-w-lg mx-auto">
                    Our professional designers can create a custom logo with full brand guidelines, variations, and source files.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
