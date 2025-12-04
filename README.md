# Silo 관리자 웹

Firebase 기반 Flutter 배달 앱과 동일한 데이터를 편집할 수 있는 관리자 대시보드의 킥오프 스캐폴드입니다.

## 기술 스택

- Vite + React + TypeScript
- Firestore 접근을 위한 React Query
- Firebase Auth · Firestore · Storage (단일 프로젝트: `silo-10aa1`)
- Silo 시그니처 색상(#FF9F0F)을 반영한 경량 커스텀 스타일

## 주요 기능

- **점주 친화 레스토랑 등록**: 단계별 폼과 도움말, Firebase Storage 업로드 버튼으로 누구나 손쉽게 이미지/정보 입력
- **메뉴 작성 도우미**: 레스토랑 선택 → 메뉴 목록 → 옵션 그룹 순으로 안내하며 다중 메뉴/선택지를 추가 가능
- **데이터 미리보기**: 레스토랑 목록 검색/페이지네이션, 메뉴 섹션 필터로 저장된 데이터를 즉시 확인
- **네이버 지도 연동**: 지도에서 위치를 지정하면 좌표가 자동 저장되고, Directions API로 거리·ETA 계산 가능
- **주문 현황판**: 수동 주문 등록과 상태 변경(확인·조리·배달·완료)을 한 화면에서 처리

## 시작하기

```bash
cp .env.example .env.local   # Firebase 자격 정보 입력
npm install
npm run dev
```

### 주요 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버 실행 |
| `npm run build` | 프로덕션 번들 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리 보기 |
| `node scripts/bulkRestaurantCrud.mjs` | CSV 기반 대량 CRUD (상세: `docs/bulk_import.md`) |

## Firebase · Naver 연동

- `.env.example`를 복사해 `VITE_FIREBASE_*`, `VITE_ADMIN_EMAIL_DOMAIN`, `VITE_ALLOW_ALL_EMAILS`를 채웁니다.
- 네이버 지도 기능을 위해 `VITE_NAVER_MAP_KEY_ID`(또는 기존 `VITE_NAVER_MAP_CLIENT_ID`), `VITE_NAVER_MAP_CLIENT_SECRET`(NCP 콘솔에서 발급)을 설정합니다. **주의:** 배포 시 Secret은 Cloud Functions 프록시(`functions/src/index.ts`의 `naverProxy`)로 넘기고, 프런트에서는 `VITE_NAVER_PROXY_BASE=/api/naver`만 사용해 호출하세요.
- `AuthProvider`가 admin 커스텀 클레임과 이메일 도메인을 기반으로 접근 권한을 제어합니다.
- `src/lib/firebase.ts` 에뮬레이터 사용 시 `VITE_USE_EMULATORS=true`를 설정합니다.
- Google/Apple 로그인 후 admin 클레임을 부여하는 Callable Function을 추가하는 것이 권장됩니다.

## 디렉터리 구조

```
src/
 ├─ components/        # 레이아웃 및 인증 상태 컴포넌트
 ├─ config/            # Firebase 환경 변수 로더
 ├─ lib/               # Firebase 초기화 로직
 ├─ pages/             # 대시보드, 레스토랑, 메뉴 등 화면
 ├─ providers/         # Auth + React Query 프로바이더
 └─ routes/            # 인증 가드가 적용된 라우터
docs/architecture.md   # 설계 및 배포 계획
```

## 다음 단계

1. Firestore/Storage 보안 규칙을 강화해 관리 계정만 쓰기 가능하도록 조정합니다.
2. 주문/리뷰 데이터와 연동해 월 주문 수·평점 같은 자동 지표를 계산합니다.
3. 네이버 지도 검색/자동완성을 프런트로 노출하거나 프록시를 통해 안전하게 연동합니다.
4. Firebase Hosting 대상(`silo-admin`)을 구성하고 `firebase deploy --only hosting:silo-admin`으로 배포합니다.
