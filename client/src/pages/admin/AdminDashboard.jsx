import { useGetAdminStatsQuery } from '../../services/apiSlice'

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = useGetAdminStatsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !data?.success) {
    if (error?.status === 401) {
      localStorage.clear()
      window.location.href = '/admin/login'
      return null
    }
    return <div className="text-center py-20 text-gray-500">Failed to load stats</div>
  }

  const stats = data.stats

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: '👥', color: '#0C81F3' },
    { label: 'Leads Today', value: stats.leadsToday, icon: '📈', color: '#22c55e' },
    { label: 'Total Analyses', value: stats.totalAnalyses, icon: '📝', color: '#a855f7' },
    { label: 'Total Audits', value: stats.totalAudits, icon: '🔍', color: '#f97316' },
    { label: 'Total Keywords', value: stats.totalKeywords, icon: '🎯', color: '#eab308' },
    { label: 'Total Tools Used', value: stats.totalTools, icon: '🛠️', color: '#EB8988' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tool Status</h3>
          <div className="space-y-3">
            {stats.toolConfigs?.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${tool.enabled ? 'bg-green-500' : 'bg-red-400'}`}
                  />
                  <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Limit: {tool.hourlyLimit}/hr</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tool.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                  >
                    {tool.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Leads by Source</h3>
          {!stats.leadsBySource || stats.leadsBySource.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {stats.leadsBySource.map((item) => {
                const maxCount = Math.max(...stats.leadsBySource.map((s) => s.count))
                const pct = maxCount ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={item.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">
                        {item.source.replace(/-/g, ' ')}
                      </span>
                      <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {!stats.recentActivity || stats.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {stats.recentActivity.map((item, i) => {
              const toolColors = {
                'Content Analyzer': 'bg-purple-100 text-purple-700',
                'SEO Audit': 'bg-orange-100 text-orange-700',
                'Keyword Research': 'bg-yellow-100 text-yellow-700',
                'Blog Topic Generator': 'bg-green-100 text-green-700',
                'Logo Maker': 'bg-blue-100 text-blue-700',
                'ROI Calculator': 'bg-pink-100 text-pink-700',
              }
              const toolIcons = {
                'Content Analyzer': '📝',
                'SEO Audit': '🔍',
                'Keyword Research': '🎯',
                'Blog Topic Generator': '💡',
                'Logo Maker': '🎨',
                'ROI Calculator': '💰',
              }
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-base">{toolIcons[item.tool] || '🛠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${toolColors[item.tool] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {item.tool}
                      </span>
                      {item.score != null && (
                        <span
                          className={`text-xs font-semibold ${item.score >= 70 ? 'text-green-600' : item.score >= 40 ? 'text-yellow-600' : 'text-red-500'}`}
                        >
                          {item.score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 truncate mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Recent Leads</h3>
          <a href="/admin/leads" className="text-sm text-[#0C81F3] hover:underline">
            View All →
          </a>
        </div>
        {!stats.recentLeads || stats.recentLeads.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No leads yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Source</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-900 font-medium">{lead.name}</td>
                    <td className="py-2.5 text-gray-500">{lead.email}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                        {lead.source?.replace(/-/g, ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
