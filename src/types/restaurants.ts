export interface RestaurantFormValues {
  name: string
  tags: string
  categories: string
  primaryCategory: string
  heroImage: string
  sideImages: string
  logoImage: string
  services: string
  area: string
  deliveryEta: string
  deliveryFee: string
  minOrderPrice: string
  deliveryRangeKm: string
  address: string
  latitude: string
  longitude: string
  operatingHours: string
  discountInfo: string
  phoneNumber: string
  highlight: string
  notices: string
}

export interface MenuItemFormValue {
  name: string
  basePrice: string
  description: string
}

export interface MenuOptionChoiceFormValue {
  label: string
  priceDelta: string
}

export interface MenuOptionGroupFormValue {
  title: string
  isRequired: boolean
  minSelections: string
  maxSelections: string
  choices: MenuOptionChoiceFormValue[]
}

export interface MenuSectionFormValues {
  restaurantId: string
  title: string
  order: string
  items: MenuItemFormValue[]
  optionGroups: MenuOptionGroupFormValue[]
}

export interface RestaurantRecord {
  id: string
  name: string
  tags?: string[]
  categories?: string[]
  primaryCategory?: string
  services?: string[]
  area?: string
  deliveryEta?: string
  minOrderPrice?: number
  deliveryFee?: number
  createdAt?: string | null
  phoneNumber?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  heroImage?: string
  sideImages?: string[]
  logoImage?: string
  deliveryRangeKm?: number
  operatingHours?: string
  discountInfo?: string
  highlight?: string
  notices?: unknown
}

export interface MenuSectionRecord {
  id: string
  restaurantId: string
  title: string
  order: number
  items: Array<{
    name: string
    basePrice: number
    description?: string
    optionGroups?: MenuOptionGroupFormValue[]
  }>
  updatedAt?: string | null
}
