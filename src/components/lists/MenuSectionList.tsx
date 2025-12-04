import { useState } from 'react'
import { useMenuSections } from '../../hooks/useMenuSections'
import { deleteMenuSection } from '../../services/restaurants'
import { useQueryClient } from '@tanstack/react-query'
import type { MenuSectionRecord } from '../../types/restaurants'
import { useRestaurants } from '../../hooks/useRestaurants'

export const MenuSectionList = ({
  onSelect,
  allowedStoreIds,
}: {
  onSelect: (section: MenuSectionRecord) => void
  allowedStoreIds: string[]
}) => {
  const queryClient = useQueryClient()
  const { data: restaurants } = useRestaurants(allowedStoreIds)
  const [restaurantId, setRestaurantId] = useState('')
  const {
    data: sections,
    isLoading,
    isError,
  } = useMenuSections(restaurantId)

  const handleDelete = async (sectionId: string) => {
    const ok = window.confirm('이 메뉴 섹션을 삭제하시겠습니까?')
    if (!ok) return
    await deleteMenuSection(restaurantId, sectionId)
    queryClient.invalidateQueries({ queryKey: ['menu-sections', restaurantId] })
  }

  return (
    <div className="panel panel--sub">
      <div className="menu-section-filter">
        <label>
          매장 선택
          <select
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
          >
            <option value="">선택하세요</option>
            {restaurants?.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!restaurantId && <p>위 매장을 선택하면 해당 메뉴 섹션이 표시됩니다.</p>}
      {restaurantId && isLoading && <p>메뉴를 불러오는 중…</p>}
      {restaurantId && isError && (
        <p className="state__error">메뉴를 불러오는 중 오류가 발생했습니다.</p>
      )}
      {restaurantId && sections && sections.length === 0 && <p>등록된 메뉴 섹션이 없습니다.</p>}
      {restaurantId && sections && sections.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>섹션</th>
                <th>순서</th>
                <th>대표 메뉴</th>
                <th>가격</th>
                <th>수정 시각</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id}>
                  <td>{section.title}</td>
                  <td>{section.order}</td>
                  <td>{section.items?.[0]?.name ?? '-'}</td>
                  <td>
                    {typeof section.items?.[0]?.basePrice === 'number'
                      ? `₩${section.items[0].basePrice.toLocaleString()}`
                      : '-'}
                  </td>
                  <td>{section.updatedAt ?? '-'}</td>
                  <td>
                    <button type="button" className="button-ghost" onClick={() => onSelect(section)}>
                      불러오기
                    </button>
                    <button type="button" className="button-ghost" onClick={() => handleDelete(section.id)}>
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
