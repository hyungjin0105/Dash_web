import { useMemo } from 'react'
import { HelpSection } from '../components/layout/HelpSection'
import sheetText from '../../data/restaurants_template.csv?raw'
import sheetUrl from '../../data/restaurants_template.csv?url'

type ParsedCsv = {
  headers: string[]
  rows: string[][]
}

const parseCsv = (input: string): ParsedCsv => {
  const rows: string[][] = []
  let current: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      current.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1
      }
      current.push(cell)
      rows.push(current)
      current = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell)
    rows.push(current)
  }

  const headers = rows[0] ?? []
  const dataRows = rows.slice(1).filter((row) => row.some((value) => value.trim().length > 0))
  return { headers, rows: dataRows }
}

const sectionDefs = [
  {
    title: '기본 정보',
    fields: [
      'id',
      'name',
      'englishName',
      'category',
      'shortDescription',
      'highlight',
      'tags',
      'badges',
      'description',
    ],
  },
  {
    title: '위치 · 연락처',
    fields: [
      'area',
      'address',
      'addressDetail',
      'postalCode',
      'latitude',
      'longitude',
      'deliveryRangeKm',
      'mapLink',
      'naverPlaceId',
      'naverPlaceUrl',
      'phoneNumber',
    ],
  },
  {
    title: '운영 · 서비스',
    fields: [
      'services',
      'operatingHours',
      'pickupOperatingHours',
      'closureNotes',
      'deliveryEta',
      'pickupEta',
      'deliveryFee',
      'smallOrderFee',
      'minOrderPrice',
      'events',
      'notices',
      'promoImages',
    ],
  },
  {
    title: '홍보 · 채널',
    fields: [
      'discountInfo',
      'heroImage',
      'sideImages',
      'menuImages',
      'logoImage',
      'kakaoChannel',
      'instagramHandle',
      'websiteUrl',
    ],
  },
  {
    title: '결제 · 정산',
    fields: [
      'bankName',
      'bankAccountNumber',
      'bankAccountHolder',
      'bankTransferGuide',
      'transferMemo',
      'paymentMethods',
    ],
  },
  {
    title: '성과 지표',
    fields: [
      'rating',
      'reviewCount',
      'monthlyOrders',
      'favoriteCount',
      'priorityWeight',
      'status',
    ],
  },
  {
    title: '메뉴 · 파일',
    fields: ['menu_sections_file', 'menu_option_template'],
  },
  {
    title: '관리 메타',
    fields: ['createdBy'],
  },
]

export const DataSheetPage = () => {
  const { headers, rows } = useMemo(() => parseCsv(sheetText), [])
  const assignedFields = useMemo(() => new Set(sectionDefs.flatMap((section) => section.fields)), [])

  return (
    <div className="panel column">
      <HelpSection
        eyebrow="데이터 시트"
        title="CSV 데이터 한번에 확인하기"
        description="업데이트한 매장 정보가 제대로 기입되었는지 빠르게 검토하세요. CSV 파일을 수정한 후에는 새로고침으로 갱신할 수 있습니다."
        tips={[
          '각 열은 백엔드 임포트 스크립트와 동일하게 매핑됩니다.',
          '비워둔 셀은 Firestore 반영 시 기존 값 유지에 활용됩니다.',
          'CSV 다운로드 후 스프레드시트 편집기를 통해 일괄 수정하세요.',
        ]}
      />

      <div className="panel panel--sub">
        <div className="list-controls">
          <div>
            <strong>총 {rows.length}개 매장 행</strong>
            <p className="helper">필드 {headers.length}개</p>
          </div>
          <a className="button-ghost" href={sheetUrl} download>
            CSV 다운로드
          </a>
        </div>
        <div className="data-sheet-grid">
          {rows.map((row, rowIndex) => {
            const nameIdx = headers.indexOf('name')
            const areaIdx = headers.indexOf('area')
            const idIdx = headers.indexOf('id')
            const servicesIdx = headers.indexOf('services')
            const name = nameIdx >= 0 ? row[nameIdx] : `행 ${rowIndex + 1}`
            const area = areaIdx >= 0 ? row[areaIdx] : ''
            const id = idIdx >= 0 ? row[idIdx] : ''
            const services = servicesIdx >= 0 ? row[servicesIdx] : ''
            const valueMap = headers.reduce<Record<string, string>>((acc, key, columnIndex) => {
              acc[key] = row[columnIndex] ?? ''
              return acc
            }, {})
            const extraFields = headers.filter(
              (header) => !assignedFields.has(header) && (valueMap[header]?.length ?? 0) > 0,
            )

            return (
              <article className="data-sheet-card" key={`${rowIndex}-${id}`}>
                <header>
                  <div>
                    <p className="eyebrow">{id || `ROW ${rowIndex + 1}`}</p>
                    <h3>{name || '이름 없음'}</h3>
                    {area && <p className="muted">{area}</p>}
                  </div>
                  {services && <span className="pill">{services}</span>}
                </header>
                {sectionDefs.map((section) => {
                  const filledFields = section.fields.filter(
                    (field) => valueMap[field] && valueMap[field].trim().length > 0,
                  )
                  if (filledFields.length === 0) {
                    return null
                  }
                  return (
                    <section className="data-sheet-section" key={section.title}>
                      <h4>{section.title}</h4>
                      <dl>
                        {filledFields.map((field) => (
                          <div className="data-sheet-field" key={`${section.title}-${field}`}>
                            <dt>{field}</dt>
                            <dd>{valueMap[field]}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )
                })}
                {extraFields.length > 0 && (
                  <section className="data-sheet-section" key="extra">
                    <h4>기타 항목</h4>
                    <dl>
                      {extraFields.map((field) => (
                        <div className="data-sheet-field" key={`extra-${field}`}>
                          <dt>{field}</dt>
                          <dd>{valueMap[field]}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
