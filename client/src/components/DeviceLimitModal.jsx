import { useState } from 'react'
import { ShieldAlert, ShieldX, Mail, CheckCircle, X, AlertCircle, Copy, Check } from 'lucide-react'
import { useLinkDeviceEmailMutation } from '../services/apiSlice'

export default function DeviceLimitModal({ isOpen, onClose, limitData }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [linkDeviceEmail, { isLoading }] = useLinkDeviceEmailMutation()
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const isBlocked = Boolean(limitData?.deviceBlocked)
  const toolName = limitData?.toolName || 'this tool'
  const usageCount = limitData?.usageCount || 3
  const limit = limitData?.limit || 3
  const deviceId = limitData?.deviceId || (typeof window !== 'undefined' ? localStorage.getItem('seo_tool_device_id') : '')

  const copyDeviceId = () => {
    if (deviceId) {
      navigator.clipboard.writeText(deviceId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    try {
      setErrorMsg('')
      await linkDeviceEmail({
        email: email.trim().toLowerCase(),
        toolSlug: limitData?.toolSlug,
      }).unwrap()
      setSubmitted(true)
    } catch (err) {
      setErrorMsg(err?.data?.error || 'Failed to submit email. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`relative p-6 text-center border-b border-gray-100 ${
          isBlocked 
            ? 'bg-gradient-to-r from-red-600/15 via-rose-500/10 to-red-600/15'
            : 'bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white/50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl border flex items-center justify-center shadow-sm ${
            isBlocked
              ? 'bg-red-100 border-red-300 text-red-600'
              : 'bg-red-50 border-red-200 text-red-500'
          }`}>
            {isBlocked ? <ShieldX className="w-8 h-8" /> : <ShieldAlert className="w-7 h-7" />}
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isBlocked ? 'Access Restricted' : 'Complimentary Limit Reached'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isBlocked
              ? (limitData?.error || 'Access to this tool is currently restricted. Please contact support.')
              : (
                <>
                  You have completed your complimentary audits for <span className="font-semibold text-gray-900">{toolName}</span> ({usageCount} of {limit} free generations used).
                </>
              )}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">Request Received!</h4>
              <p className="text-sm text-gray-600">
                Your email <span className="font-medium text-gray-800">{email}</span> has been received. Our team will review your request and {isBlocked ? 'restore access' : 'grant extended access'} shortly.
              </p>
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reference ID info pill */}
              {deviceId && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                  <div className="truncate mr-2">
                    <span className="text-gray-400 font-medium">Reference ID: </span>
                    <span className="font-mono text-gray-700 font-semibold">{deviceId.slice(0, 18)}...</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyDeviceId}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium shrink-0 px-2 py-1 bg-white border border-gray-200 rounded-md shadow-xs hover:bg-gray-50 cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedId ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">
                {isBlocked
                  ? 'Submit your email below to send an access review request, or share your Reference ID with support.'
                  : 'To ensure optimal service quality, free access is limited per session. Provide your email below to request extended or unlimited access.'}
              </p>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Your Work or Personal Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0C81F3] focus:ring-2 focus:ring-[#0C81F3]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer ${
                    isBlocked
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                      : 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-90 shadow-[#0C81F3]/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>{isBlocked ? 'Submit Access Request' : 'Request Extended Access'}</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

