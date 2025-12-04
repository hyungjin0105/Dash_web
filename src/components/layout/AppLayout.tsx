import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { AdminUser } from '../../providers/AuthProvider'
import clsx from 'clsx'
import { useStoreContext } from '../../providers/StoreProvider'
import { deleteOwnerAccount } from '../../services/storeOwners'

const navItems = [
  { label: '홈', path: '/dashboard' },
  { label: '매장 정보', path: '/restaurants' },
  { label: '메뉴 관리', path: '/menus' },
  { label: '주문 현황', path: '/orders' },
  { label: '프로모션', path: '/promotions' },
  { label: '고객 피드백', path: '/feedback' },
  { label: '데이터 시트', path: '/data-sheet' },
  { label: '운영 가이드', path: '/playbooks' },
]

export const AppLayout = ({
  user,
  onSignOut,
}: {
  user: AdminUser
  onSignOut: () => void
}) => {
  const { stores, selectedStoreId, setSelectedStoreId, isLoading, ownedStoreIds } =
    useStoreContext()
  const [isProfileOpen, setProfileOpen] = useState(false)
  const needsStoreConnection = !isLoading && ownedStoreIds.length === 0
  const [avatarError, setAvatarError] = useState(false)
  const initials = (user.displayName ?? user.email ?? '?').slice(0, 2).toUpperCase()
  const avatarUrl =
    user.photoURL ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? user.email)}`

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="sidebar__brand">
          <span className="brand__dot" />
          <div>
            <strong>Silo 관리자</strong>
            <p className="brand__project">silo-10aa1</p>
          </div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx('nav__item', isActive && 'nav__item--active')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <p className="sidebar__hint">고객센터 : support@silo.app</p>
          <p className="sidebar__hint">운영시간 10:00 ~ 19:00</p>
          <a className="sidebar__hint" href="/privacy">
            개인정보 처리방침
          </a>
        </div>
      </aside>
      <main className="app-shell__main">
        <header className="app-shell__header">
          <div>
            <p className="eyebrow">내 매장</p>
            <h1>하루 운영을 한 곳에서</h1>
            <p className="header__subtitle">
              매장 기본 정보부터 메뉴, 주문까지 점주님이 직접 관리하는 공간입니다.
            </p>
          </div>
          {stores.length > 1 && (
            <div className="store-switcher">
              <label htmlFor="store-select">관리 매장</label>
              <select
                id="store-select"
                value={selectedStoreId}
                onChange={(event) => setSelectedStoreId(event.target.value)}
                disabled={isLoading}
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="user-pill">
            <div className="user-pill__avatar">
              {avatarError ? (
                <span className="avatar-fallback">{initials}</span>
              ) : (
                <img
                  src={avatarUrl}
                  alt={user.displayName ?? user.email}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              )}
            </div>
            <div className="user-pill__meta">
              <strong>{user.displayName ?? '점주 계정'}</strong>
              <p className="user-pill__email">{user.email}</p>
              <span className="user-pill__role">Store Owner</span>
            </div>
            <div className="user-pill__actions">
              <button type="button" className="ghost-btn" onClick={() => setProfileOpen(true)}>
                프로필
              </button>
              <button type="button" className="danger-btn" onClick={onSignOut}>
                로그아웃
              </button>
            </div>
          </div>
        </header>
        {needsStoreConnection && (
          <div className="store-alert">
            <div>
              <p className="eyebrow">매장 연결 필요</p>
              <p>
                아직 등록된 매장이 없습니다. 먼저 <strong>매장 정보</strong> 탭에서 매장을 등록한 뒤 아래로
                내려 <strong>매장을 추가</strong>해 주세요. 매장이 등록되면 자동으로 연결되고, 새로고침하면
                바로 사용할 수 있습니다.
              </p>
            </div>
            <a className="ghost-btn" href="/restaurants">
              매장 등록하기
            </a>
          </div>
        )}
        <section className="app-shell__content">
          <Outlet />
        </section>
      </main>
      {isProfileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  )
}

const ProfileModal = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => {
  const { owner, stores } = useStoreContext()
  const [isDeleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const ok = window.confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!ok) return
    try {
      setDeleting(true)
      await deleteOwnerAccount(user.email)
      alert('계정 삭제 요청이 완료되었습니다. 다시 로그인하려면 관리자에게 문의하세요.')
      onClose()
    } catch (error) {
      console.error(error)
      alert('계정 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <div className="profile-modal__backdrop" role="dialog" aria-modal="true">
      <div className="profile-modal">
        <header>
          <div>
            <p className="eyebrow">계정 정보</p>
            <h2>{user.displayName ?? user.email}</h2>
            <p className="muted">{user.email}</p>
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            닫기
          </button>
        </header>
        <div className="profile-modal__body">
          <section>
            <h3>역할</h3>
            <p>{owner?.role ?? 'Store Owner'}</p>
            <p className="muted">온보딩 상태: {owner?.onboardingStatus ?? '확인 중'}</p>
          </section>
          <section>
            <h3>연결된 매장</h3>
            {stores.length <= 1 && <p className="muted">등록된 매장이 없습니다.</p>}
            {stores.length > 1 && (
              <ul>
                {stores
                  .filter((store) => store.id !== 'all')
                  .map((store) => (
                    <li key={store.id}>{store.name}</li>
                  ))}
              </ul>
            )}
          </section>
          <section>
            <h3>계정 관리</h3>
            <button
              type="button"
              className="danger-btn"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중…' : '계정 삭제'}
            </button>
            <p className="muted">계정을 삭제하면 매장 데이터 접근 권한이 사라집니다.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
