import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminLoginMutation } from '../../services/apiSlice'

const PIN_LENGTH = 6

export default function AdminLogin() {
  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [adminLogin, { isLoading }] = useAdminLoginMutation()
  const inputsRef = useRef([])
  const navigate = useNavigate()

  const focusBox = (i) => inputsRef.current[Math.max(0, Math.min(PIN_LENGTH - 1, i))]?.focus()

  const submit = async (pin) => {
    if (pin.length !== PIN_LENGTH || isLoading) return
    setError('')
    try {
      const data = await adminLogin({ pin }).unwrap()
      if (!data.success) {
        setError(data.error || 'Login failed')
        return
      }
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.admin))
      navigate('/admin')
    } catch (err) {
      setError(err?.data?.error || err.message || 'Connection failed. Please try again.')
      setDigits(Array(PIN_LENGTH).fill(''))
      focusBox(0)
    }
  }

  // Fill boxes from index i with the typed or pasted digits; sign in once all six are filled.
  const fill = (i, text) => {
    const incoming = text.replace(/\D/g, '').slice(0, PIN_LENGTH - i).split('')
    if (!incoming.length) return
    const next = [...digits]
    incoming.forEach((d, k) => {
      next[i + k] = d
    })
    setDigits(next)
    focusBox(i + incoming.length)
    if (next.every(Boolean)) submit(next.join(''))
  }

  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[i]) next[i] = ''
      else if (i > 0) {
        next[i - 1] = ''
        focusBox(i - 1)
      }
      setDigits(next)
    } else if (e.key === 'ArrowLeft') focusBox(i - 1)
    else if (e.key === 'ArrowRight') focusBox(i + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your 6-digit PIN to continue</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(digits.join(''))
          }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-3 text-center w-full">
              PIN
            </legend>
            <div className="flex justify-center gap-2 sm:gap-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="password"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={d}
                  autoFocus={i === 0}
                  disabled={isLoading}
                  aria-label={`PIN digit ${i + 1}`}
                  onChange={(e) => fill(i, e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault()
                    fill(i, e.clipboardData.getData('text'))
                  }}
                  onKeyDown={onKeyDown(i)}
                  onFocus={(e) => e.target.select()}
                  className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-[#0C81F3] focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 transition-all disabled:opacity-60"
                />
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isLoading || digits.some((d) => !d)}
            className="w-full py-3 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#0C81F3]/20"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
