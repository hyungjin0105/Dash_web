export type OrderStatus = '확인 중' | '조리 중' | '배달 출발' | '완료'

export interface OrderRecord {
  id: string
  customerName: string
  phone: string
  restaurantName: string
  totalPrice: number
  deliveryMethod: '배달' | '포장'
  status: OrderStatus
  createdAt?: string | null
  notes?: string
}

export interface OrderFormValues {
  restaurantId: string
  customerName: string
  phone: string
  totalPrice: string
  deliveryMethod: '배달' | '포장'
  notes: string
  status: OrderStatus
}
