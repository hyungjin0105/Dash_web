/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_ADMIN_EMAIL_DOMAIN?: string
  readonly VITE_ALLOW_ALL_EMAILS?: string
  readonly VITE_USE_EMULATORS?: string
  readonly VITE_NAVER_MAP_KEY_ID?: string
  readonly VITE_NAVER_MAP_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.csv?raw' {
  const content: string
  export default content
}

declare module '*.csv?url' {
  const src: string
  export default src
}
