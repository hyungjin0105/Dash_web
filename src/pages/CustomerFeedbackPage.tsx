import { HelpSection } from '../components/layout/HelpSection'
import { CustomerFeedbackForm } from '../components/forms/CustomerFeedbackForm'
import { CustomerFeedbackList } from '../components/lists/CustomerFeedbackList'

const tips = [
  '주문번호를 함께 적어두면 앱/라이더 기록과 빠르게 매칭할 수 있습니다.',
  '처리 상태를 업데이트하면 고객 응대 속도를 추적할 수 있습니다.',
  '반복되는 이슈는 플레이북으로 정리해두세요.',
]

export const CustomerFeedbackPage = () => (
  <div className="panel column">
    <HelpSection
      eyebrow="고객 피드백"
      title="고객 문의와 문제를 한 곳에서"
      description="채널에 상관없이 접수된 문의를 기록하고 담당자를 지정하세요."
      tips={tips}
      imageUrls={[
        'https://images.unsplash.com/photo-1525184992441-2b3c12eab6df?auto=format&fit=crop&w=800&q=60',
      ]}
    />
    <CustomerFeedbackForm />
    <CustomerFeedbackList />
  </div>
)
