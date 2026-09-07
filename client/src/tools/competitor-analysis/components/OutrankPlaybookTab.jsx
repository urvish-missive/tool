import { useState, useMemo } from 'react'
import {
  Zap,
  CheckCircle2,
  Circle,
  Search,
  Copy,
  Check,
  Filter,
  CheckCheck,
} from 'lucide-react'

const PRIORITY_BADGES = {
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
}

const IMPACT_COLORS = {
  'Very High': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  High: 'text-blue-700 bg-blue-50 border-blue-200',
  Medium: 'text-gray-700 bg-gray-100 border-gray-200',
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
    return playbook.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.why?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPriority =
        priorityFilter === 'all' || item.priority?.toUpperCase() === priorityFilter.toUpperCase()

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
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0C81F3] text-xs font-bold uppercase tracking-wider mb-1.5">
              <Zap className="w-3.5 h-3.5" />
              10x Outrank Playbook
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Prioritized Action Plan to Outrank Competitor
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Targeted execution steps based on the competitor's technical and on-page vulnerabilities.
            </p>
          </div>

          <button
            type="button"
            onClick={copyAllActions}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer shrink-0"
          >
            {copiedKey === 'copy-all-playbook' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied ({filteredPlaybook.length})!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy All Filtered</span>
              </>
            )}
          </button>
        </div>

        {/* Action Completion Tracker */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-700 flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4 text-[#0C81F3]" />
              Playbook Progress
            </span>
            <span className="text-[#0C81F3] font-bold">
              {completedCount} of {totalCount} completed ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Filter Controls Bar (Matching Content QA Checklist style) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Priority Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
              Priority:
            </span>
            {[
              { id: 'all', label: `All (${playbook.length})` },
              { id: 'HIGH', label: 'High Priority' },
              { id: 'MEDIUM', label: 'Medium' },
              { id: 'LOW', label: 'Low' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPriorityFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  priorityFilter === f.id
                    ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
              />
            </div>

            {/* Effort Select */}
            <select
              value={effortFilter}
              onChange={(e) => setEffortFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-700 outline-none cursor-pointer"
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
      <div className="space-y-3">
        {filteredPlaybook.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
            <Filter className="w-5 h-5 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">No actions match current filters</h4>
            <p className="text-xs text-gray-500">Try clearing your search term or adjusting priority filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setPriorityFilter('all')
                setEffortFilter('all')
              }}
              className="text-xs font-semibold text-[#0C81F3] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredPlaybook.map((item, idx) => {
            const isCompleted = Boolean(completedActions[idx])
            const pBadge = PRIORITY_BADGES[item.priority] || 'bg-gray-100 text-gray-800 border-gray-200'
            const impactBadge = IMPACT_COLORS[item.impact] || 'text-gray-700 bg-gray-50 border-gray-200'

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs hover:border-[#0C81F3]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleComplete(idx)}
                    className="mt-0.5 shrink-0 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${pBadge}`}>
                        {item.priority} Priority
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${impactBadge}`}>
                        Impact: {item.impact}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        Effort: <strong className="text-gray-700">{item.effort}</strong>
                      </span>
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold leading-snug transition-all ${
                        isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {item.action}
                    </h4>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                      <strong className="text-gray-800 font-semibold">Why this wins: </strong>
                      {item.why}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerCopy(item.action, `action-${idx}`)}
                  className="shrink-0 self-end md:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedKey === `action-${idx}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy Task</span>
                    </>
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
