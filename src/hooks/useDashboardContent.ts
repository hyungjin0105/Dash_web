import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { firestore } from '../lib/firebase'
import type { DashboardContentDoc, PartnerStore } from '../types/dashboard'

interface DashboardContentState {
  menuHighlights: string[]
  partnerStores: PartnerStore[]
}

const FALLBACK_CONTENT: DashboardContentState = {
  menuHighlights: [
    '가장 인기있는 메뉴를 상단에 두면 주문이 빨라집니다.',
    '오늘의 추천 메뉴는 앱 홈에서도 강조됩니다.',
  ],
  partnerStores: [
    {
      id: 'hanriver-tteokbokki',
      name: '한강 떡볶이',
      area: '여의도',
      distanceKm: 0.4,
      benefit: 'QR 주문시 사이드 1개 무료',
      lat: 37.5219,
      lng: 126.9247,
    },
    {
      id: 'midnight-pizza',
      name: '미드나잇 피자',
      area: '홍대입구',
      distanceKm: 0.8,
      benefit: 'Silo 단골 10% 할인',
      lat: 37.5563,
      lng: 126.9237,
    },
    {
      id: 'green-tea',
      name: '그린티 라운지',
      area: '성수',
      distanceKm: 1.1,
      benefit: '말차 클래스를 함께 홍보',
      lat: 37.5446,
      lng: 127.0559,
    },
  ],
}

const safeArray = <T,>(value: unknown, fallback: T[]): T[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && item !== null) as T[]
  }
  return fallback
}

const sanitizePartnerStores = (raw: unknown): PartnerStore[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map<PartnerStore | null>((item) => {
      if (typeof item !== 'object' || item === null) return null
      const candidate = item as Record<string, unknown>
      const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : undefined
      const name =
        typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : undefined
      if (!id || !name) return null
      const latValue =
        typeof candidate.lat === 'number'
          ? candidate.lat
          : typeof candidate.lat === 'string'
            ? Number(candidate.lat)
            : undefined
      const lngValue =
        typeof candidate.lng === 'number'
          ? candidate.lng
          : typeof candidate.lng === 'string'
            ? Number(candidate.lng)
            : undefined

      const normalized: PartnerStore = {
        id,
        name,
      }
      if (typeof candidate.area === 'string') normalized.area = candidate.area
      if (typeof candidate.distanceKm === 'number') normalized.distanceKm = candidate.distanceKm
      if (typeof candidate.distanceKm === 'string') {
        const parsed = Number(candidate.distanceKm)
        if (!Number.isNaN(parsed)) normalized.distanceKm = parsed
      }
      if (typeof candidate.benefit === 'string') normalized.benefit = candidate.benefit
      if (typeof candidate.distanceLabel === 'string') normalized.distanceLabel = candidate.distanceLabel
      if (Array.isArray(candidate.tags)) {
        const tags = candidate.tags.filter((tag) => typeof tag === 'string') as string[]
        if (tags.length) normalized.tags = tags
      }
      if (typeof latValue === 'number' && Number.isFinite(latValue)) normalized.lat = latValue
      if (typeof lngValue === 'number' && Number.isFinite(lngValue)) normalized.lng = lngValue
      if (typeof candidate.address === 'string') normalized.address = candidate.address
      if (typeof candidate.logoImage === 'string') normalized.logoImage = candidate.logoImage
      return normalized
    })
    .filter((store): store is PartnerStore => store !== null)
}

export const useDashboardContent = () => {
  const [content, setContent] = useState<DashboardContentState>(FALLBACK_CONTENT)
  const [isLoading, setLoading] = useState(true)
  const [isError, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadContent = async () => {
      try {
        const snapshot = await getDoc(doc(firestore, 'dashboardContent', 'global'))
        if (!snapshot.exists()) {
          if (isMounted) {
            setContent(FALLBACK_CONTENT)
            setError(false)
          }
          return
        }
        const payload = snapshot.data() as DashboardContentDoc
        const menuHighlights = safeArray<string>(
          payload.menuHighlights,
          FALLBACK_CONTENT.menuHighlights,
        )
        const partnerStores = sanitizePartnerStores(payload.partnerStores)
        if (isMounted) {
          setContent({
            menuHighlights: menuHighlights.length ? menuHighlights : FALLBACK_CONTENT.menuHighlights,
            partnerStores: partnerStores.length ? partnerStores : FALLBACK_CONTENT.partnerStores,
          })
          setError(false)
        }
      } catch (error) {
        console.error(error)
        if (isMounted) {
          setContent(FALLBACK_CONTENT)
          setError(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadContent()
    return () => {
      isMounted = false
    }
  }, [])

  return { content, isLoading, isError }
}
