import { WALK_M_PER_MIN } from "../config.js";

/* 골목 한바퀴 코스의 **순서를 짜는 곳** (U-DC-03).
 *
 * 여기에는 두 가지가 있다. 하나는 코스를 만들 때 4곳을 잇는 일(dunjeon.js 가 쓴다),
 * 다른 하나는 **사용자가 끌어 옮긴 순서**를 화면이 깔 배열로 옮기는 일(S08 이 쓴다).
 *
 * ── 순서를 화면이 자동으로 바꾸지 않는다 (2026-08-19 뒤집음) ────────────────
 * 전에는 [방문 완료]를 누를 때마다 그 곳을 기준으로 남은 곳을 가까운 순으로 다시 이었고,
 * 방문한 곳은 "실제로 걸은 차례"로 번호가 바뀌었다. 계산은 맞았다 — ①을 들르고 ③으로
 * 갔는데 "②까지 3분"이라고 말하면 그 3분은 ①에서 잰 값이라 실제로 틀린 수다.
 *
 * 그런데 그 답이 **목록을 통째로 뒤바꾸는 것**이었다. 사용자가 누른 것은 "여기 들렀다"는
 * 표시 하나인데, 그 한 번에 번호가 옮겨 붙고 줄 차례가 바뀌고 총 시간까지 달라졌다.
 * 요청하지 않은 변화가 동작에 딸려 오면, 다음에 그 단추를 누를 때 무슨 일이 일어날지
 * 예측할 수 없다 — 실제로 그 지점의 피드백을 받았다.
 *
 * 그래서 역할을 갈랐다:
 *
 *   방문 표시   표시만 한다. 순서·번호·총 시간 어느 것도 건드리지 않는다.
 *   순서        기본은 코스가 추천한 그대로이고, **바꾸는 것은 사용자뿐**이다 —
 *               손잡이를 끌어 옮긴다 (courseOrder.js 에 남는다).
 *
 * 출발지는 여기서 다루지 않는다. 이 코스의 출발점은 언제나 QR 지점이고, "지금 어디서
 * 출발하나"는 실제로 길을 물을 때(S07 길찾기) 정해진다 — 그 화면이 출발지를 고르게 한다.
 */

/* 두 지점 사이의 거리(m). 평면 근사로 충분하다 — 코스는 골목 한 구역 안이라
   위경도를 미터로 곧장 환산해도 오차가 1m 아래다 (walkRoute.js 의 distanceM 과 같은 근거).
   경도 축척은 기준점의 위도에서 뽑는다. 상수로 박지 않는 이유는 이 파일이 둔전 전용이
   아니어서다 — 다른 상점가의 코스가 붙어도 그대로 쓴다. */
export function gapM(a, b) {
  const x = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  const y = (b.lat - a.lat) * 111320;
  return Math.hypot(x, y);
}

/* 시작점에서 **탐욕적 최근접 이웃**으로 잇는다. 그 다음은 직전에 고른 곳에서 가장 가까운 곳.
   예전에는 거리순으로 앞의 몇 곳을 그냥 잘랐는데, 그러면 시작점에서의 거리만 비슷할 뿐
   서로는 반대편일 수 있어서 붙어 있는 순번 사이가 700m 넘게 벌어졌다. "골목 한바퀴"인데
   ①에서 ②로 12분이 되는 식이다. */
export function nearestChain(pool, from, count = pool.length) {
  const rest = pool.slice();
  const out = [];
  let at = from;
  while (out.length < count && rest.length) {
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (gapM(at, rest[i]) < gapM(at, rest[best])) best = i;
    }
    at = rest[best];
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}

/* 구간 값을 붙인다.
     legM   직전 지점에서 여기까지의 도보 거리. 첫 곳은 출발점(QR 지점)에서다.
     legMin 그 거리를 분으로 환산한 값.

   **첫 구간만 좌표가 아니라 점포의 dist 를 쓴다.** 목록·상세·길찾기가 그 가게까지의
   거리로 이미 그 값을 말하고 있어서, 여기서만 다른 수를 적으면 같은 거리가 화면마다
   달라진다. 가게 사이 구간은 지도의 점선이 좌표를 잇고 있으므로 좌표에서 잰다. */
export function withLegs(order, origin) {
  return order.map((s, i) => {
    const legM = Math.round(i === 0
      ? (s.dist != null ? s.dist : gapM(origin, s))
      : gapM(order[i - 1], s));
    return { ...s, legM, legMin: Math.max(1, Math.round(legM / WALK_M_PER_MIN)) };
  });
}

/* 사용자가 정한 차례로 늘어놓는다. 기록에 없는 곳(코스 자료가 바뀌어 새로 생긴 곳)은
   뒤에 붙인다 — 빠뜨리면 화면에서 통째로 사라지고, 그건 순서 조정이 아니라 삭제다. */
export function orderStops(stops = [], orderIds = []) {
  if (!orderIds.length) return stops;
  const byId = new Map(stops.map(s => [s.id, s]));
  const picked = orderIds.map(id => byId.get(id)).filter(Boolean);
  const seen = new Set(picked.map(s => s.id));
  return picked.concat(stops.filter(s => !seen.has(s.id)));
}

/* 한 곳을 다른 자리로 옮긴다. 목록 밖으로는 나가지 않는다 — 끌다가 화면 위아래로 벗어나도
   맨 위·맨 아래에서 멈춘다. 감싸 돌게 두면 위로 끌다가 맨 아래에 가 붙는다.
   `to` 가 지금 자리와 같으면 **같은 배열을 그대로 돌려준다** — 부르는 쪽이 그것으로
   "바뀐 것이 없다"를 알고 저장을 건너뛴다 (끌기는 픽셀마다 부른다). */
export function moveStop(order = [], id, to) {
  const i = order.findIndex(s => s.id === id);
  const j = Math.min(Math.max(to, 0), order.length - 1);
  if (i < 0 || i === j) return order;
  const out = order.slice();
  out.splice(j, 0, out.splice(i, 1)[0]);
  return out;
}

/* 총합은 **구간의 합이다.** 총 거리를 따로 구하면 화면에 적힌 구간들을 더한 값과 어긋나고,
   사용자가 더해보고 틀린 화면이라고 읽는다. */
export function totals(order) {
  return {
    meters: order.reduce((sum, s) => sum + s.legM, 0),
    minutes: order.reduce((sum, s) => sum + s.legMin, 0),
  };
}

/* 사용자가 정한 순서를 화면이 깔 배열로 옮긴다.
     stops     코스가 추천한 순서 (구간 값이 이미 붙어 있다)
     orderIds  사용자가 끌어 옮긴 차례 (courseOrder.js 가 세션에 보관한다)
     anchor    QR 지점 — 첫 구간의 출발점이다

   손댄 것이 없으면 추천 순서를 **그대로 돌려준다.** 다시 계산하지 않는다 — 같은 결과가
   나오리라 기대할 수는 있지만, 부동소수 동률에서 갈리면 화면을 열기만 해도 순서가 흔들린
   것처럼 보인다. "손대지 않으면 코스가 추천한 그대로"라는 것이 이 화면의 약속이고,
   그 약속은 계산이 아니라 구조로 지킨다.

   돌려주는 값:
     order     화면과 지도가 함께 보는 배열 (구간 값이 다시 붙어 있다)
     adjusted  사용자가 손댄 상태인가 ([추천 순서로] 를 보일지 정한다)
     minutes·meters  구간의 합 (totals) */
export function planCourse(stops = [], orderIds = [], anchor) {
  if (!stops.length || !orderIds.length) {
    return { order: stops, adjusted: false, ...totals(stops) };
  }
  const order = withLegs(orderStops(stops, orderIds), anchor);
  const adjusted = order.some((s, i) => stops[i] && stops[i].id !== s.id);
  return { order, adjusted, ...totals(order) };
}
