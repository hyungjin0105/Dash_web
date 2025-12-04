import { useMemo, useState } from 'react'
import { useOrderStats } from '../hooks/useOrderStats'
import { useLoyaltyInsights } from '../hooks/useLoyaltyInsights'
import type { LoyaltySegment } from '../hooks/useLoyaltyInsights'
import { useStoreContext } from '../providers/StoreProvider'
import { DashStreetMap } from '../components/dashboard/DashStreetMap'
import { useDashboardContent } from '../hooks/useDashboardContent'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { downloadCsv } from '../utils/downloadCsv'

const formatCurrency = (value: number) => `₩${value.toLocaleString()}`

const formatAxisValue = (value: number, metric: 'count' | 'amount') => {
  if (metric === 'count') {
    return value.toLocaleString()
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`
  }
  return value.toLocaleString()
}

const formatDeltaLabel = (value: number | null) => {
  if (value === null) return '기준 없음'
  const arrow = value >= 0 ? '▲ +' : '▼ '
  return `${arrow}${Math.abs(value).toFixed(1)}%`
}

type SelectedCustomer = {
  segment: 'likely' | 'atRisk'
  data: LoyaltySegment
}

export const DashboardPage = () => {
  const { selectedStoreId, stores } = useStoreContext()
  const storeFilter = selectedStoreId === 'all' ? undefined : selectedStoreId
  const { data, isLoading, isError } = useOrderStats(storeFilter)
  const {
    data: loyalty,
    isLoading: loyaltyLoading,
    isError: loyaltyError,
  } = useLoyaltyInsights(storeFilter)
  const {
    content: dashboardContent,
    isLoading: dashboardContentLoading,
    isError: dashboardContentError,
  } = useDashboardContent()
  const currentStoreLabel =
    stores.find((store) => store.id === selectedStoreId)?.name ?? '전체 매장'
  const [chartMetric, setChartMetric] = useState<'count' | 'amount'>('count')
  const [selectedCustomer, setSelectedCustomer] = useState<{
    segment: 'likely' | 'atRisk'
    data: LoyaltySegment
  } | null>(null)
  const menuHighlights =
    dashboardContent.menuHighlights.length > 0
      ? dashboardContent.menuHighlights
      : ['추천 문구를 추가해주세요.']
  const partnerStores = dashboardContent.partnerStores
  const partnerMarkers = partnerStores
    .filter((partner) => typeof partner.lat === 'number' && typeof partner.lng === 'number')
    .map((partner) => ({
      id: partner.id,
      name: partner.name,
      benefit: partner.benefit ?? '제휴 혜택 준비중',
      lat: partner.lat as number,
      lng: partner.lng as number,
    }))

  const formatPartnerDistance = (store: (typeof partnerStores)[number]) => {
    if (store.distanceLabel) return store.distanceLabel
    if (typeof store.distanceKm === 'number') {
      return `${store.distanceKm.toFixed(1)}km`
    }
    return '거리 계산 중'
  }

  const weeklySummary = useMemo(() => {
    if (!data || data.entries.length === 0) return null

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const currentStart = new Date(today)
    currentStart.setDate(currentStart.getDate() - 6)
    const prevEnd = new Date(currentStart)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - 6)

    const inRange = (entryDate: Date, start: Date, end: Date) =>
      entryDate.getTime() >= start.getTime() && entryDate.getTime() <= end.getTime()
    const parseDate = (value: string) => new Date(`${value}T00:00:00`)
    const sumRange = (start: Date, end: Date, key: 'count' | 'totalAmount') =>
      data.entries.reduce((sum, entry) => {
        const entryDate = parseDate(entry.dateKey)
        if (inRange(entryDate, start, end)) {
          return sum + entry[key]
        }
        return sum
      }, 0)

    const current = {
      count: sumRange(currentStart, today, 'count'),
      amount: sumRange(currentStart, today, 'totalAmount'),
    }
    const previous = {
      count: sumRange(prevStart, prevEnd, 'count'),
      amount: sumRange(prevStart, prevEnd, 'totalAmount'),
    }

    const change = {
      count:
        previous.count === 0 ? null : ((current.count - previous.count) / previous.count) * 100,
      amount:
        previous.amount === 0
          ? null
          : ((current.amount - previous.amount) / previous.amount) * 100,
    }

    return { current, previous, change }
  }, [data])

  const handleExportOrders = () => {
    if (!data || data.entries.length === 0) {
      alert('내보낼 주문 데이터가 없습니다.')
      return
    }
    downloadCsv(`orders_${selectedStoreId}.csv`, [
      ...data.entries.map((entry) => ({
        date: entry.dateKey,
        orderCount: entry.count,
        totalAmount: entry.totalAmount,
      })),
    ])
  }

  const handleExportSegments = () => {
    if (!loyalty) {
      alert('단골 데이터를 불러온 후 다시 시도해주세요.')
      return
    }
    const rows = [
      ...loyalty.likelyReturning.map((customer) => ({
        segment: 'likelyReturning',
        name: customer.name,
        visits: customer.visits,
        lastVisit: customer.lastVisitLabel,
        favorite: customer.favorite ?? '',
      })),
      ...loyalty.atRisk.map((customer) => ({
        segment: 'atRisk',
        name: customer.name,
        visits: customer.visits,
        lastVisit: customer.lastVisitLabel,
        favorite: customer.favorite ?? '',
      })),
    ]
    downloadCsv(`customer_segments_${selectedStoreId}.csv`, rows)
  }

  const handlePartnerAction = (
    partnerName: string,
    action: 'invite' | 'benefit',
  ) => {
    const message =
      action === 'invite'
        ? `${partnerName}에 제휴 초대 메시지를 보냈다고 가정합니다. 실제 API가 연결되면 Firestore에서 상태를 업데이트하세요.`
        : `${partnerName}와 연결 혜택을 생성했습니다. 혜택 내용은 CRM/쿠폰 메뉴에서 수정할 수 있도록 연동 예정입니다.`
    alert(message)
  }

  return (
    <>
      <div className="panel column">
      <section className="panel panel--sub">
        <header>
          <p className="eyebrow">오늘의 통계</p>
          <h2>실시간 매장 현황</h2>
          <p className="helper">
            주문 데이터는 Firestore `orders` 컬렉션 기준이며, 선택된 매장: {currentStoreLabel}
          </p>
        </header>
        {isLoading && <p>불러오는 중…</p>}
        {isError && <p className="state__error">통계를 불러오지 못했습니다.</p>}
        {data && (
          <div className="grid two-column">
            <div>
              <p className="eyebrow">누적 주문 수</p>
              <h2>{data.totalOrders.toLocaleString()}건</h2>
            </div>
            <div>
              <p className="eyebrow">총 주문 금액</p>
              <h2>₩{data.totalAmount.toLocaleString()}</h2>
            </div>
          </div>
        )}
      </section>
      <section className="panel panel--sub">
        <header>
          <p className="eyebrow">Dash 거리 지도</p>
          <h2>근처 제휴 매장을 한눈에</h2>
          <p className="helper">단골이 동네 안에서 자연스럽게 이동하도록 파트너 혜택을 설계해보세요.</p>
        </header>
        {dashboardContentLoading && <p>제휴 매장을 불러오는 중…</p>}
        {dashboardContentError && (
          <p className="state__error">
            제휴 매장 데이터를 가져오지 못했습니다. Firestore `dashboardContent/global` 문서를 확인해주세요.
          </p>
        )}
        <div className="dash-street">
          {partnerMarkers.length > 0 ? (
            <DashStreetMap partners={partnerMarkers} />
          ) : (
            <div className="dash-street__map dash-street__map--error">
              <p>표시할 제휴 매장이 없습니다.</p>
              <p className="helper">Firestore dashboardContent/global.partnerStores 에 매장을 추가해주세요.</p>
            </div>
          )}
          <div className="dash-street__list">
            {partnerStores.length === 0 && (
              <p className="helper">등록된 제휴 매장이 없습니다. 목록을 채우면 여기서 확인할 수 있어요.</p>
            )}
            {partnerStores.map((partner) => (
              <article key={partner.id}>
                <div>
                  <p className="eyebrow">{partner.area ?? '지역 미지정'}</p>
                  <h3>{partner.name}</h3>
                  <p className="muted">{formatPartnerDistance(partner)}</p>
                </div>
                <p className="helper">{partner.benefit ?? '혜택 내용을 입력해주세요.'}</p>
                <div className="partner-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handlePartnerAction(partner.name, 'invite')}
                  >
                    제휴 초대
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handlePartnerAction(partner.name, 'benefit')}
                  >
                    연결 혜택 만들기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="panel panel--sub">
        <header>
          <p className="eyebrow">주문 추이</p>
          <h2>최근 주문 흐름</h2>
          <p className="helper">일별 주문 수와 매출을 오가며 변화를 비교해보세요.</p>
        </header>
        <div className="panel-controls">
          <div className="chart-toggle" role="group" aria-label="주문 지표 토글">
            <button
              type="button"
              className={chartMetric === 'count' ? 'is-active' : ''}
              onClick={() => setChartMetric('count')}
            >
              주문 수
            </button>
            <button
              type="button"
              className={chartMetric === 'amount' ? 'is-active' : ''}
              onClick={() => setChartMetric('amount')}
            >
              총 매출
            </button>
          </div>
          <button type="button" className="ghost-btn" onClick={handleExportOrders}>
            주문 CSV 내보내기
          </button>
        </div>
        {isLoading && <p>그래프를 불러오는 중…</p>}
        {isError && <p className="state__error">주문 데이터를 불러오지 못했습니다.</p>}
        {data && data.entries.length > 0 ? (
          <>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.entries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dateKey" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={8} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    width={60}
                    tickFormatter={(value: number) => formatAxisValue(value, chartMetric)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}
                    formatter={(value: number) =>
                      chartMetric === 'count'
                        ? [`${value.toLocaleString()}건`, '주문 수']
                        : [formatCurrency(value), '총 매출']
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetric === 'count' ? 'count' : 'totalAmount'}
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#ordersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {weeklySummary && (
              <div className="weekly-summary">
                <p>
                  최근 7일{' '}
                  <strong>
                    {chartMetric === 'count'
                      ? `${weeklySummary.current.count.toLocaleString()}건`
                      : formatCurrency(weeklySummary.current.amount)}
                  </strong>
                </p>
                <p>
                  이전 7일 대비{' '}
                  <strong
                    className={
                      weeklySummary.change[chartMetric] == null
                        ? ''
                        : weeklySummary.change[chartMetric]! >= 0
                          ? 'trend-positive'
                          : 'trend-negative'
                    }
                  >
                    {formatDeltaLabel(weeklySummary.change[chartMetric])}
                  </strong>
                </p>
              </div>
            )}
          </>
        ) : (
          !isLoading && <p className="helper">표시할 주문 데이터가 없습니다.</p>
        )}
      </section>
      <section className="panel panel--sub">
        <header>
          <p className="eyebrow">단골 인사이트</p>
          <h2>재방문 트래커</h2>
          <p className="helper">전화번호나 고객명 기준으로 30일 이내 단골 행동을 분류합니다.</p>
        </header>
        <div className="panel-actions">
          <button type="button" className="ghost-btn" onClick={handleExportSegments}>
            단골 CSV 내보내기
          </button>
        </div>
        {loyaltyLoading && <p>단골 데이터를 불러오는 중…</p>}
        {loyaltyError && <p className="state__error">단골 지표를 계산하지 못했습니다.</p>}
        {loyalty && (
          <>
            <div className="metric-grid">
              <article className="metric-card">
                <p className="eyebrow">지난 30일 재방문율</p>
                <h2>{loyalty.returningRate.toFixed(1)}%</h2>
                <p className={`metric-trend ${loyalty.returningChange >= 0 ? 'trend-positive' : 'trend-negative'}`}>
                  {loyalty.returningChange >= 0 ? '▲' : '▼'}{' '}
                  {loyalty.returningChange >= 0 ? '+' : ''}
                  {loyalty.returningChange.toFixed(1)}%p
                </p>
              </article>
              <article className="metric-card">
                <p className="eyebrow">오늘 방문한 단골</p>
                <h2>{loyalty.todayReturning}명</h2>
                <p className="helper">
                  전체 단골 {loyalty.activeCustomers}명 중 재방문 {loyalty.repeatCustomers}명
                </p>
              </article>
              <article className="metric-card">
                <p className="eyebrow">평균 방문 주기</p>
                <h2>{loyalty.avgVisitCycle.toFixed(1)}일</h2>
                <p className="helper">모든 단골의 방문 간격 평균값입니다.</p>
              </article>
            </div>
            <div className="segment-grid">
              <article className="segment-card">
                <header>
                  <div>
                    <p className="eyebrow">이번 주 예상 방문</p>
                    <h3>곧 다시 올 단골</h3>
                  </div>
                  <span className="segment-count">{loyalty.likelyReturning.length}명</span>
                </header>
                {loyalty.likelyReturning.length === 0 && (
                  <p className="helper">최근 방문한 단골 데이터가 부족합니다.</p>
                )}
                {loyalty.likelyReturning.length > 0 && (
                  <ul className="segment-list">
                    {loyalty.likelyReturning.map((customer) => (
                      <li key={`${customer.name}-${customer.lastVisitDate}`}>
                        <button
                          type="button"
                          className="segment-list__button"
                          onClick={() =>
                            setSelectedCustomer({ segment: 'likely', data: customer })
                          }
                        >
                          <div>
                            <strong>{customer.name}</strong>
                            <p className="muted">
                              {customer.lastVisitLabel} · 누적 {customer.visits}회
                            </p>
                          </div>
                          <p className="segment-meta">{customer.favorite ?? '대표 메뉴 미등록'}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="segment-card">
                <header>
                  <div>
                    <p className="eyebrow">이탈 위험</p>
                    <h3>90일 이상 미방문</h3>
                  </div>
                  <span className="segment-count">{loyalty.atRisk.length}명</span>
                </header>
                {loyalty.atRisk.length === 0 && (
                  <p className="helper">장기간 방문이 없는 단골이 없습니다.</p>
                )}
                {loyalty.atRisk.length > 0 && (
                  <ul className="segment-list">
                    {loyalty.atRisk.map((customer) => (
                      <li key={`${customer.name}-${customer.lastVisitDate}`}>
                        <button
                          type="button"
                          className="segment-list__button"
                          onClick={() =>
                            setSelectedCustomer({ segment: 'atRisk', data: customer })
                          }
                        >
                          <div>
                            <strong>{customer.name}</strong>
                            <p className="muted">
                              마지막 방문 {customer.lastVisitLabel} · 누적 {customer.visits}회
                            </p>
                          </div>
                          <p className="segment-meta">{customer.favorite ?? '대표 메뉴 미등록'}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </>
        )}
      </section>
      <section className="panel panel--sub">
        <header>
          <p className="eyebrow">운영 힌트</p>
          <h2>오늘의 추천</h2>
        </header>
        {dashboardContentLoading && <p>운영 힌트를 불러오는 중…</p>}
        {dashboardContentError && (
          <p className="state__error">운영 힌트를 가져오지 못했습니다. 기본 문구를 표시합니다.</p>
        )}
        <ul className="pill-list">
          {menuHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
      {selectedCustomer && (
        <CustomerDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </>
  )
}

const CustomerDrawer = ({
  customer,
  onClose,
}: {
  customer: SelectedCustomer
  onClose: () => void
}) => {
  const [note, setNote] = useState('')
  const { data } = customer

  const handleSaveNote = () => {
    if (!note.trim()) {
      alert('메모 내용을 입력해주세요.')
      return
    }
    alert(`임시로 메모를 저장했습니다: ${note}`)
    setNote('')
  }

  return (
    <>
      <div className="customer-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="customer-drawer" role="dialog" aria-labelledby="customer-drawer-title">
        <header className="customer-drawer__header">
          <div>
            <p className="eyebrow">{customer.segment === 'likely' ? '곧 재방문 예상' : '이탈 위험'}</p>
            <h2 id="customer-drawer-title">{data.name}</h2>
            <p className="helper">누적 {data.visits}회 방문 · 마지막 {data.lastVisitLabel}</p>
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            닫기
          </button>
        </header>
        <section className="customer-drawer__section">
          <h3>방문 히스토리</h3>
          <ul className="customer-drawer__history">
            <li>최근 방문: {data.lastVisitDate}</li>
            <li>누적 방문 수: {data.visits}회</li>
            <li>선호 메뉴: {data.favorite ?? '등록된 대표 메뉴 없음'}</li>
          </ul>
        </section>
        <section className="customer-drawer__section">
          <h3>빠른 액션</h3>
          <div className="drawer-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => alert('쿠폰 발송 기능과 연결 예정입니다.')}
            >
              쿠폰 보내기
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => alert('VIP 지정 기능과 연결 예정입니다.')}
            >
              VIP 지정
            </button>
          </div>
        </section>
        <section className="customer-drawer__section">
          <h3>메모</h3>
          <label className="customer-drawer__note">
            <span className="eyebrow">응대 메모</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="예) 3월 이벤트 쿠폰 안내 필요"
            />
          </label>
          <button type="button" className="primary-btn" onClick={handleSaveNote}>
            메모 저장
          </button>
        </section>
      </aside>
    </>
  )
}
