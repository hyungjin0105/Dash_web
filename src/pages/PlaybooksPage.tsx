const playbooks = [
  {
    title: '계정 관리',
    items: [
      '사내 이메일 또는 승인된 계정만 접근 허용',
      '신규 직원은 담당자 승인 후 로그인 안내',
      '퇴사/휴직 시 즉시 접근 권한 회수',
    ],
  },
  {
    title: '사진 관리',
    items: [
      '대표 사진은 최소 1200px 권장, 용량 2MB 이하',
      '메뉴 사진은 정사각형 비율로 업로드',
      '오래된 이벤트 이미지는 월 1회 정리',
    ],
  },
]

export const PlaybooksPage = () => (
  <div className="panel column">
    <header>
      <p className="eyebrow">운영</p>
      <h2>운영 가이드</h2>
      <p>사장님과 운영팀이 함께 지켜야 할 간단한 수칙들입니다.</p>
    </header>
    <div className="roadmap">
      {playbooks.map((book) => (
        <article key={book.title}>
          <h3>{book.title}</h3>
          <ul>
            {book.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </div>
)
