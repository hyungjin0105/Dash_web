import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type {
  FeedbackFormValues,
  FeedbackRecord,
  FeedbackStatus,
} from '../types/feedback'

const normalizeTimestamp = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate().toLocaleString()
  if (typeof value === 'string') return value
  return null
}

export const createFeedback = async (values: FeedbackFormValues) => {
  await addDoc(collection(firestore, 'customerFeedback'), {
    customerName: values.customerName,
    contact: values.contact,
    channel: values.channel,
    issueType: values.issueType,
    message: values.message,
    orderId: values.orderId ?? '',
    status: '접수됨' as FeedbackStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateFeedback = async (
  id: string,
  updates: { status?: FeedbackStatus; assignee?: string; lastResponse?: string },
) => {
  const ref = doc(firestore, 'customerFeedback', id)
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export const fetchFeedback = async (): Promise<FeedbackRecord[]> => {
  const snapshot = await getDocs(
    query(collection(firestore, 'customerFeedback'), orderBy('createdAt', 'desc')),
  )
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      customerName: data.customerName ?? '고객',
      contact: data.contact ?? '',
      channel: data.channel ?? '앱',
      issueType: data.issueType ?? '기타',
      message: data.message ?? '',
      status: data.status ?? '접수됨',
      assignee: data.assignee ?? '',
      lastResponse: data.lastResponse ?? '',
      orderId: data.orderId ?? '',
      createdAt: normalizeTimestamp(data.createdAt),
      updatedAt: normalizeTimestamp(data.updatedAt),
    }
  })
}
