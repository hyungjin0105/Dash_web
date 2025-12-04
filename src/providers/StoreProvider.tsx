import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { useAuth } from './AuthProvider'

interface StoreOption {
  id: string
  name: string
}

interface StoreOwnerProfile {
  id: string
  name: string
  email: string
  phone: string
  role: string
  onboardingStatus?: string
  stores: string[]
  activeStoreId?: string
}

interface StoreContextValue {
  owner: StoreOwnerProfile | null
  stores: StoreOption[]
  ownedStoreIds: string[]
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  isLoading: boolean
  error: string | null
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

const fallbackValue: StoreContextValue = {
  owner: null,
  stores: [],
  ownedStoreIds: [],
  selectedStoreId: 'all',
  setSelectedStoreId: () => {},
  isLoading: false,
  error: null,
}

const chunk = <T,>(arr: T[], size: number) => {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

const fetchStoreNames = async (storeIds: string[]) => {
  if (!storeIds.length) return []
  const batches = chunk(storeIds, 10)
  const names: StoreOption[] = []
  for (const batch of batches) {
    const q = query(collection(firestore, 'restaurants'), where(documentId(), 'in', batch))
    const snapshot = await getDocs(q)
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      names.push({ id: docSnap.id, name: data.name ?? docSnap.id })
    })
  }
  return names
}

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [owner, setOwner] = useState<StoreOwnerProfile | null>(null)
  const [stores, setStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('all')
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadOwner = async () => {
      if (!user?.email) {
        setOwner(null)
        setStores([])
        setSelectedStoreId('all')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const q = query(collection(firestore, 'storeOwners'), where('email', '==', user.email))
        const snapshot = await getDocs(q)
        if (!mounted) return
        if (snapshot.empty) {
          setOwner(null)
          setStores([])
          setSelectedStoreId('all')
          setLoading(false)
          return
        }
        const docSnap = snapshot.docs[0]
        const payload = docSnap.data()
        const profile: StoreOwnerProfile = {
          id: docSnap.id,
          name: payload.name ?? '',
          email: payload.email ?? '',
          phone: payload.phone ?? '',
          role: payload.role ?? 'Store Owner',
          onboardingStatus: payload.onboardingStatus ?? 'pending',
          activeStoreId: payload.activeStoreId ?? '',
          stores: Array.isArray(payload.stores) ? payload.stores : [],
        }
        setOwner(profile)
        const storeNames = await fetchStoreNames(profile.stores)
        if (!mounted) return
        const allOption: StoreOption = { id: 'all', name: '전체 매장' }
        setStores([allOption, ...storeNames])
        const initialSelection =
          profile.activeStoreId && storeNames.some((store) => store.id === profile.activeStoreId)
            ? profile.activeStoreId
            : storeNames.length === 1
              ? storeNames[0].id
              : 'all'
        setSelectedStoreId(initialSelection)
      } catch (err) {
        console.error(err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'storeOwners를 불러오지 못했습니다.')
          setOwner(null)
          setStores([])
          setSelectedStoreId('all')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadOwner()
    return () => {
      mounted = false
    }
  }, [user?.email])

  const ownedStoreIds = useMemo(
    () => stores.filter((store) => store.id !== 'all').map((store) => store.id),
    [stores],
  )

  const value = useMemo<StoreContextValue>(
    () => ({ owner, stores, ownedStoreIds, selectedStoreId, setSelectedStoreId, isLoading, error }),
    [owner, stores, ownedStoreIds, selectedStoreId, isLoading, error],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStoreContext = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) return fallbackValue
  return ctx
}
