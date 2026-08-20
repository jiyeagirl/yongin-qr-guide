/* QR 지점 표 (U-CM-01 · U-CM-02).
 *
 * 실서비스에서 QR 은 `/s/{qrCode}` 로 들어오고 **서버가** 그 코드로 좌표·행정동·소속 상점가를
 * 조회해 초기 컨텍스트를 만든다. 여기에는 서버가 없으므로 그 조회를 이 표가 대신한다.
 * 실연동 때는 lookup() 안쪽만 fetch 로 갈아끼우면 되고 화면은 그대로다.
 *
 * ── 유효한 코드가 하나뿐인 이유 ────────────────────────────────────────────
 * 더미 데이터(점포 335곳, 공공시설, 거리, 좌표)는 전부 **둔전 시장 입구 버스정류장**
 * 한 지점을 기준으로 계산돼 있다 (data/dunjeon.js). 표에 다른 지점을 더해두면 이름만
 * 바뀌고 거리는 그대로라, 화면이 조용히 거짓말을 하게 된다. 그래서 유효한 코드는 하나만
 * 두고, 나머지 한 줄은 **비활성 코드**로 둔다 — S11 의 두 갈래(미등록·비활성)를 검수할
 * 대상이 필요하기 때문이다.
 */
import { ANCHOR } from "./dunjeon.js";

/* ── 관리자 명세서 4장의 항목을 함께 갖는다 (2026-08-20) ────────────────────
 * 시민 화면이 쓰는 것은 `code · active · name · lat · lng · districtId · replacedBy` 뿐이다.
 * 나머지(`addr · installStatus · installedAt · locationDetail · memo`)는 **설치·점검용**이라
 * 시민 화면에 나가지 않지만, 관리자 QR 지점 관리(M13)가 그것을 다룬다.
 *
 * 관리자 쪽에 표를 따로 만들지 않은 이유는 그러면 같은 지점이 두 벌 생기고, 좌표를 한쪽에서만
 * 고치는 날이 반드시 오기 때문이다. 시민 화면이 안 읽는 필드가 여기 있는 것은 비용이 아니다.
 *
 * `dong`(행정동)은 명세서에 없다. 지우지 않고 두는 것은 관리자 목록이 지점을 훑을 때
 * 도로명주소보다 짧고 알아보기 쉬운 이름이라서다 — 입력받지 않고 표시만 한다. */
export const QR_POINTS = [
  {
    code: "dunjeon-01",
    active: true,
    name: ANCHOR.name,
    lat: ANCHOR.lat,
    lng: ANCHOR.lng,
    dong: "처인구 포곡읍 둔전리",
    addr: "처인구 포곡읍 둔전로 42",
    districtId: "dunjeon",          /* U-ST-01 — 관리자가 등록 시 직접 지정한다 (앱이 계산하지 않는다) */
    installStatus: "설치완료",
    installedAt: "2026-03-14",
    locationDetail: "정류장 승차대 오른쪽 기둥, 눈높이(지면 1.4m)",
    memo: null,
  },
  {
    /* 2019년에 붙였다가 안내판째 교체된 자리. 코드는 표에 남아 있지만 active 가 false 다 —
       "등록된 적 없는 코드"와 "지금은 안 쓰는 코드"는 사용자에게 할 말이 다르다 (U-CM-02). */
    code: "dunjeon-2019-04",
    active: false,
    name: "(구) 둔전 시장 안내판",
    replacedBy: "dunjeon-01",
    dong: "처인구 포곡읍 둔전리",
    addr: "처인구 포곡읍 둔전로 40",
    lat: 37.28861,
    lng: 127.19908,
    districtId: "dunjeon",
    installStatus: "철거",
    installedAt: "2019-05-02",
    locationDetail: "시장 입구 옛 안내판 하단. 2026.03 교체 시 철거",
    memo: "철거했으나 코드는 남긴다 — 아직 이 코드를 찍는 사람이 있다 (대시보드 지점별 스캔 참조).",
  },
];

export const DEFAULT_QR = "dunjeon-01";

/* 조회에 거는 지연(ms). **검수용 상수다 — 실연동 시 서버 응답 시간이 이 자리를 대신한다.**
   표를 읽는 일은 즉시 끝나서 S01 로딩 화면이 한 프레임도 보이지 않는데,
   그러면 그 화면이 제대로 만들어졌는지 확인할 방법이 없다. config.js 의
   SAMPLE_ROUTE_DELAY 와 같은 성격이다. */
export const QR_LOOKUP_MS = 260;

const byCode = Object.fromEntries(QR_POINTS.map(p => [p.code, p]));

/* 주소에서 QR 코드를 읽는다. 두 가지 형태를 모두 받는다.
     /s/dunjeon-01        실서비스가 쓸 형태 (정적 호스팅이라 지금은 안 열리지만 규약은 맞춰둔다)
     ?qr=dunjeon-01       지금 검수에 쓰는 형태
   해시(#/...)는 상세 오버레이가 쓰고 있으므로 건드리지 않는다.
   아무것도 없으면 기본 지점이다 — 주소를 직접 친 사람에게 오류 화면을 띄우지 않는다. */
export function readQrCode(loc = typeof location !== "undefined" ? location : null) {
  if (!loc) return DEFAULT_QR;
  const fromPath = /\/s\/([^/?#]+)/.exec(loc.pathname || "");
  if (fromPath) return decodeURIComponent(fromPath[1]);
  const q = new URLSearchParams(loc.search || "").get("qr");
  return q ? q.trim() : DEFAULT_QR;
}

/* 조회 결과는 세 갈래다. 화면(S01/S11)이 이 status 로만 분기한다.
     ok        지점 컨텍스트 구성 완료 → 공공시설 탭으로 (U-CM-01)
     inactive  표에는 있으나 쓰지 않는 코드 → 교체 안내 (U-CM-02)
     unknown   표에 없는 코드 → 전체 지도 폴백 (U-CM-02) */
export function resolveQr(code) {
  const point = byCode[code];
  if (!point) return { status: "unknown", code, point: null };
  if (!point.active) return { status: "inactive", code, point };
  return { status: "ok", code, point };
}

/* 서버 조회를 흉내 낸다. 화면은 await 만 하므로 실연동 때 이 함수 몸통만 바뀐다. */
export function lookup(code) {
  return new Promise(resolve => {
    setTimeout(() => resolve(resolveQr(code)), QR_LOOKUP_MS);
  });
}

/* ── 검수 플래그 ───────────────────────────────────────────────────────────
 * S03-E(U-ST-16)는 "QR 지점에서 임계 거리 안에 지정 상점가가 없을 때"의 화면인데,
 * 유효한 QR 지점이 둔전 하나뿐이라 실제로는 그 상태에 들어갈 수가 없다.
 * 없는 지점을 표에 지어넣는 대신(위 머리말 참조) 플래그로 그 상태만 켠다.
 * config.js 의 TODAY 와 같은 성격이다 — 실서비스에서는 제거한다.
 *
 *   ?district=none   현재 상점가 없음 → 상점가 탭이 S03-E 로
 */
export function readReviewFlags(loc = typeof location !== "undefined" ? location : null) {
  const p = new URLSearchParams((loc && loc.search) || "");
  return { noDistrict: p.get("district") === "none" };
}

export default QR_POINTS;
