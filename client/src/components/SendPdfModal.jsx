import { useState, useEffect } from 'react'
import { Mail, Send, CheckCircle2, FileText, Loader2, Sparkles, X, ShieldCheck } from 'lucide-react'
import { useSendPdfReportMutation } from '../services/apiSlice'

export default function SendPdfModal({
  isOpen,
  onClose,
  reportTitle = 'Technical Audit Report',
  filename = 'report.pdf',
  getPdfDoc,
  source = 'pdf-download',
  auditId,
  contentQaId,
  website,
  defaultEmail = '',
  defaultName = '',
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'generating' | 'sending' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [sentEmail, setSentEmail] = useState('')

  const [sendPdfReport] = useSendPdfReportMutation()

  useEffect(() => {
    if (isOpen) {
      // Pre-fill from localStorage or props if available
      const savedEmail = defaultEmail || localStorage.getItem('user_lead_email') || ''
      const savedName = defaultName || localStorage.getItem('user_lead_name') || ''
      const savedCompany = localStorage.getItem('user_lead_company') || ''
      setEmail(savedEmail)
      setName(savedName)
      setCompany(savedCompany)
      setStatus('idle')
      setErrorMessage('')
    }
  }, [isOpen, defaultEmail, defaultName])

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && status !== 'generating' && status !== 'sending') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, status, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (typeof getPdfDoc !== 'function') {
      setErrorMessage('Report generator is not available.')
      return
    }

    try {
      // 1. Generate the PDF in-memory
      setStatus('generating')
      await new Promise((resolve) => setTimeout(resolve, 50)) // Allow UI render

      const doc = await getPdfDoc()
      if (!doc || typeof doc.output !== 'function') {
        throw new Error('Failed to generate PDF document.')
      }

      const dataUri = doc.output('datauristring')
      const pdfBase64 = dataUri.split(',')[1]

      if (!pdfBase64) {
        throw new Error('Could not encode PDF content.')
      }

      // 2. Send via server API & capture lead
      setStatus('sending')
      const cleanName = name.trim() || cleanEmail.split('@')[0]
      const cleanCompany = company.trim()

      const payload = {
        email: cleanEmail,
        name: cleanName,
        company: cleanCompany || undefined,
        website: website?.trim() || undefined,
        source,
        auditId: auditId || undefined,
        contentQaId: contentQaId || undefined,
        pdfBase64,
        filename,
        reportTitle,
      }

      const res = await sendPdfReport(payload).unwrap()

      // Save for quick auto-fill in future downloads
      try {
        localStorage.setItem('user_lead_email', cleanEmail)
        if (cleanName) localStorage.setItem('user_lead_name', cleanName)
        if (cleanCompany) localStorage.setItem('user_lead_company', cleanCompany)
      } catch {}

      setSentEmail(cleanEmail)
      setStatus('success')
    } catch (err) {
      console.error('Failed to email PDF report:', err)
      setStatus('idle')
      setErrorMessage(
        err?.data?.error || err.message || 'Failed to deliver the PDF report. Please try again.'
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top colored accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #0C81F3 0%, #EB8988 100%)' }}
        />

        {/* Close Button */}
        {status !== 'generating' && status !== 'sending' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 sm:p-7">
          {status === 'success' ? (
            /* Success Confirmation View */
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">PDF Report Sent!</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  We have dispatched your full report directly to:
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#0C81F3] rounded-full text-xs font-semibold border border-blue-100">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{sentEmail}</span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#0C81F3]" />
                  <span>Attached: {filename}</span>
                </div>
                <p>
                  Please check your inbox (and spam/promotions folder). The email should arrive within a few seconds.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-[#0C81F3] hover:bg-[#0b74da] text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            /* Input Form View */
            <div>
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0C81F3] flex items-center justify-center shrink-0 border border-blue-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    Receive PDF Report by Email
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {reportTitle}
                  </p>
                </div>
              </div>

              <div className="mb-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0C81F3] shrink-0" />
                <span>We'll send the complete, multi-page branded PDF report straight to your inbox.</span>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Your Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    disabled={status === 'generating' || status === 'sending'}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#0C81F3] focus:ring-2 focus:ring-[#0C81F3]/20 outline-none transition disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      disabled={status === 'generating' || status === 'sending'}
                      placeholder="e.g. Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#0C81F3] focus:ring-2 focus:ring-[#0C81F3]/20 outline-none transition disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      disabled={status === 'generating' || status === 'sending'}
                      placeholder="e.g. Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#0C81F3] focus:ring-2 focus:ring-[#0C81F3]/20 outline-none transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Zero spam guaranteed</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={status === 'generating' || status === 'sending'}
                      onClick={onClose}
                      className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition disabled:opacity-40 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={status === 'generating' || status === 'sending'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C81F3] hover:bg-[#0b74da] text-white font-semibold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                    >
                      {status === 'generating' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : status === 'sending' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send PDF to Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
