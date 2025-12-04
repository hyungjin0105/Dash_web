import { useEffect, useRef, useState } from 'react'
import { naverMapKeyId } from '../../config/naver'
import { ensureNaverMaps } from '../../utils/naverMapsLoader'

interface LocationPickerProps {
  latitude?: string
  longitude?: string
  onChange: (lat: number, lng: number) => void
}

export const LocationPicker = ({ latitude, longitude, onChange }: LocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!naverMapKeyId) {
      setError('네이버 지도 Key ID(ncpKeyId)가 필요합니다. .env.local을 확인해주세요.')
      return
    }

    let map: any
    let marker: any
    let naverInstance: typeof window.naver | null = null

    ensureNaverMaps()
      .then((naverInstanceResolved) => {
        if (!mapRef.current) {
          throw new Error('네이버 지도 객체를 초기화할 수 없습니다.')
        }

        naverInstance = naverInstanceResolved
        const initialLat = Number(latitude) || 37.5665
        const initialLng = Number(longitude) || 126.978
        const center = new naverInstance.maps.LatLng(initialLat, initialLng)

        map = new naverInstance.maps.Map(mapRef.current, {
          center,
          zoom: 15,
        })

        marker = new naverInstance.maps.Marker({
          position: center,
          map,
        })

        const updatePosition = (latLng: any) => {
          marker.setPosition(latLng)
          onChange(latLng.lat(), latLng.lng())
        }

        naverInstance.maps.Event.addListener(map, 'click', (e: any) => {
          updatePosition(e.coord)
        })

        naverInstance.maps.Event.addListener(map, 'dragend', () => {
          updatePosition(map.getCenter())
        })

        if (navigator.geolocation && (!latitude || !longitude)) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const current = new naverInstance!.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude,
              )
              map.setCenter(current)
              marker.setPosition(current)
              onChange(current.lat(), current.lng())
            },
            () => {
              // ignore if permission denied
            },
          )
        }
      })
      .catch((err: Error) => {
        setError(err.message)
      })

    return () => {
      if (map && naverInstance) {
        naverInstance.maps.Event.clearInstanceListeners(map)
      }
      if (marker) {
        marker.setMap(null)
      }
    }
  }, [latitude, longitude, onChange])

  return (
    <div className="location-picker">
      <div className="location-picker__map">
        {error ? (
          <div className="location-picker__fallback">
            <p className="state__error">{error}</p>
            <p className="helper">
              네이버 콘솔에 현재 접속 URL(예: http://localhost:5173~5175)을 모두 등록했는지 확인하세요.
            </p>
          </div>
        ) : (
          <div ref={mapRef} className="location-picker__canvas" />
        )}
      </div>
      <p className="helper">지도에서 한 번 클릭하거나 드래그하면 좌표가 자동으로 입력됩니다.</p>
    </div>
  )
}
