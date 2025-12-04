import { useEffect, useState } from 'react'
import { useRestaurants } from '../../hooks/useRestaurants'
import { fetchDrivingDirections } from '../../services/naver'

const metersToKm = (meters: number) => (meters / 1000).toFixed(2)
const secondsToMinutes = (seconds: number) => Math.round(seconds / 60)

export const DeliveryEstimator = ({ allowedStoreIds }: { allowedStoreIds: string[] }) => {
  const { data: restaurants } = useRestaurants(allowedStoreIds)
  const [restaurantId, setRestaurantId] = useState('')
  const [userLat, setUserLat] = useState('')
  const [userLng, setUserLng] = useState('')
  const [result, setResult] = useState<{
    distance: string
    duration: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude.toFixed(6))
        setUserLng(position.coords.longitude.toFixed(6))
      },
      () => {
        // ignore permission denial
      },
    )
  }, [])

  const handleEstimate = async () => {
    setError(null)
    setResult(null)

    const restaurant = restaurants?.find((r) => r.id === restaurantId)
    if (!restaurant || !restaurant.latitude || !restaurant.longitude) {
      setError('매장 위치 정보를 찾을 수 없습니다.')
      return
    }
    const lat = Number(userLat)
    const lng = Number(userLng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('고객 위치 좌표를 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const summary = await fetchDrivingDirections({
        start: { lat, lng },
        goal: { lat: restaurant.latitude ?? 0, lng: restaurant.longitude ?? 0 },
        option: 'trafast',
      })
      setResult({
        distance: `${metersToKm(summary.distanceMeters)} km`,
        duration: `${secondsToMinutes(summary.durationSeconds)} 분`,
      })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('경로 계산 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel panel--sub">
      <header>
        <p className="eyebrow">배달 범위 테스트</p>
        <h3>거리 · 예상 시간 확인</h3>
        <p className="helper">
          고객 위치(좌표)를 입력하고 매장을 선택하면 네이버 경로 API로 ETA를 계산합니다.
        </p>
      </header>
      <div className="form form--inline">
        <div className="form__grid">
          <label>
            고객 위도
            <input
              value={userLat}
              onChange={(event) => setUserLat(event.target.value)}
              placeholder="37.5665"
            />
          </label>
          <label>
            고객 경도
            <input
              value={userLng}
              onChange={(event) => setUserLng(event.target.value)}
              placeholder="126.9780"
            />
          </label>
          <label>
            매장 선택
            <select value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)}>
              <option value="">선택하세요</option>
              {restaurants?.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" onClick={handleEstimate} disabled={loading}>
          {loading ? '계산 중…' : '거리 계산'}
        </button>
        {result && (
          <p className="form__message">
            대략 {result.distance} · 약 {result.duration} 소요
          </p>
        )}
        {error && <p className="state__error">{error}</p>}
      </div>
    </div>
  )
}
