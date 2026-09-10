import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessCompetitorSchema } from '../../schemas/businessCompetitor.schema'
import { useAnalyzeBusinessCompetitorMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import {
  Building2,
  Globe,
  Zap,
  TrendingUp,
  Target,
  BarChart3,
  Megaphone,
  DollarSign,
  Shield,
  Users,
  ChevronRight,
  MapPin,
  Calendar,
  Briefcase,
  ArrowUpRight,
  Lightbulb,
  AlertTriangle,
  Star,
  Package,
  Share2,
  Newspaper,
  GitBranch,
  Trophy,
  TrendingDown,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'history', label: 'History & M&A', icon: Calendar },
  { id: 'products', label: 'Products & Services', icon: Package },
  { id: 'market', label: 'Market Position', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing Strategy', icon: Megaphone },
  { id: 'sales', label: 'Sales Strategy', icon: DollarSign },
]

export default function BusinessCompetitorPage() {
  const [analyze, { isLoading }] = useAnalyzeBusinessCompetitorMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [pendingResult, setPendingResult] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(businessCompetitorSchema),
    defaultValues: {
      competitorUrl: '',
      companyName: '',
      industry: '',
    },
  })

  const onSubmit = async (data) => {
    setError('')
    setResults(null)
    try {
      const result = await analyze({
        competitorUrl: data.competitorUrl.trim(),
        companyName: data.companyName?.trim() || undefined,
        industry: data.industry?.trim() || undefined,
      }).unwrap()
      setResults(result)
      setTimeout(() => {
        document
          .getElementById('biz-results')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(
        err?.data?.error || 'Failed to analyze competitor. Please check the URL and try again.'
      )
    }
  }

  const handleReset = () => {
    setResults(null)
    setError('')
    setActiveTab('overview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLeadSubmit = async (leadData) => {
    try {
      await analyze({
        competitorUrl: results.competitorUrl,
        companyName: results.companyName,
        industry: results.industry,
        ...leadData,
      }).unwrap()
    } catch {}
    setShowLeadForm(false)
  }

  const r = results
  const profile = r?.companyProfile || {}
  const history = r?.businessHistory || {}
  const products = r?.productsServices || {}
  const market = r?.marketPosition || {}
  const marketing = r?.marketingStrategy || {}
  const sales = r?.salesStrategy || {}

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Business Intelligence Engine
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Competitor </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Business Intelligence
            </span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Deep-dive into any competitor. Business history, mergers & acquisitions, product lines,
            market position, marketing & sales strategies.
          </p>
        </div>
      </section>

      {/* Main Form */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!isLoading && !results && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Competitor URL */}
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Competitor Website URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('competitorUrl')}
                      type="text"
                      placeholder="https://competitor.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm transition-all"
                    />
                    <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.competitorUrl && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">
                      {errors.competitorUrl.message}
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Company Name{' '}
                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('companyName')}
                      type="text"
                      placeholder="e.g. Acme Corp"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm transition-all"
                    />
                    <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Industry / Sector{' '}
                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('industry')}
                      type="text"
                      placeholder="e.g. SaaS, Healthcare, Finance"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm transition-all"
                    />
                    <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  Analyze Competitor
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                  {error}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <UnifiedToolLoader
            title="Analyzing Competitor Business..."
            subtitle="Crawling website, extracting business signals, and generating AI-powered intelligence report."
            steps={[
              'Fetching website HTML & structured data',
              'Extracting contact info, products & social profiles',
              'Analyzing business history & market position',
              'Generating marketing & sales strategy intelligence',
              'Building comprehensive business intelligence report',
            ]}
          />
        )}

        {/* Results */}
        {r && !isLoading && (
          <div id="biz-results" className="space-y-6 animate-fade-in">
            {/* Executive Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0C81F3] to-[#EB8988] flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg">
                  {profile.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {profile.name || r.companyName}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                      {profile.companyType || profile.industry || r.industry || 'Company'}
                    </span>
                  </div>
                  {profile.tagline && (
                    <p className="text-sm text-gray-500 italic">"{profile.tagline}"</p>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer shrink-0 text-center"
                >
                  ← New Analysis
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {r.executiveSummary}
              </p>
              {/* Quick Profile Badges */}{' '}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
                {profile.founded && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    <Calendar className="w-3 h-3" /> Founded {profile.founded}
                  </span>
                )}
                {profile.headquarters && profile.headquarters !== 'Unknown' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    <MapPin className="w-3 h-3" /> {profile.headquarters}
                  </span>
                )}
                {profile.employeeCount && profile.employeeCount !== 'Unknown' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    <Users className="w-3 h-3" /> {profile.employeeCount} employees
                  </span>
                )}
                {profile.industry && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                    <Briefcase className="w-3 h-3" /> {profile.industry}
                  </span>
                )}
                {r.signals?.socialLinks?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    <Share2 className="w-3 h-3" /> {r.signals.socialLinks.length} social profiles
                  </span>
                )}
                {r.signals?.techStack?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">
                    <Globe className="w-3 h-3" /> {r.signals.techStack.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Tab Navigation — responsive scroll on mobile */}
            <div className="border-b border-gray-200">
              <div
                className="flex gap-0.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        activeTab === tab.id
                          ? 'border-[#0C81F3] text-[#0C81F3]'
                          : 'border-transparent text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* ═══ OVERVIEW TAB ═══ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-700 mb-3">
                        <TrendingUp className="w-4 h-4" /> Strengths
                      </h3>
                      <ul className="space-y-2">
                        {(r.strengths || []).map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <Star className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                        {(!r.strengths || r.strengths.length === 0) && (
                          <li className="text-sm text-gray-400 italic">No strengths identified</li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-rose-600 mb-3">
                        <TrendingDown className="w-4 h-4" /> Weaknesses
                      </h3>
                      <ul className="space-y-2">
                        {(r.weaknesses || []).map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))}
                        {(!r.weaknesses || r.weaknesses.length === 0) && (
                          <li className="text-sm text-gray-400 italic">No weaknesses identified</li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-3">
                        <Lightbulb className="w-4 h-4" /> Opportunities for You
                      </h3>
                      <ul className="space-y-2">
                        {(r.opportunities || []).map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <Target className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            <span>{o}</span>
                          </li>
                        ))}
                        {(!r.opportunities || r.opportunities.length === 0) && (
                          <li className="text-sm text-gray-400 italic">
                            No opportunities identified
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Similar Businesses */}
                  {r.similarBusinesses?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <Trophy className="w-4 h-4 text-amber-500" /> Similar Businesses /
                        Competitors
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {r.similarBusinesses.map((biz, i) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900">{biz.name}</span>
                              {biz.website && (
                                <a
                                  href={biz.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${
                                biz.relationship === 'Direct competitor'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : biz.relationship === 'Adjacent'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {biz.relationship}
                            </span>
                            {biz.differentiation && (
                              <p className="text-xs text-gray-600 mt-1">{biz.differentiation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Profiles */}
                  {r.signals?.socialLinks?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <Share2 className="w-4 h-4 text-purple-500" /> Social Presence
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {r.signals.socialLinks.map((link, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                          >
                            {link.platform}: <span className="font-semibold">{link.handle}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ HISTORY & M&A TAB ═══ */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Founding Story */}
                  {history.foundingStory && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 text-blue-500" /> Founding Story
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {history.foundingStory}
                      </p>
                    </div>
                  )}

                  {/* Key Milestones */}
                  {history.keyMilestones?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <GitBranch className="w-4 h-4 text-purple-500" /> Key Milestones
                      </h3>
                      <div className="relative pl-5 sm:pl-6 border-l-2 border-blue-200 space-y-3 sm:space-y-4">
                        {history.keyMilestones.map((m, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[25px] w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {m.year}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{m.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent News */}
                  {history.recentNews?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <Newspaper className="w-4 h-4 text-amber-500" /> Recent News & Updates
                      </h3>
                      <div className="space-y-3">
                        {history.recentNews.map((n, i) => (
                          <div
                            key={i}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{n.headline}</p>
                                <p className="text-xs text-gray-500 mt-1">{n.date}</p>
                              </div>
                            </div>
                            {n.significance && (
                              <p className="text-xs text-gray-600 mt-2 bg-white rounded-lg p-2 border border-slate-100 flex items-start gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span>{n.significance}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* M&A Activity */}
                  {r.mergersAcquisitions?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <GitBranch className="w-4 h-4 text-rose-500" /> Mergers & Acquisitions
                      </h3>
                      <div className="space-y-3">
                        {r.mergersAcquisitions.map((deal, i) => (
                          <div
                            key={i}
                            className="p-4 bg-rose-50/50 rounded-xl border border-rose-100"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                                {deal.year}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{deal.deal}</p>
                            {deal.impact && (
                              <p className="text-xs text-gray-600 mt-1">{deal.impact}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!history.foundingStory &&
                    (!history.keyMilestones || history.keyMilestones.length === 0) &&
                    (!history.recentNews || history.recentNews.length === 0) &&
                    (!r.mergersAcquisitions || r.mergersAcquisitions.length === 0) && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No historical data available. Try adding the company name for more
                          accurate results.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* ═══ PRODUCTS & SERVICES TAB ═══ */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {products.overview && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <Package className="w-4 h-4 text-blue-500" /> Products & Services Overview
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{products.overview}</p>
                    </div>
                  )}

                  {products.categories?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {products.categories.map((cat, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                        >
                          <h4 className="text-sm font-bold text-gray-900 mb-2">{cat.name}</h4>
                          {cat.items?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {cat.items.map((item, j) => (
                                <span
                                  key={j}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="space-y-1.5 text-xs text-gray-600">
                            {cat.pricing && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>Pricing: {cat.pricing}</span>
                              </div>
                            )}
                            {cat.targetMarket && (
                              <div className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>Target: {cat.targetMarket}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products detected from signals */}
                  {r.signals?.products?.length > 0 &&
                    (!products.categories || products.categories.length === 0) && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                          <Package className="w-4 h-4 text-blue-500" /> Detected Products / Services
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {r.signals.products.map((p, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {!products.overview &&
                    (!products.categories || products.categories.length === 0) && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No product/service information could be extracted.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* ═══ MARKET POSITION TAB ═══ */}
              {activeTab === 'market' && (
                <div className="space-y-6">
                  {/* Market Position Grid */}{' '}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {market.marketCap &&
                      market.marketCap !==
                        'Private company - revenue data not publicly available' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
                          <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 mb-1">Market Cap / Revenue</p>
                          <p className="text-sm font-bold text-gray-900">{market.marketCap}</p>
                        </div>
                      )}
                    {market.marketShare && market.marketShare !== 'Unknown' && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
                        <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Market Share</p>
                        <p className="text-sm font-bold text-gray-900">{market.marketShare}</p>
                      </div>
                    )}
                    {market.competitiveAdvantage && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
                        <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Competitive Moat</p>
                        <p className="text-sm font-bold text-gray-900">
                          {market.competitiveAdvantage}
                        </p>
                      </div>
                    )}
                    {market.positioning &&
                      market.positioning !== 'Unknown' &&
                      market.positioning !== 'Not determined' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
                          <Target className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 mb-1">Positioning</p>
                          <p className="text-sm font-bold text-gray-900">{market.positioning}</p>
                        </div>
                      )}
                  </div>
                  {/* Full Market Details */}
                  {(market.marketCap ||
                    market.marketShare ||
                    market.competitiveAdvantage ||
                    market.positioning) && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <BarChart3 className="w-4 h-4 text-blue-500" /> Market Positioning Details
                      </h3>
                      <div className="space-y-3">
                        {market.marketCap && (
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Revenue / Market Cap
                            </p>
                            <p className="text-sm text-gray-800">{market.marketCap}</p>
                          </div>
                        )}
                        {market.marketShare && (
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Market Share
                            </p>
                            <p className="text-sm text-gray-800">{market.marketShare}</p>
                          </div>
                        )}
                        {market.competitiveAdvantage && (
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Competitive Advantage
                            </p>
                            <p className="text-sm text-gray-800">{market.competitiveAdvantage}</p>
                          </div>
                        )}
                        {market.positioning && (
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Positioning Statement
                            </p>
                            <p className="text-sm text-gray-800">{market.positioning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ MARKETING STRATEGY TAB ═══ */}
              {activeTab === 'marketing' && (
                <div className="space-y-6">
                  {/* Marketing Channels */}
                  {marketing.channels?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <Megaphone className="w-4 h-4 text-purple-500" /> Marketing Channels
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {marketing.channels.map((ch, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-100"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategy Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {marketing.contentStrategy && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Newspaper className="w-4 h-4 text-blue-500" /> Content Strategy
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {marketing.contentStrategy}
                        </p>
                      </div>
                    )}
                    {marketing.brandVoice && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Users className="w-4 h-4 text-amber-500" /> Brand Voice
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {marketing.brandVoice}
                        </p>
                      </div>
                    )}
                    {marketing.leadGeneration && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Target className="w-4 h-4 text-emerald-500" /> Lead Generation
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {marketing.leadGeneration}
                        </p>
                      </div>
                    )}
                    {marketing.socialPresence && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Share2 className="w-4 h-4 text-pink-500" /> Social Presence
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {marketing.socialPresence}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notable Campaigns */}
                  {marketing.notableCampaigns?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <Star className="w-4 h-4 text-amber-500" /> Notable Campaigns
                      </h3>
                      <ul className="space-y-2">
                        {marketing.notableCampaigns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SALES STRATEGY TAB ═══ */}
              {activeTab === 'sales' && (
                <div className="space-y-6">
                  {/* Sales Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {sales.model && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                        <DollarSign className="w-7 h-7 text-blue-500 mx-auto mb-1.5" />
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">
                          Sales Model
                        </p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">{sales.model}</p>
                      </div>
                    )}
                    {sales.pricingStrategy && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                        <BarChart3 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Pricing</p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                          {sales.pricingStrategy}
                        </p>
                      </div>
                    )}
                    {sales.salesCycle && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                        <Calendar className="w-7 h-7 text-purple-500 mx-auto mb-1.5" />
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">
                          Sales Cycle
                        </p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">{sales.salesCycle}</p>
                      </div>
                    )}
                    {sales.targetBuyer && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                        <Users className="w-7 h-7 text-amber-500 mx-auto mb-1.5" />
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">
                          Target Buyer
                        </p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                          {sales.targetBuyer}
                        </p>
                      </div>
                    )}
                    {sales.competitivePositioning && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                        <Shield className="w-7 h-7 text-rose-500 mx-auto mb-1.5" />
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">
                          vs Competitors
                        </p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                          {sales.competitivePositioning}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Objections */}
                  {sales.objections?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Common Buyer Objections
                      </h3>
                      <ul className="space-y-2">
                        {sales.objections.map((obj, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100"
                          >
                            <span className="text-amber-500 font-bold shrink-0">#{i + 1}</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lead Form Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Get the Full Report</h3>
                <p className="text-sm text-gray-500">
                  Enter your details to receive the complete business intelligence report via email.
                </p>
              </div>
              <DynamicLeadForm
                source="business-competitor-analytics"
                analysisData={r}
                onSuccess={() => setShowLeadForm(false)}
                compact
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
