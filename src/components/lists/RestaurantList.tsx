import { useMemo, useState, useEffect } from 'react'
import { deleteRestaurant } from '../../services/restaurants'
import { useQueryClient } from '@tanstack/react-query'
import { useRestaurants } from '../../hooks/useRestaurants'

export type RestaurantListSelectHandler = (restaurantId: string) => void

export const RestaurantList = ({
  onSelect,
  allowedStoreIds,
}: {
  onSelect: RestaurantListSelectHandler
  allowedStoreIds: string[]
}) => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useRestaurants(allowedStoreIds)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 5

  useEffect(() => {
    setPage(0)
  }, [search])

  const filtered = useMemo(() => {
    if (!data) return []
    if (!search) return data
    const keyword = search.toLowerCase()
    return data.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(keyword) ||
        restaurant.tags?.some((tag) => tag.toLowerCase().includes(keyword)) ||
        restaurant.categories?.some((category) => category.toLowerCase().includes(keyword)),
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData = filtered.slice(page * pageSize, page * pageSize + pageSize)

  const handleDelete = async (id: string) => {
    const ok = window.confirm('매장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!ok) return
    await deleteRestaurant(id)
    queryClient.invalidateQueries({ queryKey: ['restaurants'] })
  }

  return (
    <div className="panel panel--sub">
      <h3>등록된 매장</h3>
      <div className="list-controls">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="이름 또는 태그 검색"
        />
        <div className="muted">
          총 {filtered.length}/{data?.length ?? 0}개 · 페이지 {page + 1}/{totalPages}
        </div>
      </div>
      {isLoading && <p>불러오는 중…</p>}
      {isError && <p className="state__error">불러오기에 실패했습니다.</p>}
      {!isLoading && data && data.length === 0 && <p>아직 저장된 매장이 없습니다.</p>}
      {data && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>카테고리</th>
                <th>태그</th>
                <th>서비스</th>
                <th>연락처</th>
                <th>주소</th>
                <th>최소 주문 금액</th>
                <th>배달비</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td>
                    <strong>{restaurant.name}</strong>
                    <p className="muted">{restaurant.area}</p>
                  </td>
                  <td>{restaurant.categories?.join(', ') || '-'}</td>
                  <td>{restaurant.tags?.join(', ') || '-'}</td>
                  <td>{restaurant.services?.join(', ') || '-'}</td>
                  <td>{restaurant.phoneNumber || '-'}</td>
                  <td>{restaurant.address || '-'}</td>
                  <td>
                    {typeof restaurant.minOrderPrice === 'number'
                      ? `₩${restaurant.minOrderPrice.toLocaleString()}`
                      : '-'}
                  </td>
                  <td>
                    {typeof restaurant.deliveryFee === 'number'
                      ? `₩${restaurant.deliveryFee.toLocaleString()}`
                      : '-'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={() => onSelect(restaurant.id)}
                    >
                      불러오기
                    </button>
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={() => handleDelete(restaurant.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="list-controls">
            <button
              type="button"
              className="button-ghost"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
            >
              ← 이전
            </button>
            <button
              type="button"
              className="button-ghost"
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page + 1 >= totalPages}
            >
              다음 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
