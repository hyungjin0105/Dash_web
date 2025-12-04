import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type {
  PromotionFormValues,
  PromotionRecord,
  PromotionStatus,
} from '../types/promotions'

type StoreCouponDoc = {
  id: string
  title: string
  description?: string
  code?: string | null
  discountKind: PromotionFormValues['discountKind']
  discountValue: number
  minOrderPrice: number
  maxRedemptions?: number | null
  serviceModes: string[]
  channels: string[]
  startDate: Timestamp | null
  endDate: Timestamp | null
  status: PromotionStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

const toDateValue = (value: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return Timestamp.fromDate(date)
}

const formatTimestamp = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString()
  }
  if (typeof value === 'string') return value
  return null
}

const buildStoreCoupon = (
  promotionId: string,
  values: PromotionFormValues,
  startDate: Timestamp | null,
  endDate: Timestamp | null,
): StoreCouponDoc => {
  const now = Timestamp.now()
  const minOrderPrice = Number(values.minOrderPrice) || 0
  const maxRedemptions = values.maxRedemptions ? Number(values.maxRedemptions) : null
  const serviceModes =
    values.serviceModes && values.serviceModes.length > 0 ? values.serviceModes : ['배달']

  return {
    id: promotionId,
    title: values.title,
    description: values.description,
    code: values.couponCode || null,
    discountKind: values.discountKind,
    discountValue: Number(values.discountValue) || 0,
    minOrderPrice,
    maxRedemptions,
    serviceModes,
    channels: values.channels,
    startDate,
    endDate,
    status: 'planned',
    createdAt: now,
    updatedAt: now,
  }
}

const sanitizeCouponsArray = (data: unknown): StoreCouponDoc[] => {
  if (!Array.isArray(data)) return []
  return data.filter((item): item is StoreCouponDoc => {
    if (!item || typeof item !== 'object') return false
    return typeof (item as StoreCouponDoc).id === 'string'
  })
}

const upsertCouponOnStore = async (storeId: string, coupon: StoreCouponDoc) => {
  const storeRef = doc(firestore, 'restaurants', storeId)
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(storeRef)
    if (!snapshot.exists()) {
      throw new Error('해당 매장을 찾을 수 없습니다.')
    }
    const existing = sanitizeCouponsArray(snapshot.data()?.coupons)
    const filtered = existing.filter((item) => item.id !== coupon.id)
    filtered.push(coupon)
    transaction.update(storeRef, { coupons: filtered, updatedAt: serverTimestamp() })
  })
}

const updateCouponStatusOnStore = async (
  storeId: string,
  couponId: string,
  status: PromotionStatus,
) => {
  const storeRef = doc(firestore, 'restaurants', storeId)
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(storeRef)
    if (!snapshot.exists()) return
    const existing = sanitizeCouponsArray(snapshot.data()?.coupons)
    let changed = false
    const updated = existing.map((coupon) => {
      if (coupon.id !== couponId) return coupon
      changed = true
      return { ...coupon, status, updatedAt: Timestamp.now() }
    })
    if (changed) {
      transaction.update(storeRef, { coupons: updated })
    }
  })
}

const removeCouponFromStore = async (storeId: string, couponId: string) => {
  const storeRef = doc(firestore, 'restaurants', storeId)
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(storeRef)
    if (!snapshot.exists()) return
    const existing = sanitizeCouponsArray(snapshot.data()?.coupons)
    const filtered = existing.filter((coupon) => coupon.id !== couponId)
    transaction.update(storeRef, { coupons: filtered })
  })
}

export const createPromotion = async (values: PromotionFormValues) => {
  if (!values.storeId) {
    throw new Error('storeId is required')
  }

  const startDate = toDateValue(values.startDate)
  const endDate = toDateValue(values.endDate)
  const minOrderPrice = Number(values.minOrderPrice) || 0
  const maxRedemptions = values.maxRedemptions ? Number(values.maxRedemptions) : null
  const serviceModes =
    values.serviceModes && values.serviceModes.length > 0 ? values.serviceModes : ['배달']

  const payload = {
    title: values.title,
    description: values.description,
    promotionKind: values.promotionKind,
    discountKind: values.discountKind,
    discountValue: Number(values.discountValue) || 0,
    startDate,
    endDate,
    channels: values.channels,
    targetSegment: values.targetSegment,
    status: 'planned' as PromotionStatus,
    storeId: values.storeId,
    storeName: values.storeName,
    couponCode: values.couponCode || null,
    minOrderPrice,
    maxRedemptions,
    serviceModes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(firestore, 'promotions'), payload)

  if (values.promotionKind === '쿠폰') {
    const couponDoc = buildStoreCoupon(docRef.id, values, startDate, endDate)
    await upsertCouponOnStore(values.storeId, couponDoc)
  }

  return values
}

export const updatePromotionStatus = async (
  promotion: PromotionRecord,
  status: PromotionStatus,
) => {
  const ref = doc(firestore, 'promotions', promotion.id)
  await updateDoc(ref, { status, updatedAt: serverTimestamp() })
  if (promotion.promotionKind === '쿠폰' && promotion.storeId) {
    await updateCouponStatusOnStore(promotion.storeId, promotion.id, status)
  }
}

export const deletePromotion = async (promotion: PromotionRecord) => {
  await deleteDoc(doc(firestore, 'promotions', promotion.id))
  if (promotion.promotionKind === '쿠폰' && promotion.storeId) {
    await removeCouponFromStore(promotion.storeId, promotion.id)
  }
}

const mapPromotionDoc = (docSnap: any) => {
  const data = docSnap.data()
  const createdAtTs = data.createdAt instanceof Timestamp ? data.createdAt : null
  const startDate =
    data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString().slice(0, 10) : null
  const endDate =
    data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString().slice(0, 10) : null
  return {
    sortKey: createdAtTs ? createdAtTs.toMillis() : 0,
    record: {
      id: docSnap.id,
      storeId: data.storeId ?? '',
      storeName: data.storeName ?? '',
      title: data.title ?? '제목 없음',
      description: data.description ?? '',
      promotionKind: data.promotionKind ?? '쿠폰',
      discountKind: data.discountKind ?? 'amount',
      discountValue: data.discountValue ?? 0,
      startDate,
      endDate,
      channels: Array.isArray(data.channels) ? data.channels : [],
      targetSegment: data.targetSegment ?? '',
      couponCode: data.couponCode ?? '',
      minOrderPrice: data.minOrderPrice ?? 0,
      maxRedemptions: data.maxRedemptions ?? null,
      serviceModes: Array.isArray(data.serviceModes) ? data.serviceModes : [],
      status: data.status ?? 'planned',
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
    } as PromotionRecord,
  }
}

export const fetchPromotions = async (storeIds?: string[]): Promise<PromotionRecord[]> => {
  const baseRef = collection(firestore, 'promotions')
  const entries: Array<{ sortKey: number; record: PromotionRecord }> = []

  if (storeIds && storeIds.length > 0) {
    for (const storeId of storeIds) {
      const snapshot = await getDocs(
        query(baseRef, where('storeId', '==', storeId), orderBy('createdAt', 'desc')),
      )
      snapshot.forEach((docSnap) => entries.push(mapPromotionDoc(docSnap)))
    }
  } else {
    const snapshot = await getDocs(query(baseRef, orderBy('createdAt', 'desc')))
    snapshot.forEach((docSnap) => entries.push(mapPromotionDoc(docSnap)))
  }

  entries.sort((a, b) => b.sortKey - a.sortKey)
  return entries.map((entry) => entry.record)
}
