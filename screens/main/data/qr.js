/* QR 지점 표 (U-CM-01 · U-CM-02).
 *
 * 실서비스에서 QR 은 `/s/{qrCode}` 로 들어오고 **서버가** 그 코드로 좌표·행정동·소속 상점가를
 * 조회해 초기 컨텍스트를 만든다. 여기에는 서버가 없으므로 그 조회를 이 표가 대신한다.
 * 실연동 때는 lookup() 안쪽만 fetch 로 갈아끼우면 되고 화면은 그대로다.
 *
 * ── 유효한 코드가 하나뿐인 이유 ────────────────────────────────────────────
 * 더미 데이터(점포 335곳, 공공시설, 거리, 좌표)는 전부 **둔전 시장 입구 버스정류장**
 * 한 지점을 기준으로 계산돼 있다 (data/dunjeon.js). 표에 다른 지점을 더해두면 이름만
 * 바뀌고 거리는 그대로라, 화면이 조용히 거짓말을 하게 된다. 그래서 **유효한 코드는 하나뿐**이고,
 * 나머지 줄들은 전부 셸을 세우지 않는 코드다 — 안내 화면의 갈래를 검수할 대상이 필요하기
 * 때문이다. 셸로 들어가지 않으므로 더미 거리와 어긋날 일이 없다.
 *
 *   dunjeon-01      유효 (셸)
 *   dunjeon-2019-04 철거된 안내판  → S11  (표에 있으나 끝난 코드)
 *   dunjeon-03      설치 후 미활성 → S11-A (표에 있으나 아직 시작하지 않은 코드)
 *   그 밖의 문자열   → S11  (표에 없는 코드)
 *
 * **조회 자체가 안 될 수도 있다** → S11-B. 코드가 아니라 통신이 문제라 표와 무관하고,
 * 검수 플래그 `?net=fail` 로만 켠다 (맨 아래).
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
  {
    /* ── S11-A 검수 대상 (2026-08-24) ──────────────────────────────────────
       안내판은 **현장에 이미 서 있는데** 아직 켜지 않은 지점이다. 위의 철거 건과 마찬가지로
       `active: false` 지만 성격이 반대다 — 저쪽은 끝난 안내판이고 이쪽은 시작하지 않은
       안내판이라, 찍은 사람에게 할 말이 「다른 QR 을 찍어 주세요」가 아니라 「곧 열립니다」다
       (resolveQr 머리말).

       실제로 있을 수 있는 상태다. 관리자 QR 지점 목록이 이 조합(설치완료 + 미활성)에
       노란 띠를 두르는 것도 같은 이유다 — 안내판은 붙어 있어서 지나가는 사람이 찍는데
       아직 아무 것도 안 나오는, 남은 일 중 가장 급한 자리다 (admin/pages/QrPoints.jsx).

       좌표와 소속 상점가를 채워 두는 것은 관리자 화면에서 이 지점을 열어 볼 수 있어야
       하기 때문이다. 시민 화면은 이 지점으로 셸을 세우지 않으므로(pending 에서 갈린다)
       더미 거리 계산과 어긋날 일이 없다 — 위 머리말의 「유효한 코드가 하나뿐인 이유」는
       그대로다. */
    code: "dunjeon-03",
    active: false,
    name: "둔전 시장 서편 출입구",
    dong: "처인구 포곡읍 둔전리",
    addr: "처인구 포곡읍 둔전로 51",
    lat: 37.28802,
    lng: 127.19842,
    districtId: "dunjeon",
    installStatus: "설치완료",
    installedAt: "2026-08-21",
    locationDetail: "서편 출입구 왼쪽 기둥, 눈높이(지면 1.4m)",
    memo: "안내판 설치는 끝났고 주변 시설 자료 확인 후 활성화 예정.",
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

/* 「지금은 안 쓰는 코드」로 읽는 설치 상태. 나머지(설치예정 · 설치완료)는 **아직 안 켠**
   것이라 사용자에게 할 말이 다르다 — 아래 resolveQr 참조. 값은 관리자 항목표의
   INSTALL_STATUS 와 같은 문자열이다 (`admin/data/fields.js`) — 담당자가 M12 에서 고르는
   그 값이 곧 시민 화면의 갈래가 된다. 두 곳이 갈리면 담당자가 고른 상태와 현장에서 뜨는
   안내가 어긋나므로, 문자열을 늘릴 때는 이 줄도 함께 본다. */
const RETIRED = ["훼손", "철거"];

/* 조회 결과는 네 갈래다. 화면(S01/S11)이 이 status 로만 분기한다.
     ok        지점 컨텍스트 구성 완료 → 공공시설 탭으로 (U-CM-01)
     pending   안내판은 섰지만 아직 안 켠 코드 → 준비 중 안내 S11-A (U-CM-02)
     inactive  훼손·철거로 쓰지 않는 코드 → S11 (U-CM-02)
     unknown   표에 없는 코드 → S11 (U-CM-02)

   ── 「안 켜짐」을 둘로 가른다 (2026-08-24, 사용자 요청) ─────────────────────
   전에는 `active` 가 false 이기만 하면 전부 inactive 였다. 그런데 그 하나에 **성격이
   반대인 두 상태**가 들어 있었다:

     철거·훼손    이 안내판은 **끝난 것**이다. 여기서 다시 찍어도 앞으로 열리지 않는다
     설치예정·설치완료(미활성)  이 안내판은 **아직 시작하지 않은 것**이다. 곧 열린다

   할 일이 정반대다 — 앞은 다른 QR 을 찾아 가야 하고, 뒤는 **그 자리에서 나중에 다시
   찍으면 된다.** "다른 QR 을 찍어 주세요"를 읽은 사람은 멀쩡히 준비 중인 안내판을
   고장으로 여기고 떠난다. 그것이 화면을 하나 더 만든 이유다 (EntryFallback 머리말).

   `active` 를 먼저 본다 — 담당자가 켜 두었으면 설치 상태와 상관없이 열린다. 설치 상태는
   현장 기록이고 노출을 정하는 것은 활성 토글이다 (관리자 명세서 4장). */
export function resolveQr(code) {
  const point = byCode[code];
  if (!point) return { status: "unknown", code, point: null };
  if (point.active) return { status: "ok", code, point };
  const retired = RETIRED.includes(point.installStatus);
  return { status: retired ? "inactive" : "pending", code, point };
}

/* ?net=fail 이 **첫 조회만** 실패시켰는지 (아래 lookup). 모듈 변수인 것은 [다시 시도]가
   같은 페이지 안에서 일어나기 때문이다 — 새로고침하면 다시 한 번 실패한다. */
let netFailed = false;

/* 서버 조회를 흉내 낸다. 화면은 await 만 하므로 실연동 때 이 함수 몸통만 바뀐다.
   **실패로 끝날 수 있다** (2026-08-24) — 실연동에서 이 자리는 fetch 이고, 안내판 앞은
   지하상가·시장 안처럼 전파가 약한 자리일 수 있다. 그때 화면이 S11-B 다. */
export function lookup(code) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      /* 검수 플래그. **첫 번째만** 실패시킨다 — 매번 실패하면 [다시 시도]가 아무 것도
         하지 않는 단추로 보여, 그 단추가 실제로 되살아나는지를 검수할 수 없다 */
      if (readReviewFlags().netFail && !netFailed) {
        netFailed = true;
        reject(new Error("network"));
        return;
      }
      resolve(resolveQr(code));
    }, QR_LOOKUP_MS);
  });
}

/* ── 검수 플래그 ───────────────────────────────────────────────────────────
 * S03-E(U-ST-16)는 "QR 지점에서 임계 거리 안에 지정 상점가가 없을 때"의 화면인데,
 * 유효한 QR 지점이 둔전 하나뿐이라 실제로는 그 상태에 들어갈 수가 없다.
 * 없는 지점을 표에 지어넣는 대신(위 머리말 참조) 플래그로 그 상태만 켠다.
 * config.js 의 TODAY 와 같은 성격이다 — 실서비스에서는 제거한다.
 *
 *   ?district=none   현재 상점가 없음 → 상점가 탭이 S03-E 로
 *   ?net=fail        QR 조회가 통신 오류로 실패 → S11-B (첫 조회만. 위 lookup)
 */
export function readReviewFlags(loc = typeof location !== "undefined" ? location : null) {
  const p = new URLSearchParams((loc && loc.search) || "");
  return { noDistrict: p.get("district") === "none", netFail: p.get("net") === "fail" };
}

export default QR_POINTS;
