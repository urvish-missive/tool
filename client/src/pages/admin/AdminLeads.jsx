import { useState } from 'react'
import { useGetAdminLeadsQuery, useDeleteAdminLeadMutation } from '../../services/apiSlice'

const SOURCES = ['', 'content-analyzer', 'seo-audit', 'keyword-research', 'blog-topics', 'logo-maker', 'seo-roi']

export default function AdminLeads() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)

  const queryParams = {
    page,
    limit: 20,
    ...(source ? { source } : {}),
    ...(submittedSearch ? { search: submittedSearch } : {}),
  }

  const { data, isLoading, refetch } = useGetAdminLeadsQuery(queryParams)
  const [deleteAdminLead] = useDeleteAdminLeadMutation()

  const leads = data?.leads || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search.trim())
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    try {
      await deleteAdminLead(id).unwrap()
      refetch()
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }

  const exportCSV = () => {
    if (leads.length === 0) return
    const headers = ['Name', 'Email', 'Company', 'Website', 'Phone', 'Source', 'Date']
    const rows = leads.map(l => [l.name, l.email, l.company || '', l.website || '', l.phone || '', l.source || '', new Date(l.createdAt).toLocaleDateString()])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
          <p className="text-sm text-gray-500">{pagination.total} total leads</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company..."
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none"
          />
          <button type="submit" className="px-4 py-2.5 bg-[#0C81F3] text-white rounded-xl text-sm font-medium hover:bg-[#0a6cd4] transition-colors">
            Search
          </button>
        </form>
        <select
          value={source}
          onChange={e => { setSource(e.target.value); setPage(1) }}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#0C81F3] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Sources</option>
          {SOURCES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" /></div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span className="text-3xl block mb-2">👥</span>
            <p className="text-sm">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Company</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0C81F3]/20 to-[#EB8988]/20 flex items-center justify-center text-[11px] font-bold text-gray-600">
                          {lead.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.company || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                        {lead.source?.replace(/-/g, ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(lead.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
