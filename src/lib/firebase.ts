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

let firebaseApp
let auth
let firestore
let storage

try {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  firestore = getFirestore(firebaseApp)
  storage = getStorage(firebaseApp)
  console.log('Firebase initialized successfully')
} catch (error) {
  console.error('Firebase initialization failed:', error)
  // Provide fallback objects to prevent crashes
  firebaseApp = {} as any
  auth = {} as any
  firestore = {} as any
  storage = {} as any
}

const googleProvider = new GoogleAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true'

if (useEmulators && auth && firestore && storage) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(firestore, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    console.log('Connected to Firebase emulators')
  } catch (error) {
    console.error('Failed to connect to emulators:', error)
  }
}

export const analyticsPromise = firebaseApp?.analytics ? analyticsSupported().then((supported) =>
  supported ? getAnalytics(firebaseApp) : null,
) : Promise.resolve(null)

export { firebaseApp, auth, firestore, storage, googleProvider, appleProvider }
