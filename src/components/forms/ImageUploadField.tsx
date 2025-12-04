import { useState } from 'react'
import { uploadRestaurantAsset } from '../../services/storage'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
}

export const ImageUploadField = ({ label, value, onChange, folder }: ImageUploadFieldProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const result = await uploadRestaurantAsset(file, folder)
      onChange(result.url)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('업로드에 실패했습니다.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <label>
        {label}
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://"
        />
      </label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
      <p className="helper">{isUploading ? '업로드 중…' : '컴퓨터에서 직접 선택할 수도 있습니다.'}</p>
      {error && <p className="state__error">{error}</p>}
    </div>
  )
}
