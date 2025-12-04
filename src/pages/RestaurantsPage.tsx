import { useState } from 'react'
import { RestaurantForm } from '../components/forms/RestaurantForm'
import { RestaurantList } from '../components/lists/RestaurantList'
import { DeliveryEstimator } from '../components/location/DeliveryEstimator'
import { DeliveryRangePreview } from '../components/location/DeliveryRangePreview'
import { HelpSection } from '../components/layout/HelpSection'
import type { RestaurantRecord } from '../types/restaurants'
import { useStoreContext } from '../providers/StoreProvider'
import { useRestaurants } from '../hooks/useRestaurants'

const onboardingTips = [
  '가게 소개글과 대표 사진을 먼저 채우면 손님에게 더 잘 보입니다.',
  '태그와 지역을 적어두면 앱에서 검색이 쉬워집니다.',
  '배달비·최소 주문 금액은 언제든지 수정 가능합니다.',
]

export const RestaurantsPage = () => {
  const { ownedStoreIds } = useStoreContext()
  const { data: restaurants } = useRestaurants(ownedStoreIds)
  const [editTarget, setEditTarget] = useState<RestaurantRecord | null>(null)

  const handleSelect = (restaurantId: string) => {
    const target = restaurants?.find((r) => r.id === restaurantId) ?? null
    setEditTarget(target)
  }

  const handleReset = () => setEditTarget(null)

  return (
    <div className="panel column">
      <HelpSection
        eyebrow="가게 관리 도움말"
        title="정보를 자주 바꾸는 항목부터 입력해보세요"
        description="가게 소개, 대표 사진, 주소·계좌만 입력해도 앱에 노출됩니다."
        tips={onboardingTips}
        imageUrls={[
          'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=60',
        ]}
      />
      <RestaurantForm editTarget={editTarget} onComplete={handleReset} />
      <RestaurantList onSelect={handleSelect} allowedStoreIds={ownedStoreIds} />
      <DeliveryEstimator allowedStoreIds={ownedStoreIds} />
      <DeliveryRangePreview allowedStoreIds={ownedStoreIds} />
    </div>
  )
}
