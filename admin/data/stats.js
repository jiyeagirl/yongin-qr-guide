import { TODAY } from "../../screens/main/config.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { FACILITIES } from "../../screens/main/data/facilities.js";

/* 대시보드 수치 (A-DB-01) — 전부 생성값이다.
 *
 * ── 실제로 집계할 수 없는 값들이다 ──────────────────────────────────────────
 * 스캔 수·조회 비중은 서버 로그에서 나오는데 서버가 없다. 그래서 만들어 쓰되,
 * **아무 숫자나 두지 않는다.** 대시보드를 보는 담당자가 처음 하는 일은 "이게 말이 되나"를
 * 재는 것이고, 요일 주기도 축제 효과도 없는 평평한 그래프는 그 자리에서 가짜로 읽힌다.
 *
 * 그래서 세 가지를 넣었다:
 *   1. 주말이 평일보다 높다 (골목 상점가를 찾는 때가 그때다)
 *   2. 둔전 축제일(10.17)에 크게 튄다 — config.TODAY 가 그날이라 화면 오른쪽 끝에 보인다
 *   3. 나머지는 완만한 우상향 (안내판이 계속 붙는 중이라는 전제)
 *
 * ── 결정적으로 만든다 ───────────────────────────────────────────────────────
 * Math.random 을 쓰지 않는다. 새로고침할 때마다 그래프가 달라지면 "어제 본 값과 다른데"를
 * 검수할 방법이 없다. dunjeon.js 와 같은 방식의 시드 난수를 쓴다.
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

const DAYS = 30;
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
    const trend = 1 + (DAYS - 1 - i) * 0.012;              /* 완만한 우상향 */
    let v = (weekend ? 210 : 128) * trend * (0.85 + rand() * 0.3);
    if (day.iso === FESTIVAL_DAY) v *= 2.6;                /* 축제일 */
    out.push({ label: `${day.m}.${String(day.d).padStart(2, "0")}`, iso: day.iso, value: Math.round(v) });
  }
  return out;
}

export const DAILY_SCANS = buildDaily();

export const TOTAL_SCANS = 18420 + DAILY_SCANS.reduce((n, d) => n + d.value, 0);

/* 어제 대비 증감 — 상단 지표 카드의 delta */
export const SCAN_DELTA = (() => {
  const n = DAILY_SCANS.length;
  if (n < 2) return 0;
  const [prev, last] = [DAILY_SCANS[n - 2].value, DAILY_SCANS[n - 1].value];
  return Math.round((last - prev) / prev * 100);
})();

/* 스캔 뒤 어느 탭으로 갔나. 셋을 합치면 100 이 되게 맞춘다 — 반올림 때문에 99 나 101 이
   나오면 담당자가 그 1을 찾느라 시간을 쓴다 */
export const TAB_SHARE = [
  { key: "district", label: "상점가", value: 46 },
  { key: "facility", label: "공공시설", value: 34 },
  { key: "discover", label: "둘러보기", value: 20 },
];

/* 인기 시설·점포 상위. 시설은 유형 분포가 드러나게, 점포는 시민 화면의 인기순(views)과
   **같은 값**을 쓴다 — 관리자 대시보드의 1위와 둘러보기 탭의 "이번 주 조회 1위"가
   다른 가게이면 둘 중 하나는 틀린 것이 된다. */
export const TOP_STORES = [...STORES]
  .sort((a, b) => b.views - a.views)
  .slice(0, 5)
  .map((s, i) => ({ rank: i + 1, id: s.id, name: s.name, biz: s.biz, views: s.views }));

export const TOP_FACILITIES = (() => {
  const rand = seeded(4242);
  return [...FACILITIES]
    .map(f => ({ id: f.id, name: f.name, type: f.type,
      /* 가까운 시설일수록 많이 열린다. 거리와 반비례하게 만들되 난수로 흔든다 */
      views: Math.round((900 / (1 + f.dist / 300)) * (0.7 + rand() * 0.6)) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    /* 유형 이름표(FACILITY_LABELS)는 붙이지 않는다 — 그것은 디자인 시스템의 것이고,
       데이터 파일이 디자인 시스템을 끌어오면 서버 응답으로 갈아끼울 때 같이 딸려온다 */
    .map((f, i) => ({ ...f, rank: i + 1 }));
})();

/* 지점별 스캔 — QR 지점이 하나뿐이라 표가 한 줄이다. 그것을 감추지 않는다.
   지점이 늘면 이 자리가 A-QR-03(지점별 이용 통계)의 씨앗이 된다. */
export const SCANS_BY_POINT = [
  { code: "dunjeon-01", name: "둔전 시장 입구 버스정류장", scans: TOTAL_SCANS },
];
