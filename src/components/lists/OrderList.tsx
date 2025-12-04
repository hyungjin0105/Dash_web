import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrders } from '../../hooks/useOrders'
import { useStoreContext } from '../../providers/StoreProvider'
import { deleteOrder, updateOrderStatus } from '../../services/orders'
import type { OrderStatus } from '../../types/orders'

const statuses: OrderStatus[] = ['확인 중', '조리 중', '배달 출발', '완료']

export const OrderList = () => {
  const { selectedStoreId, stores } = useStoreContext()
  const filterStore = selectedStoreId === 'all' ? undefined : selectedStoreId
  const { data, isLoading, isError } = useOrders(filterStore)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | '전체'>('전체')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((order) => {
      const matchesStatus = statusFilter === '전체' || order.status === statusFilter
      const keyword = search.toLowerCase()
      const matchesKeyword =
        !keyword ||
        order.customerName.toLowerCase().includes(keyword) ||
        order.phone.toLowerCase().includes(keyword) ||
        order.restaurantName.toLowerCase().includes(keyword)
      return matchesStatus && matchesKeyword
    })
  }, [data, statusFilter, search])

  return (
    <div className="panel panel--sub">
      <div className="list-controls">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="고객명, 매장명 검색"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)}>
          <option value="전체">전체</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {stores.length > 1 && (
          <div className="muted">
            현재 필터: {stores.find((store) => store.id === selectedStoreId)?.name ?? '전체'}
          </div>
        )}
      </div>
      {isLoading && <p>주문을 불러오는 중…</p>}
      {isError && <p className="state__error">주문 목록을 불러오지 못했습니다.</p>}
      {!isLoading && filtered.length === 0 && <p>현재 표시할 주문이 없습니다.</p>}
      {filtered.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>주문 시각</th>
                <th>매장</th>
                <th>고객</th>
                <th>연락처</th>
                <th>금액</th>
                <th>방식</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>{order.createdAt ?? '-'}</td>
                  <td>{order.restaurantName || '-'}</td>
                  <td>
                    <strong>{order.customerName}</strong>
                    {order.notes && <p className="muted">{order.notes}</p>}
                  </td>
                  <td>{order.phone || '-'}</td>
                  <td>₩{order.totalPrice.toLocaleString()}</td>
                  <td>{order.deliveryMethod}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        mutation.mutate({ id: order.id, status: event.target.value as OrderStatus })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={async () => {
                        const ok = window.confirm('이 주문을 삭제하시겠습니까?')
                        if (!ok) return
                        await deleteOrder(order.id)
                        queryClient.invalidateQueries({ queryKey: ['orders'] })
                      }}
                    >
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
