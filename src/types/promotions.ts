export type PromotionKind = '쿠폰' | '이벤트' | '배너'
export type DiscountKind = 'amount' | 'percent'
export type PromotionStatus = 'planned' | 'active' | 'ended'

export interface PromotionFormValues {
  storeId: string
  storeName: string
  title: string
  description: string
  promotionKind: PromotionKind
  discountKind: DiscountKind
  discountValue: string
  startDate: string
  endDate: string
  channels: string[]
  targetSegment: string
  couponCode: string
  minOrderPrice: string
  maxRedemptions: string
  serviceModes: string[]
}

export interface PromotionRecord {
  id: string
  storeId: string
  storeName?: string
  title: string
  description: string
  promotionKind: PromotionKind
  discountKind: DiscountKind
  discountValue: number
  startDate: string | null
  endDate: string | null
  channels: string[]
  targetSegment: string
  couponCode?: string
  minOrderPrice?: number
  maxRedemptions?: number | null
  serviceModes?: string[]
  status: PromotionStatus
  createdAt?: string | null
  updatedAt?: string | null
}
