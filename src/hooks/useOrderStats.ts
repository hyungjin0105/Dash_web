import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { firestore } from '../lib/firebase'

type OrderDoc = {
  createdAt?: { toDate: () => Date }
  totalAmount?: number
  restaurantId?: string
}

type OrderStatEntry = {
  dateKey: string
  count: number
  totalAmount: number
}

export const useOrderStats = (storeId?: string) => {
  const [data, setData] = useState<{
    totalOrders: number
    totalAmount: number
    entries: OrderStatEntry[]
  } | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [isError, setError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const snapshot = await getDocs(collection(firestore, 'orders'))
        const entriesMap = new Map<string, OrderStatEntry>()
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as OrderDoc
          if (storeId && storeId !== 'all' && data.restaurantId && data.restaurantId !== storeId) {
            return
          }
          const date = data.createdAt?.toDate() ?? new Date()
          const dateKey = date.toISOString().slice(0, 10)
          const amount = data.totalAmount ?? 0
          const entry = entriesMap.get(dateKey) ?? {
            dateKey,
            count: 0,
            totalAmount: 0,
          }
          entry.count += 1
          entry.totalAmount += amount
          entriesMap.set(dateKey, entry)
        })

        const entries = Array.from(entriesMap.values()).sort((a, b) =>
          a.dateKey.localeCompare(b.dateKey),
        )
        const totalOrders = entries.reduce((sum, entry) => sum + entry.count, 0)
        const totalAmount = entries.reduce((sum, entry) => sum + entry.totalAmount, 0)

        setData({ totalOrders, totalAmount, entries })
      } catch (error) {
        console.error(error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [storeId])

  return { data, isLoading, isError }
}
