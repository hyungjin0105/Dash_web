import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { adminEmailDomain, allowAllEmails } from '../config/firebase'

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'rejected'

export interface AdminUser {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  isAdmin: boolean
  firebaseUser: User
}

interface AuthContextValue {
  status: AuthStatus
  user: AdminUser | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const fallbackState: AuthContextValue = {
  status: 'loading',
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  error: null,
}

const isAllowedDomain = (email?: string | null) =>
  Boolean(email && email.endsWith(adminEmailDomain))

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setStatus('unauthenticated')
        setUser(null)
        return
      }

      const tokenResult = await firebaseUser.getIdTokenResult(true)
      const hasAdminClaim = Boolean(tokenResult.claims?.admin)
      const domainAllowed = allowAllEmails || isAllowedDomain(firebaseUser.email)
      const isAdmin = hasAdminClaim || domainAllowed

      if (!isAdmin) {
        setStatus('rejected')
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? 'unknown',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: false,
          firebaseUser,
        })
        return
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? 'unknown',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isAdmin,
        firebaseUser,
      })
      setStatus('authenticated')
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Authentication failed')
      }
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn,
      signOut,
      error,
    }),
    [status, user, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return fallbackState
  }
  return ctx
}
