import { useState, useMemo } from 'react'
import {
  Zap,
  CheckCircle2,
  Circle,
  Search,
  Copy,
  Check,
  Filter,
  Flame,
  ArrowUpRight,
  TrendingUp,
  CheckCheck,
} from 'lucide-react'

const PRIORITY_BADGES = {
  HIGH: 'bg-rose-100 text-rose-800 border-rose-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
}

const IMPACT_COLORS = {
  'Very High': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  High: 'text-blue-700 bg-blue-50 border-blue-200',
  Medium: 'text-slate-700 bg-slate-100 border-slate-200',
}

export default function OutrankPlaybookTab({ playbook = [] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all') // 'all' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [effortFilter, setEffortFilter] = useState('all') // 'all' | 'Low' | 'Medium' | 'High'
  const [completedActions, setCompletedActions] = useState({})
  const [copiedKey, setCopiedKey] = useState(null)

  const toggleComplete = (idx) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const filteredPlaybook = useMemo(() => {
    return playbook.filter((item, originalIdx) => {
      // Search text match
      const matchesSearch =
        !searchQuery.trim() ||
        item.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.why?.toLowerCase().includes(searchQuery.toLowerCase())

      // Priority match
      const matchesPriority =
        priorityFilter === 'all' || item.priority?.toUpperCase() === priorityFilter.toUpperCase()

      // Effort match
      const matchesEffort =
        effortFilter === 'all' || item.effort?.toLowerCase() === effortFilter.toLowerCase()

      return matchesSearch && matchesPriority && matchesEffort
    })
  }, [playbook, searchQuery, priorityFilter, effortFilter])

  const completedCount = Object.values(completedActions).filter(Boolean).length
  const totalCount = playbook.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const copyAllActions = () => {
    const text = filteredPlaybook
      .map(
        (item, i) =>
          `${i + 1}. [${item.priority}] ${item.action}\n   Impact: ${item.impact} | Effort: ${item.effort}\n   Why: ${item.why}`
      )
      .join('\n\n')
    triggerCopy(text, 'copy-all-playbook')
  }

  return (
    <div className="space-y-6">
      {/* Header & Interactive Progress Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              10x Outrank Tactical Playbook
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Prioritized Action Plan to Overcome Competitor Authority
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Step-by-step execution items derived from competitor technical and structural gaps.
            </p>
          </div>

          <button
            type="button"
            onClick={copyAllActions}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            {copiedKey === 'copy-all-playbook' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied All ({filteredPlaybook.length})!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy All Filtered</span>
              </>
            )}
          </button>
        </div>

        {/* Action Completion Tracker */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4 text-blue-600" />
              Playbook Execution Progress
            </span>
            <span className="text-blue-700 font-extrabold">
              {completedCount} of {totalCount} completed ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playbook actions or keywords..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-semibold shrink-0">Priority:</span>
            {['all', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  priorityFilter === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>

          {/* Effort Filter */}
          <div className="sm:col-span-3 flex items-center gap-1.5 justify-end">
            <span className="text-xs text-slate-400 font-semibold shrink-0">Effort:</span>
            <select
              value={effortFilter}
              onChange={(e) => setEffortFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Effort</option>
              <option value="Low">Low Effort</option>
              <option value="Medium">Medium Effort</option>
              <option value="High">High Effort</option>
            </select>
          </div>
        </div>
      </div>

      {/* Playbook Items List */}
      <div className="space-y-4">
        {filteredPlaybook.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
            <Filter className="w-6 h-6 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No actions match current filters</h4>
            <p className="text-xs text-slate-500">Try clearing your search term or adjusting priority/effort filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setPriorityFilter('all')
                setEffortFilter('all')
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredPlaybook.map((item, idx) => {
            const isCompleted = Boolean(completedActions[idx])
            const pBadge = PRIORITY_BADGES[item.priority] || 'bg-slate-100 text-slate-800 border-slate-200'
            const impactBadge = IMPACT_COLORS[item.impact] || 'text-slate-700 bg-slate-50 border-slate-200'

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Interactive Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleComplete(idx)}
                    className="mt-1 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase border ${pBadge}`}>
                        {item.priority} Priority
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${impactBadge}`}>
                        Impact: {item.impact}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        Effort: <strong className="text-slate-700">{item.effort}</strong>
                      </span>
                    </div>

                    <h4
                      className={`text-base font-bold leading-snug transition-all ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.action}
                    </h4>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      <strong className="text-slate-900 font-semibold">Why this wins: </strong>
                      {item.why}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => triggerCopy(item.action, `action-${idx}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedKey === `action-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
