import { useState } from 'react'
import { Download, Users, CheckCircle2, XCircle, Send, Loader2 } from 'lucide-react'
import {
  useGetAdminLeadsQuery,
  useDeleteAdminLeadMutation,
  useSendAdminLeadPdfMutation,
} from '../../services/apiSlice'
import ConfirmModal from '../../components/ConfirmModal'
import TablePagination from '../../components/TablePagination'

const SOURCES = [
  '',
  'content-analyzer',
  'seo-audit',
  'keyword-research',
  'blog-topics',
  'content-qa',
  'blog-conclusion-generator',
  'logo-maker',
  'seo-roi',
  'ai-content-writer',
  'business-competitor-analytics',
]

// Mirrors server/src/utils/pdfSendResultTypes.js's leadField list — every
// Lead field that links to a tool result wired into the PDF send pipeline.
// A lead has a "Send PDF" action available whenever any one of these is set.
const LEAD_RESULT_FIELDS = [
  'contentQaId',
  'blogConclusionId',
  'auditId',
  'blogTopicId',
  'researchId',
  'roiCalculationId',
  'contentWriterId',
  'businessCompetitorId',
  'faqId',
  'competitorAnalysisId',
  'eeatAnalysisId',
  'caseStudyId',
  'blogIntroId',
]

const hasLinkedResult = (lead) => LEAD_RESULT_FIELDS.some((field) => lead[field])

export default function AdminLeads() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [leadToDelete, setLeadToDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const [sendingLeadId, setSendingLeadId] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const queryParams = {
    page,
    limit: pageSize,
    ...(source ? { source } : {}),
    ...(submittedSearch ? { search: submittedSearch } : {}),
  }

  const { data, isLoading, refetch } = useGetAdminLeadsQuery(queryParams)
  const [deleteAdminLead, { isLoading: isDeleting }] = useDeleteAdminLeadMutation()
  const [sendAdminLeadPdf] = useSendAdminLeadPdfMutation()

  const handleSendPdf = async (lead) => {
    setSendingLeadId(lead.id)
    try {
      const res = await sendAdminLeadPdf(lead.id).unwrap()
      showToast(`PDF sent successfully to ${res.sentTo || lead.email}`, 'success')
      refetch()
    } catch (err) {
      showToast(err?.data?.error || `Failed to send PDF to ${lead.email}`, 'error')
      refetch()
    } finally {
      setSendingLeadId(null)
    }
  }

  const leads = data?.leads || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search.trim())
  }

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return
    try {
      await deleteAdminLead(leadToDelete.id).unwrap()
      setLeadToDelete(null)
      refetch()
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }

  const exportCSV = () => {
    if (leads.length === 0) return
    const headers = ['Name', 'Email', 'Company', 'Website', 'Phone', 'Source', 'Date']
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.company || '',
      l.website || '',
      l.phone || '',
      l.source || '',
      new Date(l.createdAt).toLocaleDateString(),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
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
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm animate-fade-in ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-4 h-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
          <p className="text-sm text-gray-500">{pagination.total} total leads</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company..."
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value)
            setPage(1)
          }}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#0C81F3] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Sources</option>
          {SOURCES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">PDF Status</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
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
                      {new Date(lead.createdAt).toLocaleDateString()}{' '}
                      {new Date(lead.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {lead.pdfSendStatus === 'sent' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium"
                          title={
                            lead.pdfSentAt
                              ? `Sent ${new Date(lead.pdfSentAt).toLocaleString()} (${lead.pdfSendTriggeredBy || 'manual'})`
                              : undefined
                          }
                        >
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                      ) : lead.pdfSendStatus === 'failed' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium"
                          title={lead.pdfSendError || 'Send failed'}
                        >
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          Not Sent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {hasLinkedResult(lead) && (
                          <button
                            onClick={() => handleSendPdf(lead)}
                            disabled={sendingLeadId === lead.id}
                            className="inline-flex items-center gap-1 text-xs text-[#0C81F3] hover:text-[#0969C3] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send the PDF report to this lead's email"
                          >
                            {sendingLeadId === lead.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            {lead.pdfSendStatus === 'sent' ? 'Resend' : 'Send'}
                          </button>
                        )}
                        <button
                          onClick={() => setLeadToDelete(lead)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <TablePagination
          currentPage={page}
          totalPages={pagination.pages || 1}
          totalItems={pagination.total || 0}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
          itemLabel="leads"
          isLoading={isLoading}
        />
      </div>

      {/* Confirm Delete Lead Modal */}
      <ConfirmModal
        isOpen={Boolean(leadToDelete)}
        onClose={() => setLeadToDelete(null)}
        onConfirm={confirmDeleteLead}
        isLoading={isDeleting}
        title="Delete Lead"
        message={
          leadToDelete ? (
            <span>
              Are you sure you want to delete the lead for{' '}
              <strong className="text-gray-900">{leadToDelete.name}</strong> ({leadToDelete.email})?
              This record will be permanently removed.
            </span>
          ) : (
            'Are you sure you want to delete this lead?'
          )
        }
        confirmText="Delete Lead"
      />
    </div>
  )
}
