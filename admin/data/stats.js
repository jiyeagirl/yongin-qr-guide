import { TODAY } from "../../screens/main/config.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { FACILITIES } from "../../screens/main/data/facilities.js";

/* 대시보드 수치 (명세서 6장 · M02) — 스캔·조회 계열은 전부 생성값이다.
 *
 * ── 실제로 집계할 수 없는 값들이다 ──────────────────────────────────────────
 * 스캔 수·길찾기 실행 수·조회 비중은 서버 로그에서 나오는데 서버가 없다. 그래서 만들어
 * 쓰되, **아무 숫자나 두지 않는다.** 대시보드를 보는 담당자가 처음 하는 일은 "이게 말이
 * 되나"를 재는 것이고, 요일 주기도 축제 효과도 없는 평평한 그래프는 그 자리에서
 * 가짜로 읽힌다.
 *
 * 그래서 세 가지를 넣었다:
 *   1. 주말이 평일보다 높다 (골목 상점가를 찾는 때가 그때다)
 *   2. 둔전 축제일(10.17)에 크게 튄다 — config.TODAY 가 그날이라 그래프 오른쪽 끝에 보인다
 *   3. 나머지는 완만한 우상향 (안내판이 계속 붙는 중이라는 전제)
 *
 * ── 결정적으로 만든다 ───────────────────────────────────────────────────────
 * Math.random 을 쓰지 않는다. 새로고침할 때마다 그래프가 달라지면 "어제 본 값과 다른데"를
 * 검수할 방법이 없다. dunjeon.js 와 같은 방식의 시드 난수를 쓴다.
 *
 * ── 60일을 만든다 ───────────────────────────────────────────────────────────
 * 화면에 보이는 것은 최대 30일인데 데이터는 60일이다. 명세서가 요구하는 **증감률**이
 * "직전 같은 기간 대비"라서다 — 최근 30일의 증감을 내려면 그 앞 30일이 있어야 한다.
 * 없는 기간을 0 으로 두면 증감률이 늘 +∞ 가 된다.
 */

/* mulberry32 — 짧고 분포가 고른 시드 난수. dunjeon.js 가 쓰는 것과 같은 종류다 */
function seeded(seed) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const DAYS = 60;
const FESTIVAL_DAY = "2026-10-17";   /* 둔전 골목축제 (districts.js) */

function dateOf(base, offset) {
  const [y, m, d] = base.split("-").map(Number);
  /* Date 를 쓰지 않고 직접 센다 — 시간대에 따라 하루가 밀리는 일이 없다 */
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let yy = y, mm = m, dd = d + offset;
  while (dd < 1) { mm -= 1; if (mm < 1) { mm = 12; yy -= 1; } dd += days[mm - 1]; }
  while (dd > days[mm - 1]) { dd -= days[mm - 1]; mm += 1; if (mm > 12) { mm = 1; yy += 1; } }
  return { y: yy, m: mm, d: dd, iso: `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}` };
}

/* 요일 — 2026-10-17 은 토요일이다. 거기서 거꾸로 센다 */
const WEEKDAY_OF_TODAY = 6;   /* 0=일 … 6=토 */

function buildDaily() {
  const rand = seeded(20261017);
  const out = [];
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const day = dateOf(TODAY, -i);
    const wd = ((WEEKDAY_OF_TODAY - i) % 7 + 7) % 7;
    const weekend = wd === 0 || wd === 6;
    const trend = 1 + (DAYS - 1 - i) * 0.008;              /* 완만한 우상향 */
    let v = (weekend ? 210 : 128) * trend * (0.85 + rand() * 0.3);
    if (day.iso === FESTIVAL_DAY) v *= 2.6;                /* 축제일 */
    const scans = Math.round(v);
    out.push({
      label: `${day.m}.${String(day.d).padStart(2, "0")}`, iso: day.iso, value: scans,
      /* 길찾기 실행 — 스캔한 사람 중 실제로 [길찾기]를 누르는 비율.
         스캔과 따로 난수를 굴리지 않는다. 스캔이 튄 날 길찾기만 평소 수준이면
         담당자가 그 불일치를 설명하려 애쓰게 된다 — 없는 현상이다. */
      routes: Math.round(scans * (0.28 + rand() * 0.12)),
    });
  }
  return out;
}

export const DAILY = buildDaily();

/* ── 기간 선택 (명세서 6장) ──────────────────────────────────────────────────
   기본이 최근 7일인 것은 명세서가 그렇게 정했고, 이유도 분명하다 — 오늘 하루는 표본이
   너무 작아 요일 하나에 통째로 휘둘리고, 30일은 최근 변화가 묻힌다. */
export const PERIODS = [
  { key: "today", label: "오늘", days: 1 },
  { key: "7d", label: "최근 7일", days: 7 },
  { key: "30d", label: "최근 30일", days: 30 },
];
export const DEFAULT_PERIOD = "7d";

const sum = (arr, k) => arr.reduce((n, d) => n + (d[k] || 0), 0);

/* 누적은 기간과 무관한 값이다. 서비스가 시작된 뒤 전부 —
   화면에 있는 60일치에 그 이전의 값을 더해 둔다. */
const BEFORE = 18420;
export const TOTAL_SCANS = BEFORE + sum(DAILY, "value");

export function statsFor(key) {
  const p = PERIODS.find(x => x.key === key) || PERIODS[1];
  const n = p.days;
  const cur = DAILY.slice(-n);
  const prev = DAILY.slice(-n * 2, -n);
  const scans = sum(cur, "value");
  const prevScans = sum(prev, "value");
  return {
    period: p,
    daily: cur,
    from: cur[0] ? cur[0].iso : TODAY,
    to: cur[cur.length - 1] ? cur[cur.length - 1].iso : TODAY,
    scans,
    routes: sum(cur, "routes"),
    /* 직전 같은 기간이 0 이면 증감률을 내지 않는다. 0 을 분모로 두면 +Infinity 가 나오고,
       화면에는 "+Infinity%" 라는 아무 뜻 없는 글자가 뜬다 */
    delta: prevScans ? Math.round((scans - prevScans) / prevScans * 100) : null,
    prevScans,
  };
}

/* 스캔 뒤 어느 탭으로 갔나. 셋을 합치면 100 이 되게 맞춘다 — 반올림 때문에 99 나 101 이
   나오면 담당자가 그 1을 찾느라 시간을 쓴다 */
export const TAB_SHARE = [
  { key: "district", label: "상점가", value: 46 },
  { key: "facility", label: "공공시설", value: 34 },
  { key: "discover", label: "둘러보기", value: 20 },
];

/* 시설 유형별 조회 비중 (명세서 6장). 탭 비중과 따로 두는 이유: 공공시설 탭 안에서
   무엇이 열리는지는 다른 질문이다 — 화장실이 압도적인지 AED 가 실제로 열리는지에 따라
   안내판 문구와 등록 우선순위가 달라진다. */
export const FACILITY_SHARE = [
  { key: "toilet", label: "화장실", value: 52 },
  { key: "rest", label: "쉼터", value: 24 },
  { key: "aed", label: "AED", value: 15 },
  { key: "shelter", label: "대피소", value: 9 },
];

/* 인기 시설·점포 상위 **10**. 점포는 시민 화면의 인기순(views)과 **같은 값**을 쓴다 —
   관리자 대시보드의 1위와 둘러보기 탭의 "이번 주 조회 1위"가 다른 가게이면
   둘 중 하나는 틀린 것이 된다. */
export const TOP_N = 10;

export const TOP_STORES = [...STORES]
  .sort((a, b) => b.views - a.views)
  .slice(0, TOP_N)
  .map((s, i) => ({ rank: i + 1, id: s.id, name: s.name, biz: s.biz, cat: s.cat, views: s.views }));

export const TOP_FACILITIES = (() => {
  const rand = seeded(4242);
  return [...FACILITIES]
    .map(f => ({ id: f.id, name: f.name, type: f.type,
      /* 가까운 시설일수록 많이 열린다. 거리와 반비례하게 만들되 난수로 흔든다 */
      views: Math.round((900 / (1 + f.dist / 300)) * (0.7 + rand() * 0.6)) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, TOP_N)
    /* 유형 이름표(FACILITY_LABELS)는 붙이지 않는다 — 그것은 디자인 시스템의 것이고,
       데이터 파일이 디자인 시스템을 끌어오면 서버 응답으로 갈아끼울 때 같이 딸려온다 */
    .map((f, i) => ({ ...f, rank: i + 1 }));
})();

/* 지점별 스캔. 지점이 둘뿐이라 표가 두 줄이다 — 그것을 감추지 않는다.
   **끈 지점에도 스캔이 남는 것이 요점이다.** 2019년 안내판을 아직 찍는 사람이 있고,
   그 숫자가 0 이 아니라는 사실이 "옛 코드를 지우면 안 되는" 이유를 그대로 보여준다
   (U-CM-02 · S11 의 두 갈래). 지우면 그 사람들이 「등록되지 않은 코드」를 만난다. */
export const SCANS_BY_POINT = [
  { code: "dunjeon-01", name: "둔전 시장 입구 버스정류장", active: true, scans: TOTAL_SCANS - 412 },
  { code: "dunjeon-2019-04", name: "(구) 둔전 시장 안내판", active: false, scans: 412 },
];

/* ── 카카오맵 API 사용량 (명세서 6장 "운영") ────────────────────────────────
   길찾기 호출은 스캔 수를 따라간다 — 오늘 길찾기 실행 수가 곧 호출 수다.
   한도와 경고 임계치는 설정(8-2)에서 오므로 여기서는 **쓴 양만** 낸다.
   기본값을 여기 적어두면 설정에서 한도를 바꿔도 대시보드가 옛 값으로 재게 된다. */
export const API_USED_TODAY = DAILY[DAILY.length - 1].routes;

/* ── 처리 대기 배지 (명세서 6장) ────────────────────────────────────────────
   셋 다 **담당자가 오늘 해야 할 일**이다. 나머지 수치는 보고용이고 이것만 할 일이라
   0 건이 아닐 때만 뜨고, 누르면 그 화면으로 간다.

   전에는 「매칭 검수 대기」가 넷째로 있었다. 그 화면이 개발 쪽으로 가면서 함께 빠졌다 —
   누를 곳이 없는 배지를 남겨두면 그 숫자가 무엇을 하라는 것인지 알 수 없다.

   숫자를 여기서 세지 않는 이유: 셋 다 덮개(store.js)를 거친 **지금 값**이어야 한다.
   여기서 원본을 세면 검수 중에 신고 하나를 처리해도 배지가 그대로 남는다.
   그래서 세는 규칙만 두고, 세는 일은 화면이 한다. */
export const PENDING_BADGES = [
  { key: "reports", page: "reports", label: "미처리 오류신고", tone: "danger" },
  { key: "qr", page: "qr", label: "설치 미완료 QR", tone: "warning" },
  { key: "coord", page: "stores", label: "좌표 누락 점포", tone: "warning" },
];
