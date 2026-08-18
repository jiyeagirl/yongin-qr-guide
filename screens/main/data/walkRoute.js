/* 도보 경로 제공자 (S07 길찾기 · U-NV-01 / 04 / 05).
 *
 * 화면(RouteView.jsx)은 이 파일의 `requestWalkRoute` 하나만 부른다. 경로가 어디서 오는지 —
 * 실 API 인지, 캐시인지, 아래의 예시 경로인지 — 는 화면이 알 필요가 없고, 알면 안 된다.
 * 연동 시 고칠 파일이 여기 하나로 끝나야 한다 (facilities.js · dunjeon.js · districts.js 와 같은 자리다).
 *
 * ══ 먼저, 카카오 "도보" 길찾기 API 에 대해 ══════════════════════════════════
 *
 * 기능명세서 U-NV-01 은 "카카오맵 도보 길찾기 API"라고 적고 있으나, **카카오가 공개한
 * 길찾기 REST API 는 자동차 경로다.** 보행자 경로는 카카오맵 앱 안의 기능이고 공개 API 가 없다.
 * 게다가 REST 키는 브라우저에 넣을 수 없다 (screens/README.md — JavaScript 키만 공개 전제다).
 *
 * 그래서 실 연동은 어느 제공자를 쓰든 **서버 프록시 한 단계를 반드시 거친다**:
 *
 *     브라우저 ──▶ 우리 서버 (REST 키 보관 · 캐시 · 쿼터)  ──▶ 경로 제공자
 *                  WALK_ROUTE_ENDPOINT                         카카오 프록시 / TMAP 보행자 API 등
 *
 * `config.js` 의 `WALK_ROUTE_ENDPOINT` 가 비어 있는 동안에는 아래 예시 경로가 그 자리를 채운다.
 * 주소를 채우면 그때부터 실제 응답을 쓰고, 실패하면 U-NV-04 폴백으로 떨어진다.
 * **화면 코드는 어느 쪽이든 손대지 않는다.**
 *
 * ══ 돌려주는 것 ═══════════════════════════════════════════════════════════
 *
 *   { source, distance, duration, path, steps, straight, reason }
 *
 *   source    "api" 실 응답 · "sample" 예시 경로 · "fallback" 직선 안내(U-NV-04)
 *   distance  총 도보 거리(m)          duration  예상 소요(초)
 *   path      [{lat,lng}] 지도에 그을 선
 *   steps     [{type, dist, road, lat, lng, name, dot}] 구간별 안내 (U-NV-03)
 *             type 은 RouteSteps 의 7종이다. dist 는 **직전 안내 지점부터 이 지점까지**의 거리다
 *             ("50m 앞에서 좌회전" = 50m 걸은 뒤 좌회전).
 *   straight  true 면 path 가 실제 길이 아니라 출발-도착 직선이다 (지도가 점선으로 낮춰 긋는다)
 */

import { ANCHOR } from "./dunjeon.js";
import { WALK_M_PER_MIN, WALK_ROUTE_ENDPOINT, WALK_ROUTE_QUOTA, WALK_ROUTE_TIMEOUT, SAMPLE_ROUTE_DELAY } from "../config.js";

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos((ANCHOR.lat * Math.PI) / 180);

const rad = d => (d * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;

/* 평면 근사로 충분하다. 이 서비스의 경로는 길어야 2km 남짓이고, 그 범위에서 위경도를
   미터로 곧장 환산해도 오차가 1m 아래다. Haversine 을 쓸 이유가 없다. */
function vec(a, b) {
  return { x: (b.lng - a.lng) * M_PER_DEG_LNG, y: (b.lat - a.lat) * M_PER_DEG_LAT };
}
export function distanceM(a, b) {
  const v = vec(a, b);
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
/* 방위 — 북 0도, 시계방향. 데이터 파일들의 bearing 과 같은 규약이다 */
function bearing(a, b) {
  const v = vec(a, b);
  return (deg(Math.atan2(v.x, v.y)) + 360) % 360;
}
function move(p, dist, brg) {
  const r = rad(brg);
  return {
    lat: +(p.lat + (Math.cos(r) * dist) / M_PER_DEG_LAT).toFixed(6),
    lng: +(p.lng + (Math.sin(r) * dist) / M_PER_DEG_LNG).toFixed(6),
  };
}

const COMPASS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
export function compassOf(brg) {
  return COMPASS[Math.round(((brg % 360) + 360) % 360 / 45) % 8];
}

/* ── 캐시 (U-NV-05) ────────────────────────────────────────────────────────
   같은 목적지를 다시 눌렀을 때 API 를 또 부르지 않는다. 목록 ↔ 상세 ↔ 길찾기를
   오가는 것은 이 서비스에서 가장 흔한 동선이라, 캐시가 없으면 한 사람이 한 곳을 찾는 데
   호출이 서너 번 나간다.

   메모리 + sessionStorage 두 겹이다. 메모리만 두면 새로고침에 날아가고, localStorage 에
   두면 경로 데이터가 기기에 무기한 남는다 — 경로는 그날 그 자리에서만 쓰는 정보다.
   좌표는 소수점 5자리(약 1m)로 끊어 키를 만든다. 그보다 잘게 쪼개면 같은 곳인데 키가 갈린다. */
const CACHE_KEY = "yongin.walkroute.v1";
const mem = new Map();

const keyOf = (o, d) => `${o.lat.toFixed(5)},${o.lng.toFixed(5)}>${d.lat.toFixed(5)},${d.lng.toFixed(5)}`;

/* 저장소 접근은 통째로 막힐 수 있다 (사파리 비공개 모드, 쿠키 차단). 캐시가 없다고
   길찾기가 실패하면 안 되므로 실패를 조용히 삼킨다 — 그때는 메모리 캐시만 남는다. */
function store(name) {
  try {
    const s = window[name];
    s.setItem("__t", "1"); s.removeItem("__t");
    return s;
  } catch { return null; }
}

function readCache(key) {
  if (mem.has(key)) return mem.get(key);
  const s = store("sessionStorage");
  if (!s) return null;
  try {
    const all = JSON.parse(s.getItem(CACHE_KEY) || "{}");
    if (all[key]) { mem.set(key, all[key]); return all[key]; }
  } catch { /* 깨진 값은 없는 것으로 본다 */ }
  return null;
}

function writeCache(key, value) {
  mem.set(key, value);
  const s = store("sessionStorage");
  if (!s) return;
  try {
    const all = JSON.parse(s.getItem(CACHE_KEY) || "{}");
    all[key] = value;
    s.setItem(CACHE_KEY, JSON.stringify(all));
  } catch { /* 용량 초과 등 — 메모리 캐시는 이미 채웠으므로 그대로 진행한다 */ }
}

export function clearRouteCache() {
  mem.clear();
  const s = store("sessionStorage");
  if (s) { try { s.removeItem(CACHE_KEY); } catch { /* 지우지 못해도 할 일이 없다 */ } }
}

/* ── 쿼터 (U-NV-05) ────────────────────────────────────────────────────────
   무료 한도는 1일 1,000건이다. 한도를 넘기면 제공자가 오류를 내는데, 그때 사용자가 보는 것은
   "길찾기가 안 되는 서비스"다. 넘기기 전에 우리가 먼저 멈추고 직선 안내로 떨어뜨린다 (U-NV-04).

   **이 카운터는 기기별이라 진짜 한도 관리가 아니다.** 한도는 앱 단위이므로 실제 차단은
   서버(WALK_ROUTE_ENDPOINT)가 해야 한다. 여기 있는 것은 한 기기가 폭주하는 경우를 막는
   1차 방어이고, 서버 쪽 429 응답도 같은 폴백으로 처리한다 (아래 callApi).
   날짜가 바뀌면 0 으로 돌아간다. */
const QUOTA_KEY = "yongin.walkroute.quota";
const today = () => new Date().toISOString().slice(0, 10);

export function quotaState() {
  const s = store("localStorage");
  if (!s) return { date: today(), used: 0, limit: WALK_ROUTE_QUOTA };
  try {
    const q = JSON.parse(s.getItem(QUOTA_KEY) || "{}");
    if (q.date === today()) return { date: q.date, used: q.used || 0, limit: WALK_ROUTE_QUOTA };
  } catch { /* 깨진 값은 새로 시작한다 */ }
  return { date: today(), used: 0, limit: WALK_ROUTE_QUOTA };
}

function spendQuota() {
  const q = quotaState();
  const s = store("localStorage");
  if (s) { try { s.setItem(QUOTA_KEY, JSON.stringify({ date: q.date, used: q.used + 1 })); } catch { /* 무시 */ } }
}

/* ── 실 API 어댑터 ────────────────────────────────────────────────────────
   응답을 우리 형식으로 옮기는 곳. 제공자를 바꾸면 이 함수 하나만 다시 쓴다.

   기본 형태는 카카오모빌리티 길찾기 응답을 따랐다 (프록시가 그대로 중계한다고 보고):
     routes[0].summary.{distance,duration}
     routes[0].sections[].roads[].vertexes  [x1,y1,x2,y2,...]  ← **경도가 먼저다**
     routes[0].sections[].guides[]          {x,y,distance,type,name}

   TMAP 보행자 경로(GeoJSON)를 쓸 경우 features[] 의 LineString 과 Point 를 같은 형식으로
   옮기면 된다 — 화면과 캐시·쿼터는 그대로 쓴다. */

/* 제공자의 안내 코드 → RouteSteps 의 7종.
   **연동 시 제공자 문서로 반드시 검증할 것.** 코드 체계는 제공자마다 다르고 개정도 된다.
   표에 없는 코드는 직진으로 떨어뜨린다 — 모르는 코드에 엉뚱한 회전을 붙이는 것보다
   "직진"이 덜 위험하다 (사용자는 지도의 선을 함께 본다). */
const GUIDE_TYPE = {
  1: "straight", 2: "left", 3: "right", 5: "slight-left", 6: "slight-right",
  100: "arrive", 101: "start",
};

function normalize(json, origin, dest) {
  const r = json && json.routes && json.routes[0];
  if (!r) throw new Error("경로 응답에 routes 가 없습니다");
  /* result_code 0 이 정상. 104(출발-도착 5m 이내) 같은 코드는 경로가 없는 것이므로 폴백으로 보낸다 */
  if (r.result_code != null && r.result_code !== 0) {
    throw new Error(r.result_msg || `경로를 찾지 못했습니다 (${r.result_code})`);
  }

  const path = [];
  const guides = [];
  (r.sections || []).forEach(sec => {
    (sec.roads || []).forEach(road => {
      const v = road.vertexes || [];
      for (let i = 0; i + 1 < v.length; i += 2) path.push({ lng: v[i], lat: v[i + 1] });
    });
    (sec.guides || []).forEach(g => guides.push(g));
  });
  if (path.length < 2) throw new Error("경로 좌표가 비어 있습니다");

  const steps = [{ type: "start", dist: 0, road: origin.name, lat: origin.lat, lng: origin.lng, dot: false }];
  guides.forEach(g => {
    const type = GUIDE_TYPE[g.type] || "straight";
    if (type === "start") return;                       /* 출발은 위에서 이미 넣었다 */
    steps.push({
      type, dist: Math.round(g.distance || 0), road: g.name || "",
      lat: g.y, lng: g.x,
      name: type === "arrive" ? dest.name : undefined,
      dot: type !== "arrive",
    });
  });

  const summary = r.summary || {};
  return {
    source: "api",
    distance: Math.round(summary.distance || totalOf(path)),
    duration: Math.round(summary.duration || (totalOf(path) / WALK_M_PER_MIN) * 60),
    path, steps, straight: false,
  };
}

async function callApi(origin, dest) {
  /* 브라우저가 REST 키를 들지 않는다. 프록시가 키를 붙이고 캐시·쿼터도 서버에서 한 번 더 건다 */
  const url = `${WALK_ROUTE_ENDPOINT}?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}&priority=RECOMMEND`;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), WALK_ROUTE_TIMEOUT) : null;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl && ctrl.signal });
    if (res.status === 429) throw new Error("경로 호출 한도를 넘었습니다");
    if (!res.ok) throw new Error(`경로 서버 응답 ${res.status}`);
    return normalize(await res.json(), origin, dest);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ── 예시 경로 (엔드포인트가 없을 때) ──────────────────────────────────────
   더미 데이터 셋(facilities · dunjeon · districts)과 같은 성격이다. 좌표를 손으로 찍지 않고
   규칙으로 만들어, 목록의 "약 320m"와 지도의 선이 서로 어긋나지 않게 한다.

   골목을 계단식으로 오른다. 도보 경로가 직선이 아닌 이유가 실제로 그것이기 때문이다 —
   길은 대체로 두 축으로 나 있고, 목적지가 대각선 방향이면 두 축을 번갈아 타게 된다.
   그래서 도보 거리는 직선거리보다 20~35% 길게 나오는데, 이 값은 실제 도보 경로의
   우회율과 비슷하다. 목록의 직선거리(U-FC-06)와 여기 총 거리가 다른 것은 오류가 아니라
   **그게 맞는 것**이며, 화면이 그 차이를 한 줄로 설명한다.

   결정적이다 — 같은 목적지는 새로고침해도 같은 경로가 나온다 (검수 가능). */

/* 둔전 일대 도로 축. 정북이 아니라 북북동으로 기울어 있다 (위성지도의 골목 방향).
   이 각도 하나가 "생성한 티가 나는 격자"와 "그럴듯한 골목"을 가른다. */
const GRID_BEARING = 24;

/* 축별 길 이름. 세로축(GRID)과 가로축(GRID+90)에 다른 묶음을 쓴다 —
   한 묶음에서 뽑으면 좌회전했는데 같은 길 이름이 계속 나오는 일이 생긴다. */
const ROADS_MAIN = ["둔전로", "둔전1로", "포곡로", "둔전중앙로"];
const ROADS_CROSS = ["둔전2로", "금어로", "삼계로", "에버랜드로"];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
/* 씨앗은 목적지 좌표에서 뽑는다 — id 를 쓰면 데이터가 바뀔 때 경로가 통째로 달라진다 */
function seedOf(dest) {
  return Math.abs(Math.round(dest.lat * 1e6) * 31 + Math.round(dest.lng * 1e6)) >>> 0;
}

function totalOf(path) {
  let sum = 0;
  for (let i = 1; i < path.length; i++) sum += distanceM(path[i - 1], path[i]);
  return sum;
}

/* 한 축의 이동량을 n 조각으로 나눈다. **합은 반드시 원래 값과 같다** — 합이 틀어지면
   마지막 점을 목적지에 맞추느라 엉뚱한 대각선 구간이 하나 생긴다.

   조각 하나가 0 에 가까워지지 않게 막는 것이 이 함수의 핵심이다. 목적지가 도로 축과
   정확히 같은 방향에 있으면(실제로 그런 시설이 있다) 직교축 이동량이 0 이 되는데,
   그때 조각을 그냥 반으로 자르면 길이 0 인 구간 둘이 나와 1.4km 를 한 번도 안 꺾고
   직선으로 걷는 경로가 만들어진다. +q / -q 로 갈라 두면 합은 그대로 0 이면서
   골목을 한 번 돌아 나가는 모양이 된다 — 실제 도보 경로가 그렇게 생겼다. */
function splitAxis(total, n, span, rand) {
  if (n <= 1) return [total];
  const q = span * (0.09 + rand() * 0.09) * (rand() < 0.5 ? -1 : 1);
  const min = Math.max(18, span * 0.05);
  let a = total / 2 + q, b = total - a;
  if (Math.abs(a) < min) { a = (a < 0 ? -min : min); b = total - a; }
  if (Math.abs(b) < min) { b = (b < 0 ? -min : min); a = total - b; }
  return [a, b];
}

function synthesize(origin, dest) {
  const rand = rng(seedOf(dest));
  const straightDist = distanceM(origin, dest);
  const a = rad(bearing(origin, dest) - GRID_BEARING);
  /* 격자 두 축으로 분해 — u 는 도로 축, v 는 그와 직교하는 축 */
  const du = straightDist * Math.cos(a);
  const dv = straightDist * Math.sin(a);

  /* 꺾는 횟수는 거리에 따른다. 200m 를 네 번 꺾으면 골목이 아니라 미로이고,
     1.5km 를 한 번만 꺾으면 지도에서 대각선 직선처럼 보인다. */
  const turns = straightDist < 260 ? 1 : straightDist < 700 ? 2 : 3;

  /* 두 축을 **반드시 번갈아** 탄다. 같은 축이 연달아 오면 두 구간이 일직선이 되어
     그 사이 지점이 "꺾이지 않는 꺾임"이 된다 (지도에는 점만 찍히고 안내는 직진이라고 한다).
     어느 축부터 탈지는 목적지가 더 멀리 있는 쪽이다 — 실제로 그렇게 걷는다. */
  const axes = [];
  const first = Math.abs(du) >= Math.abs(dv) ? "u" : "v";
  for (let i = 0; i <= turns; i++) axes.push(i % 2 === 0 ? first : (first === "u" ? "v" : "u"));

  const uSplit = splitAxis(du, axes.filter(x => x === "u").length, straightDist, rand);
  const vSplit = splitAxis(dv, axes.filter(x => x === "v").length, straightDist, rand);

  let ui = 0, vi = 0;
  const legs = axes.map(axis => {
    const len = axis === "u" ? uSplit[ui++] : vSplit[vi++];
    const base = axis === "u" ? GRID_BEARING : GRID_BEARING + 90;
    return { len: Math.abs(len), brg: (base + (len < 0 ? 180 : 0) + 360) % 360, axis };
  });

  /* 마지막 구간의 끝을 목적지 좌표에 정확히 맞춘다. 조각 합이 부동소수점 오차로
     몇 m 어긋나면 도착 핀과 선 끝이 벌어져 보인다. */
  const path = [{ lat: origin.lat, lng: origin.lng }];
  legs.forEach((leg, i) => {
    const from = path[path.length - 1];
    path.push(i === legs.length - 1 ? { lat: dest.lat, lng: dest.lng } : move(from, leg.len, leg.brg));
  });

  /* 길 이름은 **구간마다 먼저 정해 둔다.** 안내 항목을 만들면서 그때그때 뽑으면,
     "삼계로 방향으로 좌회전"이라고 안내해 놓고 다음 줄에서 그 길을 에버랜드로라고 부르게 된다.
     같은 축이면 이름 묶음도 같다 — 좌우로 꺾을 때마다 이름의 성격이 바뀌어야 격자로 읽힌다. */
  const roads = legs.map(leg => {
    const pool = leg.axis === "u" ? ROADS_MAIN : ROADS_CROSS;
    return pool[Math.floor(rand() * pool.length) % pool.length];
  });

  /* 구간 → 안내. 각 안내 항목은 "이만큼 걸은 뒤 이렇게 하라"이므로,
     항목의 거리는 **그 항목의 동작을 하기 전에 걷는 거리**다 (U-NV-03 의 "50미터 앞에서 우회전").
     회전 항목의 길 이름은 지금 걷는 길이 아니라 **꺾어 들어갈 길**이다 — 그래야 다음 줄과 이어진다. */
  const steps = [{ type: "start", dist: 0, road: origin.name, lat: origin.lat, lng: origin.lng, dot: false }];
  for (let i = 0; i < legs.length; i++) {
    const from = path[i], to = path[i + 1];
    const len = distanceM(from, to);
    const last = i === legs.length - 1;
    const atEnd = last
      ? { type: "arrive", name: dest.name, road: roads[i], lat: to.lat, lng: to.lng, dot: false }
      : { type: turnType(bearing(from, to), bearing(to, path[i + 2])),
          road: `${roads[i + 1]} 방향`, lat: to.lat, lng: to.lng, dot: true };

    /* 긴 구간에는 중간 직진 안내를 하나 넣는다. 300m 를 한 줄로 적으면 그 사이 교차로마다
       "이 길이 맞나" 싶어지는데, 실제 내비게이션이 큰 교차로에서 직진을 알려주는 이유가 그것이다. */
    if (len > 240) {
      const cut = len * (0.45 + rand() * 0.2);
      steps.push({ type: "straight", dist: Math.round(cut), road: roads[i],
        ...move(from, cut, bearing(from, to)), dot: true });
      steps.push({ ...atEnd, dist: Math.round(len - cut) });
      continue;
    }
    steps.push({ ...atEnd, dist: Math.round(len) });
  }

  const distance = Math.round(totalOf(path));
  return {
    source: "sample",
    distance,
    duration: Math.round((distance / WALK_M_PER_MIN) * 60),
    path, steps, straight: false,
  };
}

/* 두 구간의 방위차 → 회전 종류. 12도 미만은 길이 살짝 휜 것이지 회전이 아니다 */
function turnType(from, to) {
  let d = ((to - from + 540) % 360) - 180;
  if (Math.abs(d) < 12) return "straight";
  if (Math.abs(d) < 40) return d > 0 ? "slight-right" : "slight-left";
  return d > 0 ? "right" : "left";
}

/* ── 폴백 (U-NV-04) ───────────────────────────────────────────────────────
   경로를 못 받았을 때 화면을 비우지 않는다. 직선거리와 방향은 좌표만으로 언제나 계산되므로,
   "북서쪽으로 약 320m" 만큼은 반드시 말할 수 있다. 턴바이턴 목록은 만들지 않는다 —
   없는 정보를 지어내는 쪽이 안내가 없는 것보다 나쁘다.

   지도의 선도 이때는 점선이다 (straight: true). 실선은 "이 길로 가라"라는 뜻인데
   저것은 방향만 맞는 직선이다. */
function fallback(origin, dest, reason) {
  const distance = Math.round(distanceM(origin, dest));
  const brg = bearing(origin, dest);
  return {
    source: "fallback",
    distance,
    duration: Math.round((distance / WALK_M_PER_MIN) * 60),
    path: [{ lat: origin.lat, lng: origin.lng }, { lat: dest.lat, lng: dest.lng }],
    steps: [],
    straight: true,
    compass: compassOf(brg),
    reason,
  };
}

/* 검수용 강제 모드 — `?route=fallback` 으로 열면 U-NV-04 화면을 볼 수 있다.
   폴백은 평소에 안 보이는 화면이라(실제로 API 가 죽어야 나온다) 이 스위치가 없으면
   구현했는지 확인할 방법이 없다. config.js 의 TODAY 와 같은 성격의 검수 장치다.
     ?route=fallback  항상 직선 안내      ?route=sample  엔드포인트가 있어도 예시 경로
     ?route=api       엔드포인트 강제 호출 (없으면 그대로 폴백) */
function forcedMode() {
  try {
    const m = /[?&]route=(fallback|sample|api)\b/.exec(location.search);
    return m ? m[1] : null;
  } catch { return null; }
}

const wait = ms => new Promise(ok => setTimeout(ok, ms));

/**
 * 도보 경로 한 건 (U-NV-01). 출발은 QR 지점 고정, 도착은 시설 또는 점포다.
 * 실패하지 않는다 — 어떤 경우에도 폴백(U-NV-04)이 돌아온다. 화면에 오류 처리를 두지 않기 위해서다.
 */
export async function requestWalkRoute(origin, dest) {
  if (!origin || !dest || !dest.lat || !dest.lng) return fallback(origin || ANCHOR, dest || ANCHOR, "좌표 없음");

  const mode = forcedMode();
  if (mode === "fallback") return fallback(origin, dest, "검수용 폴백 모드");

  const key = keyOf(origin, dest);
  const hit = readCache(key);
  if (hit) return hit;                                  /* U-NV-05 — 같은 경로를 두 번 부르지 않는다 */

  const useApi = mode === "api" || (mode !== "sample" && Boolean(WALK_ROUTE_ENDPOINT));

  if (useApi) {
    const q = quotaState();
    if (q.used >= q.limit) return fallback(origin, dest, "오늘 경로 안내 한도를 넘었습니다");
    try {
      spendQuota();                                     /* 응답 전에 센다 — 실패한 호출도 한도를 쓴다 */
      const r = await callApi(origin, dest);
      writeCache(key, r);
      return r;
    } catch (e) {
      /* 여기서 예시 경로로 떨어뜨리지 않는다. 엔드포인트가 있다는 것은 실서비스라는 뜻이고,
         그때 지어낸 골목을 실제 안내처럼 보여주면 사람을 엉뚱한 길로 보낸다. */
      return fallback(origin, dest, e.name === "AbortError" ? "경로 서버 응답이 늦습니다" : (e.message || "경로를 가져오지 못했습니다"));
    }
  }

  /* 예시 경로. 계산은 즉시 끝나지만 일부러 조금 늦춘다 — 실 API 는 수백 ms 가 걸리고,
     그 사이의 로딩 상태가 화면에 실제로 있어야 검수와 구현이 가능하다. */
  if (SAMPLE_ROUTE_DELAY > 0) await wait(SAMPLE_ROUTE_DELAY);
  const r = synthesize(origin, dest);
  writeCache(key, r);
  return r;
}
