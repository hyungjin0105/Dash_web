import { useEffect, useMemo, useState } from 'react'
import { useRestaurants } from '../../hooks/useRestaurants'
import { haversineDistanceKm } from '../../utils/geo'

export const DeliveryRangePreview = ({ allowedStoreIds }: { allowedStoreIds: string[] }) => {
  const { data: restaurants } = useRestaurants(allowedStoreIds)
  const [userLat, setUserLat] = useState('')
  const [userLng, setUserLng] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude.toFixed(6))
        setUserLng(position.coords.longitude.toFixed(6))
      },
      () => {},
    )
  }, [])

  const inRange = useMemo(() => {
    const lat = Number(userLat)
    const lng = Number(userLng)
    if (!restaurants || Number.isNaN(lat) || Number.isNaN(lng)) return []

    return restaurants
      .map((r) => {
        const distance =
          typeof r.latitude === 'number' && typeof r.longitude === 'number'
            ? haversineDistanceKm(lat, lng, r.latitude, r.longitude)
            : null
        const withinRange =
          typeof r.deliveryRangeKm === 'number' && distance !== null
            ? distance <= r.deliveryRangeKm
            : false
        return { ...r, distance, withinRange }
      })
      .filter((r) => r.withinRange)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }, [restaurants, userLat, userLng])

  return (
    <div className="panel panel--sub">
      <header>
        <p className="eyebrow">배달 가능 매장</p>
        <h3>고객 위치 기준 정렬</h3>
        <p className="helper">대략적인 거리 계산(Haversine)으로 배달 가능 매장만 보여줍니다.</p>
      </header>
      <div className="form form--inline">
        <div className="form__grid">
          <label>
            고객 위도
            <input value={userLat} onChange={(event) => setUserLat(event.target.value)} />
          </label>
          <label>
            고객 경도
            <input value={userLng} onChange={(event) => setUserLng(event.target.value)} />
          </label>
        </div>
        {inRange.length === 0 ? (
          <p className="muted">배달 가능 범위에 있는 매장이 없습니다.</p>
        ) : (
          <ul className="checklist">
            {inRange.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong>
                <span className="muted">
                  {r.distance?.toFixed(2)} km · 최소주문 {r.minOrderPrice?.toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
