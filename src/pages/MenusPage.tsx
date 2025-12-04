import { useState } from 'react'
import { MenuSectionForm } from '../components/forms/MenuSectionForm'
import { MenuSectionList } from '../components/lists/MenuSectionList'
import { HelpSection } from '../components/layout/HelpSection'
import type { MenuSectionRecord } from '../types/restaurants'
import { useStoreContext } from '../providers/StoreProvider'

const menuTips = [
  '섹션을 나누면 손님이 원하는 메뉴를 더 빨리 찾습니다.',
  '세트/사이드 메뉴도 같은 화면에서 한 번에 관리할 수 있습니다.',
  '옵션 그룹을 켜면 맵기, 곱빼기 등 선택지를 간단히 추가할 수 있습니다.',
]

export const MenusPage = () => {
  const [editTarget, setEditTarget] = useState<MenuSectionRecord | null>(null)
  const { ownedStoreIds } = useStoreContext()

  return (
    <div className="panel column">
      <HelpSection
        eyebrow="메뉴 관리 도움말"
        title="보기 좋은 메뉴, 주문이 빨라집니다"
        description="카테고리 → 메뉴 → 옵션 순서대로 입력하면 앱에도 그대로 반영됩니다."
        tips={menuTips}
        imageUrls={[
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60',
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=401&q=60',
        ]}
      />
      <MenuSectionForm
        editTarget={editTarget}
        onComplete={() => setEditTarget(null)}
        allowedStoreIds={ownedStoreIds}
      />
      <MenuSectionList onSelect={setEditTarget} allowedStoreIds={ownedStoreIds} />
    </div>
  )
}
