import {
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { auth, firestore } from '../lib/firebase'

export const deleteOwnerAccount = async (email: string) => {
  const q = query(collection(firestore, 'storeOwners'), where('email', '==', email))
  const snapshot = await getDocs(q)
  const batchDeletes = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref))
  await Promise.all(batchDeletes)

  const user = auth.currentUser
  if (user && user.email === email) {
    await user.delete()
  }
}
