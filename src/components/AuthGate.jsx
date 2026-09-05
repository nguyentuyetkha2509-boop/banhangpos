import React, { useState } from 'react'
import { useAuth } from '../store/AuthContext'

export default function AuthGate({ children }) {
  const { user, loading, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Đang tải...</p>
      </div>
    )
  }

  if (user) return children

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) return
    setSubmitting(true)
    const result = mode === 'signup' ? await signUp(trimmedEmail, password) : await signIn(trimmedEmail, password)
    setSubmitting(false)
    if (!result.ok) setError(result.error)
  }

  async function handleResetPassword() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Nhập email trước để nhận link đặt lại mật khẩu')
      return
    }
    setError('')
    setMessage('')
    setSubmitting(true)
    const result = await resetPassword(trimmedEmail)
    setSubmitting(false)
    if (result.ok) setMessage('Đã gửi email đặt lại mật khẩu, kiểm tra hộp thư của bạn')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <img src="logo-full.png" alt="TK Pos" className="w-48 mx-auto mb-4" />
        <p className="text-sm text-slate-500 text-center mb-5">
          {mode === 'signup' ? 'Tạo tài khoản để bắt đầu dùng và tự động lưu dữ liệu' : 'Đăng nhập để tiếp tục'}
        </p>

        <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: chulan@gmail.com"
        />

        <label className="block text-xs font-medium text-slate-500 mb-1">Mật khẩu</label>
        <input
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="Ít nhất 6 ký tự"
        />

        {mode === 'signin' && (
          <button
            type="button"
            onClick={handleResetPassword}
            className="text-xs text-brand-700 font-medium mb-3 mt-1"
          >
            Quên mật khẩu?
          </button>
        )}
        {mode === 'signup' && <div className="mb-3" />}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {message && <p className="text-xs text-emerald-600 mb-3">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-700 text-white rounded-xl py-3 font-medium disabled:opacity-50 active:scale-[0.98] transition mb-3"
        >
          {submitting ? 'Đang xử lý...' : mode === 'signup' ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup')
            setError('')
            setMessage('')
          }}
          className="w-full text-sm text-slate-500"
        >
          {mode === 'signup' ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </button>
      </form>
    </div>
  )
}
