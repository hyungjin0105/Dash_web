import { useEffect, useRef, useState } from 'react'
import { ensureNaverMaps } from '../../utils/naverMapsLoader'

export interface PartnerMarker {
  id: string
  name: string
  lat: number
  lng: number
  benefit: string
}

interface Props {
  partners: PartnerMarker[]
}

export const DashStreetMap = ({ partners }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!partners.length) {
      return
    }

    let mapInstance: any
    let naverInstance: typeof window.naver | null = null
    const markerHandles: Array<{ marker: any; info: any }> = []

    ensureNaverMaps()
      .then((naver) => {
        if (!containerRef.current) {
          throw new Error('지도를 초기화할 DOM 컨테이너를 찾지 못했습니다.')
        }
        naverInstance = naver

        const { lat, lng } = partners[0]
        const center = new naver.maps.LatLng(lat, lng)

        mapInstance = new naver.maps.Map(containerRef.current, {
          center,
          zoom: 13,
          zoomControl: false,
          mapDataControl: false,
          scaleControl: false,
        })

        const bounds = new naver.maps.LatLngBounds()

        partners.forEach((partner) => {
          const position = new naver.maps.LatLng(partner.lat, partner.lng)
          bounds.extend(position)
          const marker = new naver.maps.Marker({
            position,
            map: mapInstance,
            title: partner.name,
          })

          const info = new naver.maps.InfoWindow({
            content: [
              '<div style="padding:8px 10px; min-width:160px;">',
              `<strong style="display:block; margin-bottom:4px;">${partner.name}</strong>`,
              `<p style="margin:0; font-size:12px; color:#475569;">${partner.benefit}</p>`,
              '</div>',
            ].join(''),
          })

          naver.maps.Event.addListener(marker, 'click', () => {
            info.open(mapInstance, marker)
          })

          markerHandles.push({ marker, info })
        })

        if (!bounds.isEmpty()) {
          mapInstance.fitBounds(bounds)
        }
      })
      .catch((err: Error) => {
        console.error(err)
        setError(err.message)
      })

    return () => {
      markerHandles.forEach(({ marker, info }) => {
        info.close()
        marker.setMap(null)
      })
      if (mapInstance && naverInstance) {
        naverInstance.maps.Event.clearInstanceListeners(mapInstance)
      }
    }
  }, [partners])

  if (error) {
    return (
      <div className="dash-street__map dash-street__map--error">
        <p className="state__error">{error}</p>
        <p className="helper">환경변수와 허용된 도메인을 다시 확인해주세요.</p>
      </div>
    )
  }

  return <div ref={containerRef} className="dash-street__map" />
}
