import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { OrderFormValues, OrderRecord, OrderStatus } from '../types/orders'

const normalizeTimestamp = (value: unknown): string | null => {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString()
  }
  if (typeof value === 'string') {
    return value
  }
  return null
}

export const fetchOrders = async (restaurantId?: string): Promise<OrderRecord[]> => {
  const ordersRef = collection(firestore, 'orders')
  const baseQuery = restaurantId
    ? query(ordersRef, where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc'))
    : query(ordersRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(baseQuery)

  return Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data()
      let restaurantName = data.restaurantName ?? ''
      if (!restaurantName && data.restaurantId) {
        const restaurantRef = doc(firestore, 'restaurants', data.restaurantId)
        const restaurantDoc = await getDoc(restaurantRef)
        restaurantName = restaurantDoc.data()?.name ?? ''
      }
      return {
        id: docSnap.id,
        customerName: data.customerName ?? '고객',
        phone: data.phone ?? '',
        restaurantName,
        totalPrice: data.totalPrice ?? 0,
        deliveryMethod: data.deliveryMethod ?? '배달',
        status: data.status ?? '확인 중',
        createdAt: normalizeTimestamp(data.createdAt),
        notes: data.notes ?? '',
      }
    }),
  )
}

export const createOrder = async (values: OrderFormValues) => {
  const payload = {
    restaurantId: values.restaurantId,
    customerName: values.customerName,
    phone: values.phone,
    totalPrice: Number(values.totalPrice) || 0,
    deliveryMethod: values.deliveryMethod,
    status: values.status,
    notes: values.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await addDoc(collection(firestore, 'orders'), payload)
}

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const orderRef = doc(firestore, 'orders', orderId)
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  })
}

export const deleteOrder = async (orderId: string) => {
  await deleteDoc(doc(firestore, 'orders', orderId))
}
