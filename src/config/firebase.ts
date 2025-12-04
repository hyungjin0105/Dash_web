type FirebaseEnvKey =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID'
  | 'VITE_FIREBASE_MEASUREMENT_ID'
  | 'VITE_ADMIN_EMAIL_DOMAIN'
  | 'VITE_ALLOW_ALL_EMAILS'

const getEnv = (key: FirebaseEnvKey) => {
  const value = import.meta.env[key]
  if (!value) {
    console.warn(`Missing value for ${key}. Check your .env configuration.`)
  }
  return value
}

export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
}

export const adminEmailDomain = getEnv('VITE_ADMIN_EMAIL_DOMAIN') ?? '@dash.app'
export const allowAllEmails = import.meta.env.VITE_ALLOW_ALL_EMAILS === 'true'
