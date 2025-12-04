import { useAuth } from '../../providers/AuthProvider'
import logoImg from '../../assets/dash_logo.png'

export const LoadingState = () => (
  <div className="full-bleed-state">
    <p className="eyebrow">로딩 중</p>
    <h2>Firebase 초기화 중</h2>
    <p>자격 증명을 확인하고 React Query 캐시를 동기화하고 있습니다…</p>
  </div>
)

export const SignInState = () => {
  const { signIn, error } = useAuth()
  return (
    <div className="full-bleed-state">
      <div className="brand-mark">
        <img src={logoImg} alt="Logo" className="brand-mark__logo" />
      </div>
      <p className="eyebrow">인증</p>
      <h2>Google 계정으로 로그인</h2>
      <p>@dash.app 계정 또는 admin 클레임이 부여된 계정만 허용됩니다.</p>
      <button onClick={signIn}>Google로 계속</button>
      {error && <p className="state__error">{error}</p>}
    </div>
  )
}

export const AccessDeniedState = () => (
  <div className="full-bleed-state">
    <p className="eyebrow">접근 제한</p>
    <h2>관리자 권한이 감지되지 않았습니다</h2>
    <p>코어 팀에 요청해 Firebase Auth 계정에 admin=true 클레임을 부여받으세요.</p>
  </div>
)
