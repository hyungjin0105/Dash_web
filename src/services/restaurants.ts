import {
  Timestamp,
  GeoPoint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type {
  MenuSectionFormValues,
  MenuSectionRecord,
  RestaurantFormValues,
  RestaurantRecord,
} from '../types/restaurants'

const splitAndTrim = (value: string, delimiter = ',') =>
  value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean)

export const createRestaurant = async (values: RestaurantFormValues) => {
  const latitude = Number(values.latitude)
  const longitude = Number(values.longitude)
  const hasCoordinates = !Number.isNaN(latitude) && !Number.isNaN(longitude)

  const payload = {
    name: values.name,
    tags: splitAndTrim(values.tags),
    categories: splitAndTrim(values.categories, '|'),
    primaryCategory: values.primaryCategory || undefined,
    heroImage: values.heroImage,
    sideImages: splitAndTrim(values.sideImages),
    logoImage: values.logoImage,
    services: splitAndTrim(values.services),
    area: values.area,
    deliveryEta: values.deliveryEta,
    deliveryFee: Number(values.deliveryFee) || 0,
    minOrderPrice: Number(values.minOrderPrice) || 0,
    deliveryRangeKm: Number(values.deliveryRangeKm) || 0,
    address: values.address,
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    operatingHours: values.operatingHours,
    discountInfo: values.discountInfo,
    phoneNumber: values.phoneNumber,
    highlight: values.highlight,
    notices: values.notices
      ? splitAndTrim(values.notices).map((notice) => ({
          title: notice,
          description: '',
        }))
      : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (hasCoordinates) {
    ;(payload as Record<string, unknown>).location = new GeoPoint(latitude, longitude)
  }

  await addDoc(collection(firestore, 'restaurants'), payload)
}

export const updateRestaurant = async (id: string, values: RestaurantFormValues) => {
  const latitude = Number(values.latitude)
  const longitude = Number(values.longitude)
  const hasCoordinates = !Number.isNaN(latitude) && !Number.isNaN(longitude)

  const payload: Record<string, unknown> = {
    name: values.name,
    tags: splitAndTrim(values.tags),
    categories: splitAndTrim(values.categories, '|'),
    primaryCategory: values.primaryCategory || undefined,
    heroImage: values.heroImage,
    sideImages: splitAndTrim(values.sideImages),
    logoImage: values.logoImage,
    services: splitAndTrim(values.services),
    area: values.area,
    deliveryEta: values.deliveryEta,
    deliveryFee: Number(values.deliveryFee) || 0,
    minOrderPrice: Number(values.minOrderPrice) || 0,
    deliveryRangeKm: Number(values.deliveryRangeKm) || 0,
    address: values.address,
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    operatingHours: values.operatingHours,
    discountInfo: values.discountInfo,
    phoneNumber: values.phoneNumber,
    highlight: values.highlight,
    notices: values.notices
      ? splitAndTrim(values.notices).map((notice) => ({
          title: notice,
          description: '',
        }))
      : [],
    updatedAt: serverTimestamp(),
  }

  if (hasCoordinates) {
    payload.location = new GeoPoint(latitude, longitude)
  }

  await updateDoc(doc(firestore, 'restaurants', id), payload)
}

export const deleteRestaurant = async (id: string) => {
  await deleteDoc(doc(firestore, 'restaurants', id))
}

export const createMenuSection = async (values: MenuSectionFormValues) => {
  const restaurantRef = doc(firestore, 'restaurants', values.restaurantId)
  const menuCollection = collection(restaurantRef, 'menus')

  const optionGroups = values.optionGroups
    .filter((group) => group.title.trim().length > 0)
    .map((group) => ({
      title: group.title,
      isRequired: group.isRequired,
      minSelections: Number(group.minSelections) || 0,
      maxSelections: Number(group.maxSelections) || 1,
      choices: group.choices
        .filter((choice) => choice.label.trim().length > 0)
        .map((choice) => ({
          label: choice.label,
          priceDelta: Number(choice.priceDelta) || 0,
        })),
    }))

  const payload = {
    title: values.title,
    order: Number(values.order) || 0,
    items: values.items.map((item) => ({
      name: item.name,
      basePrice: Number(item.basePrice) || 0,
      description: item.description,
      optionGroups,
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await addDoc(menuCollection, payload)
}

export const updateMenuSection = async (restaurantId: string, sectionId: string, values: MenuSectionFormValues) => {
  const restaurantRef = doc(firestore, 'restaurants', restaurantId)
  const sectionRef = doc(restaurantRef, 'menus', sectionId)

  const optionGroups = values.optionGroups
    .filter((group) => group.title.trim().length > 0)
    .map((group) => ({
      title: group.title,
      isRequired: group.isRequired,
      minSelections: Number(group.minSelections) || 0,
      maxSelections: Number(group.maxSelections) || 1,
      choices: group.choices
        .filter((choice) => choice.label.trim().length > 0)
        .map((choice) => ({
          label: choice.label,
          priceDelta: Number(choice.priceDelta) || 0,
        })),
    }))

  const payload = {
    title: values.title,
    order: Number(values.order) || 0,
    items: values.items.map((item) => ({
      name: item.name,
      basePrice: Number(item.basePrice) || 0,
      description: item.description,
      optionGroups,
    })),
    updatedAt: serverTimestamp(),
  }

  await updateDoc(sectionRef, payload)
}

export const deleteMenuSection = async (restaurantId: string, sectionId: string) => {
  const sectionRef = doc(firestore, 'restaurants', restaurantId, 'menus', sectionId)
  await deleteDoc(sectionRef)
}

const normalizeTimestamp = (value: unknown): string | null => {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString()
  }
  if (typeof value === 'string') {
    return value
  }
  return null
}

export const fetchRestaurants = async (): Promise<RestaurantRecord[]> => {
  const snapshot = await getDocs(collection(firestore, 'restaurants'))
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      name: data.name ?? '이름 없음',
      tags: data.tags ?? [],
      categories: data.categories ?? [],
      primaryCategory: data.primaryCategory ?? '',
      services: data.services ?? [],
      area: data.area ?? '',
      deliveryEta: data.deliveryEta ?? '',
      minOrderPrice: data.minOrderPrice ?? 0,
      deliveryFee: data.deliveryFee ?? 0,
      createdAt: normalizeTimestamp(data.createdAt),
      phoneNumber: data.phoneNumber ?? '',
      address: data.address ?? '',
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    }
  })
}

export const fetchMenuSections = async (
  restaurantId: string,
): Promise<MenuSectionRecord[]> => {
  const ref = collection(firestore, 'restaurants', restaurantId, 'menus')
  const snapshot = await getDocs(query(ref, orderBy('order', 'asc')))
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      restaurantId,
      title: data.title ?? '제목 없음',
      order: data.order ?? 0,
      items: Array.isArray(data.items)
        ? data.items.map((item) => ({
            name: item.name ?? '아이템',
            basePrice: item.basePrice ?? 0,
            description: item.description ?? '',
            optionGroups: item.optionGroups ?? [],
          }))
        : [],
      updatedAt: normalizeTimestamp(data.updatedAt),
    }
  })
}
