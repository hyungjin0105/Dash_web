# Silo 관리자 웹 · 아키텍처 킥오프

## 1. 기술 스택

- **프레임워크**: Vite + React + TypeScript
- **데이터**: Firestore 읽기/쓰기에 React Query 사용
- **디자인**: Pretendard 폰트와 Silo 대표 색(#FF9F0F)을 활용한 경량 스타일
- **Firebase SDK**: 모듈식 v10 (Auth, Firestore, Storage, Analytics 선택)

## 2. Firebase 연동

- `src/config/firebase.ts`에서 `VITE_FIREBASE_*` 환경 변수를 로드합니다.
- `src/lib/firebase.ts`는 앱을 초기화하고 `auth`, `firestore`, `storage` 인스턴스를 노출합니다.
- `VITE_USE_EMULATORS=true` 설정 시 Auth(9099) / Firestore(8080) / Storage(9199) 에뮬레이터에 연결합니다.
- 이미지 업로드는 `firebase/storage`의 `uploadBytesResumable`을 활용하여 `restaurants/{scope}/` 경로에 저장하고, 완료 후 URL을 폼에 자동 채워 넣습니다.

| 파일 | 역할 |
| --- | --- |
| `.env.example` | `silo-10aa1` 자격 정보 템플릿 |
| `.env.local` | 실제 개발 환경 변수 (Git에 커밋 금지) |
| `src/vite-env.d.ts` | 환경 변수 타입 안전성 보장 |
| `VITE_NAVER_MAP_KEY_ID` | 네이버 지도 API Key ID (Maps JS v3) |
| `VITE_NAVER_MAP_CLIENT_ID` | (호환용) 기존 Client ID env — 남겨두었지만 새 Key ID 사용 권장 |
| `VITE_NAVER_MAP_CLIENT_SECRET` | 네이버 Directions/Geocoding Secret (배포 시 서버 프록시 필요) |
| `VITE_NAVER_PROXY_BASE` | 프런트에서 호출할 프록시 엔드포인트(예: `/api/naver`) |

## 3. 인증 및 권한

- 기본 로그인 방식: Google (Apple은 호스팅 도메인 승인 후 추가 예정)
- 접근 허용 조건:
  1. Firebase Auth 사용자에 `admin=true` 커스텀 클레임 존재
  2. 또는 이메일 도메인이 `VITE_ADMIN_EMAIL_DOMAIN` (기본값 `@silo.app`)에 해당
  3. `VITE_ALLOW_ALL_EMAILS=true`인 경우 모든 이메일 임시 허용
- `AuthProvider`가 사용자 상태에 따라 로딩/로그인/거절 화면을 전환합니다.
- 운영 단계에서 Callable Function 또는 Admin SDK 스크립트로 클레임을 부여하세요.

## 4. 데이터 모델 정렬

- Flutter 관리자와 동일한 Firestore 구조를 유지합니다.
  - `restaurants/{restaurantId}`: 메타데이터, 태그, 이미지, 금융/위치 정보 포함
  - `restaurants/{restaurantId}/menus/{menuSectionId}`: `order` 필드로 정렬된 섹션과 다중 `items + optionGroups`
  - 향후 `orders`, `favorites` 등은 동일한 프로젝트에서 공유
- 가격은 부동소수점을 피하기 위해 원 단위 정수로 저장합니다.
- Cloud Storage 경로 예시: `gs://silo-10aa1/restaurants/{restaurantId}/media/{assetId}.jpg`

## 5. 호스팅 및 CI

1. `firebase init hosting`으로 `firebase.json`, `.firebaserc`에 `silo-admin` 타깃을 추가합니다.
2. GitHub Actions 등 CI에서 `npm ci && npm run build` 후 `firebase deploy --only hosting:silo-admin` 실행을 권장합니다.
3. 프리뷰 채널을 활용해 QA와 Flutter 팀이 동일 데이터를 검증하도록 합니다.

## 6. 근시일 내 TODO

- 레스토랑/메뉴 CRUD React Query 컨버터 고도화
- Cloud Storage 이미지 업로더 + 서명 URL 저장
- 주문 콘솔에 실시간 스트림 도입 및 배송 필터 강화
- 네이버 지도 주소 검색/자동완성 도입으로 위치 입력 간소화
- 네이버 Directions 호출을 서버 프록시/클라우드 함수로 이전해 Secret을 보호
- Firestore/Storage 보안 규칙에 admin 클레임 검증 추가
- Vitest + React Testing Library로 핵심 폼/데이터 흐름 테스트
