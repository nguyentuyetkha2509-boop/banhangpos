import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDkyn_jm3MHYBDSBdnZZfnXhZPjnosWDGI',
  authDomain: 'banhangpos-e36f6.firebaseapp.com',
  projectId: 'banhangpos-e36f6',
  storageBucket: 'banhangpos-e36f6.firebasestorage.app',
  messagingSenderId: '817626115667',
  appId: '1:817626115667:web:d8fb1cba0b997398eb20a6'
}

export const OWNER_EMAIL = 'nguyentuyetkha2509@gmail.com'

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
