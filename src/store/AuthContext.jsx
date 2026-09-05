import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const AuthContext = createContext(null)

function translateAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ'
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký'
    case 'auth/weak-password':
      return 'Mật khẩu cần ít nhất 6 ký tự'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email hoặc mật khẩu không đúng'
    case 'auth/too-many-requests':
      return 'Bạn thử sai quá nhiều lần, vui lòng thử lại sau ít phút'
    default:
      return 'Có lỗi xảy ra, vui lòng thử lại'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  async function signUp(email, password) {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: translateAuthError(err.code) }
    }
  }

  async function signIn(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: translateAuthError(err.code) }
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: translateAuthError(err.code) }
    }
  }

  async function signOutUser() {
    await firebaseSignOut(auth)
  }

  const value = {
    user,
    loading: user === undefined,
    signUp,
    signIn,
    resetPassword,
    signOut: signOutUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider')
  return ctx
}
