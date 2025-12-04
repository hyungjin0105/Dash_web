import { Timestamp, collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { firestore } from '../lib/firebase'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const toDate = (value: unknown): Date | null => {
  if (value instanceof Timestamp) return value.toDate()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return new Date(parsed)
  }
  return null
}

const formatRelativeDays = (days: number) => {
  if (days <= 0.5) return '오늘'
  if (days <= 1.5) return '어제'
  return `${Math.round(days)}일 전`
}

export interface LoyaltySegment {
  name: string
  visits: number
  lastVisitLabel: string
  lastVisitDate: string
  favorite?: string
  daysSince: number
}

export interface LoyaltyInsights {
  returningRate: number
  returningChange: number
  todayReturning: number
  avgVisitCycle: number
  activeCustomers: number
  repeatCustomers: number
  likelyReturning: LoyaltySegment[]
  atRisk: LoyaltySegment[]
}

export const useLoyaltyInsights = (storeId?: string) => {
  const [data, setData] = useState<LoyaltyInsights | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [isError, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const snapshot = await getDocs(collection(firestore, 'orders'))
        const now = new Date()
        const last30Start = new Date(now.getTime() - 30 * MS_PER_DAY)
        const prev60Start = new Date(now.getTime() - 60 * MS_PER_DAY)

        const customers = new Map<
          string,
          {
            name: string
            orders: Array<{ date: Date; restaurant?: string }>
            last30: number
            prevWindow: number
          }
        >()

        snapshot.forEach((doc) => {
          const payload = doc.data()
          if (storeId && storeId !== 'all' && payload.restaurantId && payload.restaurantId !== storeId) {
            return
          }
          const createdAt = toDate(payload.createdAt)
          if (!createdAt) return
          const key =
            (payload.phone as string | undefined)?.trim() ||
            (payload.customerName as string | undefined)?.trim() ||
            doc.id
          const name = (payload.customerName as string | undefined) || '손님'
          if (!customers.has(key)) {
            customers.set(key, { name, orders: [], last30: 0, prevWindow: 0 })
          }
          const entry = customers.get(key)!
          entry.orders.push({
            date: createdAt,
            restaurant: payload.restaurantName as string | undefined,
          })
          if (createdAt >= last30Start) {
            entry.last30 += 1
          } else if (createdAt >= prev60Start) {
            entry.prevWindow += 1
          }
        })

        let active = 0
        let repeat = 0
        let prevActive = 0
        let prevRepeat = 0
        let totalIntervals = 0
        let intervalSum = 0
        let todayReturning = 0
        const likelyCandidates: LoyaltySegment[] = []
        const atRiskCandidates: LoyaltySegment[] = []

        customers.forEach((entry) => {
          if (entry.last30 > 0) active += 1
          if (entry.last30 >= 2) repeat += 1
          if (entry.prevWindow > 0) prevActive += 1
          if (entry.prevWindow >= 2) prevRepeat += 1
          entry.orders.sort((a, b) => b.date.getTime() - a.date.getTime())
          for (let i = 1; i < entry.orders.length; i += 1) {
            const delta =
              (entry.orders[i - 1].date.getTime() - entry.orders[i].date.getTime()) /
              MS_PER_DAY
            if (delta > 0) {
              intervalSum += delta
              totalIntervals += 1
            }
          }
          const last = entry.orders[0]
          const daysSince = (now.getTime() - last.date.getTime()) / MS_PER_DAY
          if (daysSince < 0.8 && entry.orders.length >= 2) {
            todayReturning += 1
          }
          const segment: LoyaltySegment = {
            name: entry.name,
            visits: entry.orders.length,
            lastVisitLabel: formatRelativeDays(daysSince),
            lastVisitDate: last.date.toLocaleDateString(),
            favorite: last.restaurant,
            daysSince,
          }
          if (entry.orders.length >= 2 && daysSince >= 21) {
            atRiskCandidates.push({ ...segment })
          } else if (entry.orders.length >= 2 && daysSince >= 3 && daysSince <= 14) {
            likelyCandidates.push({ ...segment })
          }
        })

        const returningRate = active > 0 ? (repeat / active) * 100 : 0
        const prevRate = prevActive > 0 ? (prevRepeat / prevActive) * 100 : 0
        const avgVisitCycle = totalIntervals > 0 ? intervalSum / totalIntervals : 0

        likelyCandidates.sort((a, b) => a.daysSince - b.daysSince)
        atRiskCandidates.sort((a, b) => b.daysSince - a.daysSince)

        if (mounted) {
          setData({
            returningRate,
            returningChange: returningRate - prevRate,
            todayReturning,
            avgVisitCycle,
            activeCustomers: active,
            repeatCustomers: repeat,
            likelyReturning: likelyCandidates.slice(0, 4),
            atRisk: atRiskCandidates.slice(0, 4),
          })
          setError(false)
        }
      } catch (error) {
        console.error(error)
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => {
      mounted = false
    }
  }, [storeId])

  return { data, isLoading, isError }
}
