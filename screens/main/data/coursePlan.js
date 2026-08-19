import { WALK_M_PER_MIN } from "../config.js";

/* 골목 한바퀴 코스의 **순서를 짜는 곳** (U-DC-03).
 *
 * 여기에는 두 가지가 있다. 하나는 코스를 만들 때 4곳을 잇는 일(dunjeon.js 가 쓴다),
 * 다른 하나는 사용자가 순서를 벗어났을 때 남은 곳을 다시 잇는 일(S08 화면이 쓴다).
 * 둘은 **같은 알고리즘이어야 한다** — 추천 순서와 다시 짠 순서가 다른 규칙으로 나오면
 * 같은 코스가 두 가지 논리로 안내되고, 사용자는 어느 쪽이 맞는지 알 수 없다.
 *
 * ── 왜 다시 짜야 하나 ─────────────────────────────────────────────────────
 * 방문 순서를 강제하지 않는다는 것이 이 기능의 전제다 (courseVisits.js 머리말) —
 * 문 닫은 가게를 건너뛰는 일은 흔하다. 그런데 ①을 들르고 ③으로 갔는데도 남은 안내가
 * "②가 다음 차례, ②까지 3분"이라고 말하면, 그 3분은 **①에서 잰 값**이라 지금 서 있는
 * ③에서는 맞지 않는다. 순서를 벗어나도 된다고 해놓고 벗어나면 틀린 수를 주는 셈이다.
 *
 * 그래서 방문 표시를 누를 때마다 **그 곳을 기준으로** 남은 곳을 다시 잇고 구간을 다시 잰다.
 *
 * ── 방문한 곳은 실제로 걸은 순서로 앞에 남는다 ────────────────────────────
 * 목록에서 빼지 않는다 (빼면 몇 번째였는지 알 수 없다). 다만 번호는 **추천 순번이 아니라
 * 실제로 걸은 차례**가 된다 — ③을 두 번째로 갔다면 그 줄은 ②다. 코스를 도는 중에 알고
 * 싶은 것은 "추천안에서 몇 번이었나"가 아니라 "내가 몇 번째로 갔나"이기 때문이다.
 * 지도의 순번 핀도 같은 배열을 보므로 목록과 지도의 숫자가 어긋나지 않는다.
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

/* 총합은 **구간의 합이다.** 총 거리를 따로 구하면 화면에 적힌 구간들을 더한 값과 어긋나고,
   사용자가 더해보고 틀린 화면이라고 읽는다. */
export function totals(order) {
  return {
    meters: order.reduce((sum, s) => sum + s.legM, 0),
    minutes: order.reduce((sum, s) => sum + s.legMin, 0),
  };
}

/* 방문 기록에 맞춰 순서를 다시 짠다.
     stops       코스가 추천한 순서 (구간 값이 이미 붙어 있다)
     visitedIds  사용자가 누른 **차례대로**의 id 배열 (courseVisits.js 가 그렇게 보관한다)
     origin      QR 지점

   아무 것도 누르지 않았으면 추천 순서를 **그대로 돌려준다.** 다시 계산하지 않는다 —
   같은 결과가 나오리라 기대할 수는 있지만, 부동소수 동률에서 갈리면 화면을 열기만 해도
   순서가 흔들린 것처럼 보인다. "한 번도 누르지 않으면 예전과 똑같다"는 것이 이 기능의
   약속이고(CourseDetail 머리말), 그 약속은 계산이 아니라 구조로 지킨다. */
export function planCourse(stops = [], visitedIds = [], origin) {
  if (!stops.length || !visitedIds.length) {
    return { order: stops, replanned: false, ...totals(stops) };
  }

  const byId = new Map(stops.map(s => [s.id, s]));
  /* 이 코스에 없는 id 는 버린다 — 기록은 세션에 남고 코스 자료는 바뀔 수 있다 */
  const walked = visitedIds.map(id => byId.get(id)).filter(Boolean);
  const doneIds = new Set(walked.map(s => s.id));
  const rest = stops.filter(s => !doneIds.has(s.id));

  /* 남은 곳은 **마지막으로 들른 곳**에서부터 잇는다. 그것이 지금 서 있는 자리다 */
  const from = walked[walked.length - 1] || origin;
  const order = withLegs([...walked, ...nearestChain(rest, from)], origin);

  const replanned = order.some((s, i) => stops[i] && stops[i].id !== s.id);
  return { order, replanned, ...totals(order) };
}
