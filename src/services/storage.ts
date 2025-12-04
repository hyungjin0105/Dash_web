import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from '../lib/firebase'

export const uploadRestaurantAsset = async (file: File, folder = 'restaurants/uploads') => {
  const sanitizedName = file.name.replace(/\s+/g, '-').toLowerCase()
  const fileRef = ref(storage, `${folder}/${Date.now()}-${sanitizedName}`)
  const uploadTask = uploadBytesResumable(fileRef, file)

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      undefined,
      (error) => reject(error),
      () => resolve(),
    )
  })

  const url = await getDownloadURL(uploadTask.snapshot.ref)
  return { url, path: uploadTask.snapshot.ref.fullPath }
}
