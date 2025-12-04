import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usePromotions } from '../../hooks/usePromotions'
import { deletePromotion, updatePromotionStatus } from '../../services/promotions'
import type { PromotionRecord, PromotionStatus } from '../../types/promotions'
import { useStoreContext } from '../../providers/StoreProvider'

const statusOptions: { value: PromotionStatus; label: string }[] = [
  { value: 'planned', label: '예정' },
  { value: 'active', label: '진행 중' },
  { value: 'ended', label: '종료' },
]

const formatCurrency = (value: number) => `₩${value.toLocaleString()}`

export const PromotionList = () => {
  const { selectedStoreId, ownedStoreIds } = useStoreContext()
  const filteredStoreIds =
    selectedStoreId === 'all'
      ? ownedStoreIds
      : selectedStoreId
        ? [selectedStoreId]
        : []
  const { data, isLoading, isError } = usePromotions(
    filteredStoreIds.length > 0 ? filteredStoreIds : undefined,
  )
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: ({ promotion, status }: { promotion: PromotionRecord; status: PromotionStatus }) =>
      updatePromotionStatus(promotion, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (promotion: PromotionRecord) => deletePromotion(promotion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  })

  const handleDelete = (promotion: PromotionRecord) => {
    if (!window.confirm('선택한 프로모션을 삭제할까요?')) return
    deleteMutation.mutate(promotion)
  }

  return (
    <div className="panel panel--sub">
      <h3>프로모션 현황</h3>
      {filteredStoreIds.length === 0 && (
        <p className="helper">선택된 매장이 없습니다. 매장을 선택하면 해당 매장의 쿠폰과 이벤트가 표시됩니다.</p>
      )}
      {isLoading && <p>불러오는 중…</p>}
      {isError && <p className="state__error">목록을 불러오지 못했습니다.</p>}
      {!isLoading && data && data.length === 0 && <p>등록된 프로모션이 없습니다.</p>}
      {data && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>매장</th>
                <th>프로모션</th>
                <th>기간</th>
                <th>채널</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {data.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <strong>{promo.storeName ?? '매장 미지정'}</strong>
                    <p className="muted">{promo.storeId}</p>
                  </td>
                  <td>
                    <strong>{promo.title}</strong>
                    <p className="muted">{promo.description || '-'}</p>
                    <ul className="pill-list">
                      <li>{promo.promotionKind}</li>
                      <li>
                        {promo.discountKind === 'percent'
                          ? `${promo.discountValue}%`
                          : formatCurrency(promo.discountValue)}
                      </li>
                    </ul>
                    {promo.promotionKind === '쿠폰' && (
                      <div className="promo-meta">
                        <p className="muted">
                          코드: {promo.couponCode || '자동 적용'} · 최소 주문{' '}
                          {formatCurrency(promo.minOrderPrice ?? 0)}
                        </p>
                        <p className="muted">
                          서비스:{' '}
                          {(promo.serviceModes?.length ? promo.serviceModes : ['전체']).join(', ')}
                        </p>
                        {promo.maxRedemptions && (
                          <p className="muted">최대 {promo.maxRedemptions.toLocaleString()}회</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {promo.startDate ?? '-'} ~ {promo.endDate ?? '-'}
                  </td>
                  <td>{promo.channels.join(', ') || '-'}</td>
                  <td>
                    <select
                      value={promo.status}
                      onChange={(event) =>
                        statusMutation.mutate({
                          promotion: promo,
                          status: event.target.value as PromotionStatus,
                        })
                      }
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="button-ghost" onClick={() => handleDelete(promo)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
