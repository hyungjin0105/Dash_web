# 대량 레스토랑 CRUD 스크립트

대규모 입점을 준비하는 동안 스프레드시트(또는 CSV)에서 한 번에 Firestore로 데이터를 밀어넣을 수 있도록 `scripts/bulkRestaurantCrud.mjs`를 추가했습니다. 릴리스 이후에는 기존 관리자 UI를 그대로 사용하면 됩니다.

## 준비물

1. **서비스 계정 JSON**
   - Firebase 콘솔 → 프로젝트 설정 → 서비스 계정에서 새 비공개 키를 발급하고 `serviceAccount.json` 이름으로 `admin-web/`에 저장하거나 `--credentials` 옵션으로 경로를 넘깁니다.
2. **CSV 데이터**
   - `admin-web/data/restaurants_template.csv`를 Google Sheets 등에 복사해 사용합니다.
   - 각 컬럼 설명:
     | 컬럼 | 설명 |
     | --- | --- |
     | `action` | `create`, `update`, `upsert`, `delete` 중 하나 (미입력 시 `upsert`) |
     | `id` | Firestore 문서 ID (비워두면 `name`을 기준으로 슬러그 생성) |
     | `tags`, `services`, `sideImages` | `|` 로 구분된 배열 값 |
     | 숫자 필드 (`deliveryFee`, `latitude` 등) | 숫자만 입력하면 스크립트가 자동 변환 |
     | `menu_sections_file` | `admin-web/data/` 기준 상대 경로. JSON 배열 예시는 `data/menu_samples/silo.json` 참고 |
     | `menu_sections_json` | (선택) JSON 배열을 직접 입력하고 싶을 때 사용 |
   - 새 필드를 추가하면 스크립트가 헤더를 그대로 읽어 문서에 병합합니다. 필요 시 `_json` 접미사를 붙이면 JSON으로 파싱합니다.

## 실행 방법

```bash
cd admin-web
# 의존성 설치 (최초 1회)
npm install

# 실제 쓰기
node scripts/bulkRestaurantCrud.mjs --file=data/restaurants_template.csv --credentials=./serviceAccount.json

# 미리보기(dry-run)
node scripts/bulkRestaurantCrud.mjs --file=data/restaurants_template.csv --dry-run
```

옵션 요약:

| 옵션 | 설명 |
| --- | --- |
| `--file=` | CSV 경로. 생략하면 `data/restaurants_template.csv` |
| `--credentials=` | 서비스 계정 JSON 경로. 생략하면 `serviceAccount.json` |
| `--dry-run` | Firestore에 쓰지 않고 로그만 출력 |

## CRUD 규칙

- `create`: 문서가 이미 있다면 오류. 신규 생성 시 사용.
- `update`: 문서가 있을 때만 병합.
- `upsert`: 기본값. 문서가 있으면 병합, 없으면 새로 생성.
- `delete`: 해당 레스토랑 문서와 하위 `menus` 컬렉션 삭제.

스크립트는 `menu_sections_file` 또는 `menu_sections_json`이 있으면 기존 메뉴 섹션을 모두 지우고 새로운 섹션으로 대체합니다.

## 워크플로우 제안

1. Baemin 등에서 필요한 정보를 수집한 뒤 스프레드시트에 정리합니다.
2. CSV로 다운로드하여 `data/` 폴더에 둡니다.
3. 메뉴가 복잡할 경우 JSON 파일을 `data/menu_samples/` 아래에 추가하고 `menu_sections_file` 컬럼에서 참조합니다.
4. `--dry-run`으로 우선 검증 후 실제 작업을 실행합니다.
5. 릴리스 이후에는 기존 관리자 UI를 통해 점주가 직접 수정/등록하도록 전환합니다.

이 방식으로 많은 매장을 사전에 입력해 두고, 추후에는 UI만 유지하면 됩니다.
