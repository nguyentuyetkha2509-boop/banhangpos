import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, OWNER_EMAIL } from '../lib/firebase'
import { useAuth } from './AuthContext'

export function usePendingApprovalsCount() {
  const { user } = useAuth()
  const isOwner = user?.email === OWNER_EMAIL
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isOwner) {
      setCount(0)
      return
    }
    const q = query(collection(db, 'shops'), where('approved', '==', false))
    const unsub = onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(0)
    )
    return unsub
  }, [isOwner])

  return isOwner ? count : 0
}
