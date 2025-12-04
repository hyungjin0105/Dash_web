import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
} from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

import { firebaseConfig } from '../config/firebase'

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)
const storage = getStorage(firebaseApp)

const googleProvider = new GoogleAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true'

if (useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(firestore, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}

export const analyticsPromise = analyticsSupported().then((supported) =>
  supported ? getAnalytics(firebaseApp) : null,
)

export { firebaseApp, auth, firestore, storage, googleProvider, appleProvider }
