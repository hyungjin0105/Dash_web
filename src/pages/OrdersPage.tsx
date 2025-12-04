import { OrderForm } from '../components/forms/OrderForm'
import { OrderList } from '../components/lists/OrderList'
import { HelpSection } from '../components/layout/HelpSection'
import { useStoreContext } from '../providers/StoreProvider'

const tips = [
  '전화 주문을 바로 입력해 두면 배달 기사님께도 자동으로 공유됩니다.',
  '상태를 변경하면 고객 앱에도 곧바로 알림이 전송됩니다.',
  '필터를 이용해 배달/포장 주문을 나눠볼 수 있습니다.',
]

export const OrdersPage = () => (
  <div className="panel column">
    <HelpSection
      eyebrow="주문 현황"
      title="실시간으로 주문을 확인하세요"
      description="검색과 상태 변경이 한 화면에서 가능합니다."
      tips={tips}
      imageUrls={[
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=60',
      ]}
    />
    <FakeQrPanel />
    <OrderForm />
    <OrderList />
  </div>
)

const FakeQrPanel = () => {
  const { stores, selectedStoreId } = useStoreContext()
  const storeOptions = stores.filter((store) => store.id !== 'all')
  const targets =
    selectedStoreId === 'all'
      ? storeOptions
      : storeOptions.filter((store) => store.id === selectedStoreId)

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      alert('링크가 복사되었습니다.')
    } catch (error) {
      alert('복사에 실패했습니다. 수동으로 복사해주세요.')
    }
  }

  if (storeOptions.length === 0) {
    return null
  }

  return (
    <section className="panel panel--sub qr-panel">
      <header>
        <p className="eyebrow">QR 주문 · 웹 주문서</p>
        <h2>파일럿용 가짜 주문 링크</h2>
        <p className="helper">
          실제 QR 연동 전까지는 아래 링크와 이미지를 사용해 시뮬레이션 주문을 받으실 수 있습니다. 링크는
          공유용이며, 주문 데이터는 데모용으로 저장됩니다.
        </p>
      </header>
      <div className="qr-grid">
        {targets.map((store) => {
          const fakeUrl = `https://silo.app/demo-order/${store.id}`
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(fakeUrl)}`
          return (
            <article key={store.id} className="qr-card">
              <h3>{store.name}</h3>
              <img src={qrSrc} alt={`${store.name} QR`} loading="lazy" />
              <p className="muted">{fakeUrl}</p>
              <div className="qr-card__actions">
                <button type="button" className="ghost-btn" onClick={() => copyLink(fakeUrl)}>
                  링크 복사
                </button>
                <button type="button" className="ghost-btn" onClick={() => window.open(fakeUrl, '_blank')}>
                  미리보기
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
