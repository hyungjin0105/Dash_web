export const PrivacyPage = () => (
  <div className="panel column">
    <section className="panel panel--sub">
      <header>
        <p className="eyebrow">개인정보 처리방침</p>
        <h2>Silo 파일럿 개인정보 안내</h2>
        <p className="helper">
          본 서비스는 파일럿 단계로, 아래에 안내된 목적에 한해 점주님의 정보를 수집·이용합니다.
        </p>
      </header>
      <ol className="ordered">
        <li>
          <strong>수집 항목</strong>: 이름, 이메일, 연락처, 매장 정보, 주문/고객 행동 데이터(익명 토큰 기준),
          피드백 내용.
        </li>
        <li>
          <strong>이용 목적</strong>: 파일럿 실험 운영, 대시보드 통계 제공, 재방문 분석, 고객 지원.
        </li>
        <li>
          <strong>보관 기간</strong>: 파일럿 종료 또는 계정 삭제 요청 시까지. 삭제 요청은 프로필 &gt; 계정 삭제
          버튼을 통해 접수할 수 있습니다.
        </li>
        <li>
          <strong>제3자 제공</strong>: 공식 파트너(동일 파일럿 참여 매장)와 코마케팅을 위해 최소한의 통계
          정보만 공유하며, 개인 식별 정보는 제공하지 않습니다.
        </li>
        <li>
          <strong>기타</strong>: QR/웹 주문 데모에서 발생하는 데이터는 테스트 용도로만 사용되며 실제 주문
          이행 책임은 없습니다.
        </li>
      </ol>
      <p className="helper">
        문의: support@silo.app / 계정 삭제 안내: 프로필 &gt; 계정 삭제 버튼 사용
      </p>
    </section>
  </div>
)
