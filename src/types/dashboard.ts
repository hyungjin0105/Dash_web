export interface PartnerStore {
  id: string
  name: string
  area?: string
  distanceKm?: number
  distanceLabel?: string
  benefit?: string
  tags?: string[]
  lat?: number
  lng?: number
  address?: string
  logoImage?: string
}

export interface DashboardContentDoc {
  menuHighlights?: string[]
  partnerStores?: PartnerStore[]
  updatedAt?: string
}
