/* 오류신고 접수 목록 (명세서 5장 · M14).
 *
 * ── 시민 쪽 S10 이 보내는 것이 여기로 온다 ──────────────────────────────────
 * screens/detail/ReportForm.jsx 가 받는 항목이 그대로 한 줄이 된다. 지금은 S10 이 실제로
 * 전송하지 않으므로(서버가 없다) 아래 열여섯 건은 만든 것이지만, **모양은 명세서 5-1 의
 * 항목표와 맞춰 두었다** — 실연동 때 이 표만 응답으로 갈아끼우면 된다.
 *
 *   targetType  대상 유형 (공공시설 · 점포 · 상점가 · 축제 · 기타)
 *   targetId    대상 ID — 상세 화면에서 신고하면 자동으로 들어온다
 *   kind        신고 유형 (정보 오류 · 없어진 시설 · 위치 부정확 · 추가 제안 · 기타)
 *   body        내용 (10~500자)
 *   contact     회신처 — **개인정보다.** 처리 완료 후 90일 보관 뒤 자동 파기한다
 *   qrCode      접수 지점 — 신고한 QR 지점이 자동 기록된다
 *
 * ── 내용을 실제로 나올 법한 것으로 적었다 ───────────────────────────────────
 * "테스트입니다" 같은 줄로 채우면 화면은 뜨지만 검수가 되지 않는다. 목록에서 담당자가
 * 하는 판단은 "이건 데이터 문제인가 안내 문제인가"이고, 그 판단이 가능한 문장이어야
 * 상태 칩과 정렬이 쓸모 있는지 알 수 있다.
 *
 * ── 같은 대상에 세 건을 몰아 두었다 ─────────────────────────────────────────
 * 명세서 5장: "동일 대상 신고가 3건 이상 누적되면 목록에서 강조." 그 규칙이 실제로
 * 걸리는 데이터가 없으면 만들어놓고 확인할 방법이 없다. `fc-004`(둔전시장 공중화장실)에
 * 세 건이 있고, 목록에서 그 세 줄이 함께 붉게 선다 — 한 사람의 착각이 아니라 자료가
 * 틀렸다는 신호다.
 */

export const REPORT_SEED_STATES = ["접수", "확인중", "처리완료", "반려", "중복"];

export const REPORTS = [
  { id: "rp-016", at: "2026-10-17", targetType: "점포", targetId: "dj-004", target: "가온김밥",
    kind: "없어진 시설", state: "접수", assignee: null, qrCode: "dunjeon-01",
    contact: "010-2841-3391", memo: null, reply: null,
    body: "가온김밥 지난달에 문 닫았어요. 갔다가 헛걸음했습니다." },

  { id: "rp-015", at: "2026-10-17", targetType: "점포", targetId: "dj-118", target: "명가노래연습장",
    kind: "정보 오류", state: "접수", assignee: null, qrCode: "dunjeon-01",
    contact: "yongin7788@naver.com", memo: null, reply: null,
    body: "온누리 가맹으로 나오는데 매장에서는 안 받는다고 합니다. 확인 부탁드려요." },

  /* ── 같은 대상 3건 (강조 규칙 확인용) ───────────────────────────────── */
  { id: "rp-014", at: "2026-10-16", targetType: "공공시설", targetId: "fc-004",
    target: "둔전시장 공중화장실", kind: "위치 부정확", state: "확인중", assignee: "포곡읍 김담당",
    qrCode: "dunjeon-01", contact: "010-3320-7720",
    memo: "포곡읍 현장 확인 요청함 (10.16)", reply: null,
    body: "지도에 찍힌 자리에 화장실이 없습니다. 한 블록 위인 것 같아요." },
  { id: "rp-013", at: "2026-10-15", targetType: "공공시설", targetId: "fc-004",
    target: "둔전시장 공중화장실", kind: "위치 부정확", state: "확인중", assignee: "포곡읍 김담당",
    qrCode: "dunjeon-01", contact: null, memo: null, reply: null,
    body: "길찾기 따라갔는데 주차장 한가운데로 안내합니다." },
  { id: "rp-012", at: "2026-10-14", targetType: "공공시설", targetId: "fc-004",
    target: "둔전시장 공중화장실", kind: "정보 오류", state: "접수", assignee: null,
    qrCode: "dunjeon-01", contact: "010-9930-4417", memo: null, reply: null,
    body: "위치가 틀린 것 같아요. 시장 안쪽이 아니라 바깥쪽입니다." },

  { id: "rp-011", at: "2026-10-14", targetType: "공공시설", targetId: "fc-002",
    target: "둔전 공영주차장 공중화장실", kind: "정보 오류", state: "확인중", assignee: "포곡읍 김담당",
    qrCode: "dunjeon-01", contact: null, memo: null, reply: null,
    body: "비상벨 있다고 나오는데 여자화장실에는 없어요." },

  { id: "rp-010", at: "2026-10-14", targetType: "기타", targetId: null, target: null,
    kind: "기타", state: "접수", assignee: null, qrCode: "dunjeon-01",
    contact: "010-5512-1188", memo: null, reply: null,
    body: "QR 스티커가 비에 젖어 잘 안 찍힙니다. 정류장 기둥에 붙은 거요." },

  { id: "rp-009", at: "2026-10-13", targetType: "점포", targetId: null, target: null,
    kind: "추가 제안", state: "접수", assignee: null, qrCode: "dunjeon-01",
    contact: "cho1004@daum.net", memo: null, reply: null,
    body: "둔전로 새로 생긴 반찬가게가 목록에 없습니다. 추가해 주세요." },

  { id: "rp-008", at: "2026-10-12", targetType: "점포", targetId: "dj-071", target: "둔전꽃집",
    kind: "정보 오류", state: "처리완료", assignee: "포곡읍 김담당", qrCode: "dunjeon-01",
    contact: "010-2276-5502", memo: "상권정보 원본에도 옛 상호로 남아 있어 수기 수정함",
    reply: "확인 후 상호를 수정했습니다. 알려주셔서 감사합니다.",
    body: "상호가 바뀌었습니다. 지금은 다른 이름으로 영업 중이에요." },

  { id: "rp-007", at: "2026-10-11", targetType: "공공시설", targetId: "fc-003",
    target: "둔전마을회관 무더위쉼터", kind: "정보 오류", state: "처리완료", assignee: "포곡읍 김담당",
    qrCode: "dunjeon-01", contact: null, memo: null,
    reply: "포곡읍행정복지센터 확인 결과 10:00 개방이 맞아 수정했습니다.",
    body: "운영시간이 평일 9시부터라고 되어 있는데 실제로는 10시에 엽니다." },

  { id: "rp-006", at: "2026-10-10", targetType: "점포", targetId: "dj-046", target: "제일반점",
    kind: "위치 부정확", state: "처리완료", assignee: "나인라이트 운영팀", qrCode: "dunjeon-01",
    contact: "kim2200@gmail.com", memo: "좌표 12m 보정",
    reply: "좌표를 보정했습니다. 도보 경로는 참고용임을 안내드립니다.",
    body: "길찾기가 엉뚱한 골목으로 안내합니다." },

  { id: "rp-005", at: "2026-10-09", targetType: "기타", targetId: null, target: null,
    kind: "추가 제안", state: "반려", assignee: "포곡읍 김담당", qrCode: "dunjeon-01",
    contact: "010-4410-9043", memo: "2차 범위",
    reply: "현재는 휴대폰 자체의 글자 크기 설정을 따릅니다. 화면 안 글자 크기 조절은 2차에 추가될 예정입니다.",
    body: "글자가 너무 작아요. 앱 안에서 크게 볼 수 있게 해주세요." },

  { id: "rp-004", at: "2026-10-09", targetType: "점포", targetId: "dj-019", target: "행복베이커리",
    kind: "정보 오류", state: "처리완료", assignee: "포곡읍 김담당", qrCode: "dunjeon-01",
    contact: null, memo: null,
    reply: "2025.07 기준 자료에 누락된 것을 확인해 가맹으로 반영했습니다.",
    body: "온누리 되는데 앱에는 안 된다고 나와요." },

  { id: "rp-003", at: "2026-10-08", targetType: "공공시설", targetId: "fc-001",
    target: "둔전로 42 AED", kind: "정보 오류", state: "처리완료", assignee: "포곡읍 김담당",
    qrCode: "dunjeon-01", contact: "010-2276-2276", memo: "건물 관리사무소 연락 완료",
    reply: "건물 관리사무소에 확인 요청했습니다. 응급 시에는 119 안내를 우선 따라주세요.",
    body: "AED 보관함이 잠겨 있습니다." },

  { id: "rp-002", at: "2026-10-07", targetType: "점포", targetId: "dj-088", target: "둔전세탁소",
    kind: "위치 부정확", state: "처리완료", assignee: "나인라이트 운영팀", qrCode: "dunjeon-01",
    contact: null, memo: null, reply: "주소를 수정했습니다.",
    body: "이전했어요. 큰길 건너로 옮겼습니다." },

  { id: "rp-001", at: "2026-10-06", targetType: "점포", targetId: "dj-004", target: "가온김밥",
    kind: "없어진 시설", state: "중복", assignee: "포곡읍 김담당", qrCode: "dunjeon-01",
    contact: null, memo: "rp-016 과 같은 건", reply: null,
    body: "김밥집 없어졌습니다." },
];

/* 미처리 = 접수 · 확인중. 처리완료 · 반려 · 중복은 손을 뗀 상태다 —
   내비 배지와 대시보드의 "처리 대기"가 같은 이 기준을 본다. */
export const OPEN_STATES = ["접수", "확인중"];
export const isOpen = r => OPEN_STATES.includes(r.state);

/* 회신처 자동 파기까지 남은 날 (명세서 5장 — 처리 완료 후 90일 보관).
   지금은 표시만 한다. 실제 파기는 서버의 배치가 하는 일이고, 화면이 할 수 있는 것은
   담당자에게 "이 값은 곧 사라진다"를 알리는 것뿐이다. */
export const CONTACT_KEEP_DAYS = 90;
