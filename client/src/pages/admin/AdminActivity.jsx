import { useState } from 'react'
import { useGetAdminActivityQuery } from '../../services/apiSlice'

const TOOLS = [
  { slug: '', label: 'All Tools' },
  { slug: 'content-analyzer', label: 'Content Analyzer', icon: '📝', color: 'bg-purple-100 text-purple-700' },
  { slug: 'seo-audit', label: 'SEO Audit', icon: '🔍', color: 'bg-orange-100 text-orange-700' },
  { slug: 'keyword-research', label: 'Keyword Research', icon: '🎯', color: 'bg-yellow-100 text-yellow-700' },
  { slug: 'blog-topic-generator', label: 'Blog Topics', icon: '💡', color: 'bg-green-100 text-green-700' },
  { slug: 'logo-maker', label: 'Logo Maker', icon: '🎨', color: 'bg-blue-100 text-blue-700' },
  { slug: 'seo-roi', label: 'ROI Calculator', icon: '💰', color: 'bg-pink-100 text-pink-700' },
  { slug: 'xml-sitemap-generator', label: 'Sitemap Generator', icon: '🗺️', color: 'bg-teal-100 text-teal-700' },
]

export default function AdminActivity() {
  const [page, setPage] = useState(1)
  const [toolFilter, setToolFilter] = useState('')

  const queryParams = {
    page: String(page),
    limit: '20',
    ...(toolFilter ? { tool: toolFilter } : {}),
  }

  const { data, isLoading } = useGetAdminActivityQuery(queryParams)

  const activity = data?.activity || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 }

  const getToolConfig = (slug) => TOOLS.find(t => t.slug === slug) || { icon: '🛠️', color: 'bg-gray-100 text-gray-600', label: slug }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
        <p className="text-sm text-gray-500">View all tool usage across your platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(t => (
          <button
            key={t.slug}
            onClick={() => { setToolFilter(t.slug); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              toolFilter === t.slug
                ? 'bg-[#0C81F3] text-white border-[#0C81F3]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            {t.icon && <span className="mr-1">{t.icon}</span>}
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{pagination.total} total</span>
      </div>

      {/* Activity Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
        </div>
      ) : activity.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <span className="text-4xl block mb-3">📊</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No activity yet</h3>
          <p className="text-sm text-gray-500">Tool usage will appear here once users start using your tools.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase">Tool</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase">Detail</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase hidden md:table-cell">Info</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500 text-xs uppercase">Score</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => {
                  const tc = getToolConfig(item.tool)
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tc.color}`}>
                          <span>{tc.icon}</span>
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-gray-900 font-medium max-w-[300px] truncate block">{item.detail || '—'}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-gray-500 text-xs max-w-[250px] truncate block">{item.subdetail || '—'}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {item.score != null ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            item.score >= 70 ? 'bg-green-100 text-green-700' :
                            item.score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {item.score}/100
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs text-gray-400" title={new Date(item.createdAt).toLocaleString()}>
                          {formatTime(item.createdAt)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages} • {pagination.total} results
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum
                  if (pagination.pages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                        pageNum === page
                          ? 'bg-[#0C81F3] text-white border-[#0C81F3]'
                          : 'border-gray-200 text-gray-600 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
