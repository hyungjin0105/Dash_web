import { HelpSection } from '../components/layout/HelpSection'
import { PromotionForm } from '../components/forms/PromotionForm'
import { PromotionList } from '../components/lists/PromotionList'

const tips = [
  '앱 홈 + 푸시 조합을 활용하면 신규 고객 전환율이 높습니다.',
  '프로모션 기간과 재고 일정을 함께 계획하세요.',
  '쿠폰 오남용을 막기 위해 대상 고객 메모를 남겨주세요.',
]

export const PromotionsPage = () => (
  <div className="panel column">
    <HelpSection
      eyebrow="프로모션 센터"
      title="쿠폰과 이벤트를 한번에 운영하세요"
      description="할인 조건과 노출 채널을 정리하고 실행 현황을 추적할 수 있습니다."
      tips={tips}
      imageUrls={[
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=60',
      ]}
    />
    <PromotionForm />
    <PromotionList />
  </div>
)
