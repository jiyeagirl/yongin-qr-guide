/* 둔전 골목형 상점가 더미 데이터.
 *
 * 수치 근거 (기능명세서 3-2 · 3-3 · 3-4)
 *   - 총 점포 335곳: 구역 주소 시트의 도로명주소 66개로 상가정보를 매칭한 결과.
 *     제안서 검증치(매칭 327, 홈페이지 340)와 근사하다.
 *   - 온누리 가맹 139곳: 온누리 데이터의 `소속 시장명` 컬럼 매칭 결과. 제안서 검증치와 일치.
 *   - 업종 칩 7종의 개수는 3-4 표를 그대로 쓴다 (132/18/53/43/30/59, 합 335).
 *   - "기준 점포수 108개"는 골목형 상점가 지정 요건 산정용 수치이므로 화면에 쓰지 않는다 (3-5).
 *
 * 점포 개별 정보는 실제 상호가 아닌 생성값이다. 다만 거리와 좌표는 서로 일치하도록
 * (거리 → 방위 → 좌표) 순으로 계산해, 목록의 "약 320m"와 지도상 마커 위치가 어긋나지 않는다.
 * 실데이터 연동 시 이 파일만 서버 응답으로 교체하면 된다.
 */

/* 도보 속도. 예전에는 아래 코스 계산에 67 을 그대로 박아두어, config 값을 바꿔도
   코스 시간만 따라오지 않았다. config.js 는 상수만 있고 아무것도 import 하지 않으므로
   데이터 파일이 가져다 써도 순환이 생기지 않는다. */
import { WALK_M_PER_MIN } from "../config.js";

/* QR 스캔 지점 — 화면의 "내 위치"는 항상 이 고정 좌표다. GPS 를 쓰지 않는다 (제안서 3-1). */
export const ANCHOR = { name: "둔전 시장 입구 버스정류장", lat: 37.28874, lng: 127.19931 };

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos((ANCHOR.lat * Math.PI) / 180);

/* 결정적 난수 — 새로고침해도 같은 목록이 나와야 검수가 가능하다 */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const ROADS = ["둔전로", "둔전1로", "둔전2로", "포곡로", "에버랜드로", "둔전중앙로", "금어로", "삼계로"];

/* 칩 정의는 기능명세서 3-4 표. count 는 아래 생성 결과로 검증한다.
   kinds 는 [상호 어미, 업종] 짝이다 — 상호와 업종이 어긋나면 검수 때 데이터를 의심하게 된다. */
const CATS = [
  { id: "food",    label: "음식",        count: 132, onnuri: 62,
    kinds: [["식당", "한식"], ["밥상", "찌개·백반"], ["국밥", "국밥"], ["칼국수", "면요리"], ["돈까스", "일식"],
      ["곱창", "고기구이"], ["숯불갈비", "고기구이"], ["만두", "분식"], ["분식", "분식"], ["김밥", "분식"],
      ["냉면", "면요리"], ["닭집", "치킨"], ["반점", "중식"], ["족발", "족발·보쌈"]] },
  { id: "cafe",    label: "카페/디저트", count: 18,  onnuri: 7,
    kinds: [["커피", "커피전문점"], ["베이커리", "제과점"], ["제과", "제과점"], ["카페", "커피전문점"],
      ["로스터리", "커피전문점"], ["디저트", "디저트"], ["빵집", "제과점"], ["빙수", "빙수·아이스크림"]] },
  { id: "shop",    label: "쇼핑",        count: 53,  onnuri: 28,
    kinds: [["마트", "슈퍼마켓"], ["정육점", "정육"], ["청과", "청과"], ["수산", "수산"], ["상회", "생활잡화"],
      ["문구", "문구·완구"], ["잡화점", "생활잡화"], ["의류", "의류"], ["신발", "신발"], ["꽃집", "화훼"],
      ["안경원", "안경"], ["철물점", "생활잡화"]] },
  { id: "beauty",  label: "미용/생활",   count: 43,  onnuri: 18,
    kinds: [["미용실", "미용실"], ["헤어", "미용실"], ["세탁", "세탁소"], ["네일", "네일"],
      ["이발관", "이용원"], ["피부샵", "피부관리"], ["수선집", "수선"], ["살롱", "미용실"]] },
  { id: "culture", label: "여가/문화",   count: 30,  onnuri: 9,
    kinds: [["체육관", "실내체육"], ["당구장", "당구장"], ["공방", "공방"], ["화실", "화실"], ["서점", "서점"],
      ["필라테스", "실내체육"], ["탁구클럽", "실내체육"], ["요가원", "실내체육"], ["노래연습장", "노래연습장"]] },
  { id: "etc",     label: "기타",        count: 59,  onnuri: 15,
    kinds: [["학원", "학원"], ["약국", "약국"], ["의원", "의원"], ["동물병원", "동물병원"], ["공인중개사", "부동산"],
      ["세무사무소", "세무"], ["인쇄사", "인쇄"], ["통신", "통신"], ["정비소", "자동차정비"], ["치과", "의원"]] },
];

const PREFIX = ["둔전", "포곡", "에버", "새터", "한빛", "행복", "미소", "정든", "우리", "참좋은", "명가", "청기와",
  "소나무", "은행나무", "해오름", "금어", "삼계", "너른", "옛날", "손맛", "제일", "중앙", "가온", "다올", "온담", "봄날"];

function build() {
  const rand = rng(20260614);
  const stores = [];
  let id = 0;

  for (const c of CATS) {
    const used = new Set();
    /* 가맹 여부는 카테고리별 정해진 수만큼만 채운다 — 합계가 정확히 139가 되어야 한다 */
    const onnuriFlags = Array.from({ length: c.count }, (_, i) => i < c.onnuri);
    for (let i = onnuriFlags.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [onnuriFlags[i], onnuriFlags[j]] = [onnuriFlags[j], onnuriFlags[i]];
    }

    for (let i = 0; i < c.count; i++) {
      let name, kind;
      do {
        kind = c.kinds[Math.floor(rand() * c.kinds.length)];
        name = PREFIX[Math.floor(rand() * PREFIX.length)] + kind[0];
      } while (used.has(name));
      used.add(name);

      /* 거리를 먼저 뽑고 방위를 정한 뒤 좌표를 만든다 — 목록의 거리와 지도 위치가 일치한다.
         상점가는 골목이므로 완전한 원형이 아니라 도로축(북동–남서)으로 눌린 분포를 준다. */
      const dist = Math.round(40 + Math.pow(rand(), 0.75) * 580);
      const bearing = rand() * Math.PI * 2;
      const dx = Math.cos(bearing) * dist * 1.25;
      const dy = Math.sin(bearing) * dist * 0.6;

      stores.push({
        id: `dj-${String(++id).padStart(3, "0")}`,
        name,
        cat: c.id,
        biz: kind[1],
        onnuri: onnuriFlags[i],
        dist,
        /* 인기순 정렬용 조회수 (U-ST-15). 실서비스에서는 서버 집계값이다.
           세제곱으로 롱테일을 만든다 — 대부분 낮고 소수만 크게 튀어야 "인기순"이 의미를 갖는다.
           전부 비슷하면 정렬을 바꿔도 목록이 그대로처럼 보인다 */
        views: 12 + Math.round(Math.pow(rand(), 3) * 2400),
        /* 등록 시점 — "신규 매장"(U-DC-02) 을 뽑는 기준. 최근 24개월에 분포시키되
           제곱으로 눌러 대부분 오래된 가게이고 소수만 최근이게 한다. 전부 최근이면
           "신규"라는 말이 아무 것도 가리키지 못한다. 값은 기준월(2026.06)에서 뺀 개월 수. */
        agoMonths: Math.round(Math.pow(rand(), 2) * 23),
        addr: `포곡읍 ${ROADS[Math.floor(rand() * ROADS.length)]} ${1 + Math.floor(rand() * 88)}`,
        lat: +(ANCHOR.lat + dy / M_PER_DEG_LAT).toFixed(6),
        lng: +(ANCHOR.lng + dx / M_PER_DEG_LNG).toFixed(6),
      });
    }
  }

  /* 기본 정렬은 거리순 (U-ST-04) */
  stores.sort((a, b) => a.dist - b.dist);
  return stores;
}

export const STORES = build();

export const CHIPS = [
  { id: "all", label: "전체", count: STORES.length },
  ...CATS.map(c => ({ id: c.id, label: c.label, count: STORES.filter(s => s.cat === c.id).length })),
];

export const DISTRICT = {
  name: "둔전 골목형 상점가",
  area: "처인구 포곡읍 둔전리 일원",
  stores: STORES.length,                                  /* 335 */
  onnuri: STORES.filter(s => s.onnuri).length,            /* 139 */
  asOf: "2026.06 기준",
  topCategories: ["음식", "쇼핑", "미용/생활"],
};

/* ── 신규 및 인기 매장 (U-DC-02) — **둘러보기 탭(S04)** 소유다 ──────────────────
   상점가 탭(S03)은 카드 섹션 대신 정렬 토글(U-ST-15)로 인기 매장을 다룬다.
   목록과 경쟁할 요소가 없는 둘러보기 탭에서만 카드로 펼친다 (기능명세서 4장 각주).

   두 줄로 나눈 이유: "신규"와 "인기"는 겹치지 않는다. 새로 생긴 가게는 아직 조회수가 낮고,
   조회수 상위는 대개 오래된 가게다. 한 줄에 섞으면 어느 쪽 근거로 뽑힌 카드인지 알 수 없다.
   각 카드의 note 가 그 카드가 거기 있는 이유를 적는다. */
const MONTHS_AS_OF = [2026, 6]; /* 데이터 기준월 — agoMonths 를 연월로 되돌릴 때 쓴다 */
const openedLabel = ago => {
  const t = MONTHS_AS_OF[0] * 12 + (MONTHS_AS_OF[1] - 1) - ago;
  return `${Math.floor(t / 12)}.${String((t % 12) + 1).padStart(2, "0")} 등록`;
};

export const POPULAR = [...STORES]
  .sort((a, b) => b.views - a.views)
  .slice(0, 6)
  .map((s, i) => ({ ...s, note: i === 0 ? "이번 주 조회 1위" : `조회 ${s.views.toLocaleString()}회` }));

export const NEW_STORES = [...STORES]
  .sort((a, b) => a.agoMonths - b.agoMonths || a.dist - b.dist)
  .slice(0, 6)
  .map(s => ({ ...s, note: openedLabel(s.agoMonths) }));

/* ── 골목 한바퀴 추천 코스 (U-DC-03) ─────────────────────────────────────────
   "반경 300~500m 내 매장을 묶은 코스". 300~500m 는 **내부 로직 값이며 사용자 필터가 아니다**
   (명세서 원문). 그래서 화면에 "300m"라고 적지 않고, 코스 카드에는 소요 시간과 들르는 곳만 적는다.

   코스는 관리자 큐레이션인지 자동 생성인지가 아직 미정이다 (6장 남은 확인사항 #2).
   여기서는 자동 생성 쪽으로 만들어 둔다 — 밴드 안의 점포를 업종으로 묶고 거리순으로 4곳씩 뽑는다.
   큐레이션으로 결정되면 이 블록만 서버 응답으로 바꾼다. */
const BAND = STORES.filter(s => s.dist >= 300 && s.dist <= 500);
const COURSE_PLAN = [
  /* 설명에 업종을 못박지 않는다 — 들르는 곳은 아래에서 자동으로 뽑히므로 "정육·청과"라고
     적어두면 그 업종이 안 뽑힌 날 설명과 목록이 어긋난다. */
  { id: "cs-eat",  name: "골목 먹거리 한바퀴", cats: ["food", "cafe"],
    desc: "밥집과 디저트를 걸어서 잇는 기본 코스" },
  { id: "cs-shop", name: "장보기 한바퀴",       cats: ["shop"],
    desc: "장거리와 생활용품을 한 번에 도는 코스" },
  { id: "cs-life", name: "생활 한바퀴",         cats: ["beauty", "culture"],
    desc: "미용실과 여가 시설이 이어지는 코스" },
];

/* 두 지점 사이의 거리(m). 평면 근사로 충분하다 — 코스는 골목 한 구역 안이라
   위경도를 미터로 곧장 환산해도 오차가 1m 아래다 (walkRoute.js 의 distanceM 과 같은 근거). */
function gapM(a, b) {
  const x = (b.lng - a.lng) * M_PER_DEG_LNG;
  const y = (b.lat - a.lat) * M_PER_DEG_LAT;
  return Math.sqrt(x * x + y * y);
}

/* 코스에 넣을 4곳을 **서로 가까운 순서로** 잇는다 (탐욕적 최근접 이웃).
   QR 지점에서 가까운 곳부터 시작해, 그 다음은 직전 가게에서 가장 가까운 곳을 고른다.

   예전에는 밴드 안에서 거리순으로 앞의 4곳을 그냥 잘랐다. 그러면 QR 지점에서의 거리만
   비슷할 뿐 서로는 앵커의 반대편일 수 있어서, 붙어 있는 순번 사이가 700m 넘게 벌어졌다.
   구간 시간을 화면에 적지 않던 동안에는 드러나지 않았지만("골목 한바퀴"인데 ①에서 ②로
   12분), 이제 그 값이 화면에 나오므로 코스가 실제로 한 바퀴여야 한다. */
function tour(pool, count) {
  const rest = pool.slice();
  const out = [];
  let from = ANCHOR;
  while (out.length < count && rest.length) {
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (gapM(from, rest[i]) < gapM(from, rest[best])) best = i;
    }
    from = rest[best];
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}

export const COURSES = COURSE_PLAN.map(c => {
  const picked = tour(BAND.filter(s => c.cats.includes(s.cat)), 4);

  /* ── 구간 값은 화면이 아니라 **여기서 사전 계산한다** ────────────────────────
     legM  직전 지점에서 여기까지의 도보 거리. 첫 곳은 QR 지점에서다.
     legMin 그 거리를 분으로 환산한 값.

     화면이 그리면서 재계산하지 않는 이유는 두 가지다. 하나는 같은 구간이 화면마다
     다른 값으로 나오는 것을 막기 위해서고(코스 카드의 총 시간과 상세의 구간 합이
     어긋나면 사용자가 더해보고 틀린 화면이라고 읽는다), 다른 하나는 실연동 때문이다 —
     실제로는 이 값이 서버에서 미리 계산돼 내려온다. 그때 이 파일만 서버 응답으로
     바꾸면 화면은 손대지 않는다.

     **첫 구간만 좌표가 아니라 점포의 dist 를 쓴다.** 목록·상세·길찾기가 그 가게까지의
     거리로 이미 그 값을 말하고 있어서, 여기서만 다른 수를 적으면 같은 거리가 화면마다
     달라진다. 가게 사이 구간은 지도의 점선이 좌표를 잇고 있으므로 좌표에서 잰다. */
  const stops = picked.map((s, i) => {
    const legM = Math.round(i === 0 ? s.dist : gapM(picked[i - 1], s));
    return { ...s, legM, legMin: Math.max(1, Math.round(legM / WALK_M_PER_MIN)) };
  });

  /* 총합은 **구간의 합이다.** 총 거리를 따로 구하면 화면에 적힌 구간들을 더한 값과
     어긋난다. 예전에는 `|Δdist| + 120` 이라는 어림값을 썼는데, 그 수는 어느 구간에도
     대응하지 않아 화면에 구간을 적기 시작한 지금은 쓸 수 없다. */
  return { ...c, stops,
    meters: stops.reduce((sum, s) => sum + s.legM, 0),
    minutes: stops.reduce((sum, s) => sum + s.legMin, 0) };
}).filter(c => c.stops.length >= 3);

/* 인근 편의시설(U-ST-07)은 여기 있지 않다. 공공시설 탭(S02)과 같은 데이터를 봐야 하므로
   `data/facilities.js` 의 NEARBY 를 쓴다 — 두 탭이 같은 시설을 다른 거리로 말하면 안 된다.
   이 파일이 facilities.js 를 import 하지 않는 것은 순환 참조를 만들지 않기 위해서다
   (facilities.js 가 여기서 ANCHOR 를 가져간다). 둘을 합치는 일은 화면(MainApp)이 한다. */

/* 축제는 여기 있지 않다. 6건이 32개소에 흩어져 있고 둘러보기 탭이 전체를 다루므로
   `data/districts.js` 가 소유한다. 상점가 탭의 우리 축제 배너(U-FT-03)도 거기서
   `CURRENT_FESTIVAL` 로 가져온다 — 두 탭이 같은 축제를 다른 상태로 말하면 안 된다. */

export const DUNJEON = { anchor: ANCHOR, district: DISTRICT, chips: CHIPS, stores: STORES,
  popular: POPULAR, newStores: NEW_STORES, courses: COURSES };
export default DUNJEON;
