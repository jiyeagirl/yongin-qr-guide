/* 셸의 **현재 상점가** — 동백이음길 골목형상점가 (2026-10-30, 사용자 요청. 종전 둔전 더미 `dunjeon.js`).
 *
 * 상점가 탭(S03)의 점포 목록 · 업종 칩 · 인기 매장 · 골목 한바퀴 코스와, 화면의 "내 위치"(QR 스캔 지점)가
 * 여기서 나온다. 공공시설(facilities.js) · 상점가 거리(districts.js) · 예시 경로(walkRoute.js) ·
 * QR 지점 표(qr.js)가 모두 이 파일의 `ANCHOR` 에 매달려 있다.
 *
 * ── 점포는 받은 실제 자료다 ────────────────────────────────────────────────
 * 둔전은 335곳을 난수로 만든 더미였다. 동백이음길은 건물 단위로 받은 실제 점포 227곳(2026-10-30 판)이 있어
 * (`dongbaekStores.js`, 처리 방식은 `districtStores.js` 머리말) 그것을 그대로 쓴다. 이 파일은
 * 거기에 **셸이 쓰는 값**만 더한다 (층 `floor` · 상인회 정회원 `member` 는 자료의 값 그대로다):
 *
 *   dist        QR 지점에서의 직선거리(m). 건물 좌표에서 계산한다 — 목록과 지도가 같은 값을 본다
 *   views       인기순(U-ST-15)과 인기 매장(U-DC-02)용 조회수 — **시연용 생성값**이다(서버 집계 자리)
 *   agoMonths   등록 시점(관리자 「등록 일자」를 펴는 값, admin/data/sources.js) — 시연용 생성값
 *
 * 업종은 점포명에서 추정한 값이다(districtStores.js). 온누리 가맹은 받은 표의 칸 그대로다(61곳).
 * 점포의 `districtId` 는 떼어 둔다 — 셸은 그것이 **없는** 점포를 현재 상점가의 것으로
 * 읽는다(상세의 소속 · 축제 · 코스, MainApp).
 *
 * ── QR 지점 ───────────────────────────────────────────────────────────────
 * 상점 QR 시연 점포는 상점가 대표주소(동백중앙로 358-19, 미래도프라자) 건물의 「우리동네 통닭집」이다 (2026-10-30 판 표기).
 * 실서비스에서는 상점마다 QR 이 하나씩이고 앵커도 그 상점이다 (`docs/direction_v2_rules.md` 3장).
 */

import { DONGBAEK_BUILDINGS } from "./dongbaekStores.js";
import { districtStores, storeNameOf } from "./districtStores.js";
import { nearestChain, withLegs, totals, gapM } from "./coursePlan.js";

export const CURRENT_ID = "dongbaekium";
const ENTRY_STORE_NAME = "우리동네 통닭집";

/* 결정적 난수 — 새로고침해도 같은 값이 나와야 검수가 가능하다 */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const SOURCE = districtStores(CURRENT_ID);
const entry = SOURCE.find(s => s.name === ENTRY_STORE_NAME) || SOURCE[0];

/* QR 스캔 지점 — 화면의 "내 위치"는 항상 이 고정 좌표다. GPS 를 쓰지 않는다 (제안서 3-1).
   좌표는 그 점포가 든 **건물**(미래도프라자 = 상점가 대표주소)의 좌표다. 같은 건물 점포들은 그 둘레에 흩어
   찍히므로(districtStores.js) 점포 자신의 점을 앵커로 쓰면 목록 첫 줄이 「약 0m」가 된다. */
const home = DONGBAEK_BUILDINGS.find(b => b.stores.some(row => storeNameOf(row) === entry.name));
export const ANCHOR = { name: entry.name, lat: home ? home.lat : entry.lat, lng: home ? home.lng : entry.lng };
export const ENTRY_STORE_ID = entry.id;

/* 건물 표 (2026-10-30) — 상점가 탭 지도가 가게 대신 건물마다 핀 하나를 찍는다(가게가 12채에 몰려 있다).
   id 는 가게의 `building`(건물명)에서 만든다 — 가게에서 그 건물 핀을 바로 찾을 수 있게 */
export const buildingIdOf = name => `bld:${name}`;
export const BUILDINGS = DONGBAEK_BUILDINGS.map(b => ({
  id: buildingIdOf(b.name), name: b.name, road: b.road,
  /* 보여 주는 이름 — 「모아아파트상가동」처럼 긴 이름은 「모아 상가」로 줄인다. 지도 핀 · 건물 시트 제목이 같은 이름을 쓴다
     (2026-10-30, 사용자 요청 — 핀과 시트 제목이 달랐다). 가게 묶음(`s.building`)은 원래 이름 그대로다 */
  label: b.name.replace(/아파트상가동$/, " 상가"), addr: `기흥구 ${b.road}`, lat: b.lat, lng: b.lng,
}));

/* 거리 말고는 기준점과 상관없는 값 — 한 번만 만든다 */
const BASE = (() => {
  const rand = rng(20261030);
  return SOURCE.map(({ districtId, ...s }) => ({
    ...s,
    /* 세제곱으로 롱테일을 만든다 — 대부분 낮고 소수만 튀어야 「인기순」이 뜻을 갖는다 (종전 둔전과 같은 크기) */
    views: 3 + Math.round(Math.pow(rand(), 3) * 110),
    agoMonths: Math.round(Math.pow(rand(), 2) * 23),
  }));
})();

/* 기준점에서 잰 거리를 붙여 가까운 순으로 — 목록 · 지도 · 코스가 같은 값을 본다 */
function storesFrom(anchor) {
  return BASE.map(s => ({ ...s, dist: Math.round(gapM(anchor, s)) }))
    .sort((a, b) => a.dist - b.dist || a.id.localeCompare(b.id));
}

export const STORES = storesFrom(ANCHOR);

/* 업종 칩 (기능명세서 3-4). 순서와 이름은 종전 그대로이고, 수는 목록에서 센다 — 0건인 칩은 FilterBar 가 숨긴다.
   [전체]는 여기 없다 — 칩들의 합이라 FilterBar 가 맨 앞에 세운다. */
const CATS = [
  { id: "food", label: "음식" },
  { id: "cafe", label: "카페/디저트" },
  { id: "shop", label: "쇼핑" },
  { id: "life", label: "생활/편의" },
  { id: "edu", label: "교육" },
  { id: "culture", label: "여가/문화" },
  { id: "etc", label: "기타" },
];
export const CHIPS = CATS.map(c => ({ ...c, count: STORES.filter(s => s.cat === c.id).length }));

export const DISTRICT = {
  /* 이름과 소재지는 용인시 누리집 표기 그대로다 (districts.js 머리말) */
  name: "동백이음길 골목형상점가",
  area: "동백중앙로 358-19 일원",
  stores: STORES.length,                                  /* 227 (2026-10-30 판) */
  onnuri: STORES.filter(s => s.onnuri).length,            /* 61 (받은 표의 가맹 칸) */
  /* 가장 많은 업종 셋 — 목록에서 센다 */
  topCategories: [...CHIPS].sort((a, b) => b.count - a.count).slice(0, 3).map(c => c.label),
};

/* ── 인기 매장 (U-DC-02) ─────────────────────────────────────────────────────
   둘러보기 탭 레일과 관리자 대시보드 미리보기가 같은 규칙을 쓴다. 관리자에서 숨긴 점포는 빠진다. */
export const DISCOVER_PICK = 10;
const viewsOf = s => Number(s.views || 0);
export function discoverPicks(stores) {
  const live = (stores || []).filter(s => s.visible !== false);
  return { popular: [...live].sort((a, b) => viewsOf(b) - viewsOf(a)).slice(0, DISCOVER_PICK) };
}
export const POPULAR = discoverPicks(STORES).popular;

/* ── 골목 한바퀴 추천 코스 (U-DC-03) ─────────────────────────────────────────
   종전 둔전은 QR 지점에서 300~500m 밴드의 점포를 이었다. 동백이음길은 건물 열 채가 한 블록에 모여 있어
   (가장 먼 건물이 150m 안쪽) 그 밴드에 점포가 없다. 그래서 **한 건물에서 한 곳씩** 가까운 순으로 네 곳을
   잇는다 — 같은 건물 안에서 네 곳을 고르면 「한바퀴」가 아니라 한 층 둘러보기가 된다. 출발한 가게의 건물도
   뺀다. 세 코스가 같은 가게로 채워지지 않게 앞 코스가 쓴 가게는 뒤 코스 후보에서 먼저 뺀다.
   **맨 앞은 「이음길 함께가게 한바퀴」**(2026-10-30, 사용자 요청) — 상인회 정회원 가게를 잇는 코스다. 처음에는 세 코스를
   모두 정회원으로만 채웠는데 「편파 같다」고 해서 되돌리고, 정회원은 이 코스 하나로 모았다. 들르는 곳은 사용자가 예로 든
   네 곳(`stops` 이름표)이고 차례만 출발 가게에서 가까운 순으로 잇는다 — 건물이 겹쳐도(선우축산 · 두부만드는사람들) 둘 다 넣는다.
   코스는 관리자 큐레이션인지 자동 생성인지가 아직 미정이다 (6장 남은 확인사항 #2) — 지금은 자동 생성이다. */
const COURSE_PLAN = [
  { id: "cs-member", name: "이음길 함께가게 한바퀴",
    desc: "이음길과 함께하는 동네 가게들을 만나보는 코스",
    stops: ["동백문고", "동백떡집", "선우축산", "두부만드는사람들"] },
  { id: "cs-eat", name: "먹자골목 한바퀴",
    desc: "맛있는 음식점과 카페를 찾아 떠나는 코스",
    pick: s => s.cat === "food" || s.cat === "cafe" },
  { id: "cs-onnuri", name: "온누리 알뜰 한바퀴",
    desc: "온누리상품권으로 다양한 가게를 알뜰하게 둘러보는 코스",
    pick: s => !!s.onnuri },
  { id: "cs-around", name: "동네 상점 둘러보기",
    desc: "근처 곳곳의 가게를 발견하는 한바퀴 코스",
    pick: () => true },
];

function chainAcrossBuildings(pool, from, count) {
  const out = [];
  let rest = pool.slice();
  let at = from;
  while (out.length < count && rest.length) {
    const [next] = nearestChain(rest, at, 1);
    out.push(next);
    at = next;
    rest = rest.filter(s => s.building !== next.building);
  }
  return out;
}

/* 한 가게에서 출발하는 코스. 그 가게 자신(과 그 건물)은 넣지 않는다 — 이미 그 앞에 서 있다 */
export function coursesFrom(storeId, stores = STORES, anchor = ANCHOR) {
  const STORES_ = stores;
  const home = STORES_.find(s => s.id === storeId);
  if (!home) return COURSES;
  const used = new Set();
  return COURSE_PLAN.map(({ pick, stops: names, ...c }) => {
    if (names) {
      /* 정해 둔 가게들 — 출발 가게 자신만 빼고, 가까운 순으로 잇는다 */
      const fixed = STORES_.filter(s => names.includes(s.name) && s.id !== home.id);
      const chain = nearestChain(fixed, home, fixed.length);
      chain.forEach(s => used.add(s.id));
      const stops = withLegs(chain, anchor);
      return { ...c, stops, ...totals(stops) };
    }
    const pool = STORES_.filter(s => s.building !== home.building && pick(s));
    const fresh = pool.filter(s => !used.has(s.id));
    const near = chainAcrossBuildings(fresh.length >= 4 ? fresh : pool, home, 4);
    near.forEach(s => used.add(s.id));
    const stops = withLegs(near, anchor);
    return { ...c, stops, ...totals(stops) };
  }).filter(c => c.stops.length >= 3);
}

/* QR 지점(= 시연 점포)에서 출발하는 기본 코스 */
let COURSES = [];
COURSES = coursesFrom(ENTRY_STORE_ID);
export { COURSES };

/* 축제는 여기 있지 않다 — 32개소에 흩어져 있어 `districts.js` 가 소유한다 (CURRENT_FESTIVAL). */
export const CURRENT = { anchor: ANCHOR, district: DISTRICT, chips: CHIPS, stores: STORES,
  popular: POPULAR, courses: COURSES };
export default CURRENT;

/* ── 기준점이 다른 QR 로 들어왔을 때 (2026-10-30, 사용자 요청 — 정회원 상점 QR `qr-006` 동백문고) ──────────
   상점 QR 의 기준점은 그 가게의 건물이다. 기본 지점(미래도프라자)과 다른 건물의 가게 QR 이면 거리 · 차례 ·
   코스를 그 건물에서 다시 잰다 — 이름만 바꾸고 거리를 그대로 두면 서 있는 가게가 목록에서 「약 96m」로 뜬다.
   같은 좌표면 위의 상수를 그대로 돌려준다. */
export function currentAt(at, entryStoreId) {
  const same = !at || (at.lat === ANCHOR.lat && at.lng === ANCHOR.lng);
  if (same) {
    return entryStoreId ? { ...CURRENT, courses: coursesFrom(entryStoreId) } : CURRENT;
  }
  const anchor = { ...ANCHOR, lat: at.lat, lng: at.lng };
  const stores = storesFrom(anchor);
  return { ...CURRENT, anchor, stores, popular: discoverPicks(stores).popular,
    courses: coursesFrom(entryStoreId || ENTRY_STORE_ID, stores, anchor) };
}
