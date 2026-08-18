import React from "react";

/* 해시 라우터 — 셸 위에 상세 화면을 덮기 위한 최소한의 것.
 *
 *   #/ 또는 없음       지도 + 탭 3개 (셸 그대로)
 *   #/facility/fc-001  S05 시설 상세
 *   #/store/dj-042     S06 점포 상세
 *   #/course/cs-eat    S08 골목 한바퀴 코스 상세
 *   #/festival/ft-dunjeon  S09 축제 상세
 *   #/route/facility/fc-001  S07 길찾기 (도착지 종류 + id)
 *
 * 라우팅 라이브러리를 넣지 않는다. 이 저장소에는 빌드가 없고(브라우저가 Babel 로 JSX 를
 * 실시간 변환한다) 첫 로딩이 이미 4.7MB 다. 경로가 세 개뿐인데 여기에 번들을 더할 이유가 없다.
 *
 * ── 경로(pathname)가 아니라 해시인 이유 ─────────────────────────────────
 * 정적 호스팅이다. /facility/fc-001 같은 경로를 만들면 그 주소를 새로고침하거나 공유했을 때
 * 서버가 404 를 낸다 (Vercel 에 rewrite 규칙이 필요한데 vercel.json 은 프레임워크 없음으로
 * 잡혀 있다). 해시는 서버로 가지 않으므로 그 문제가 없다.
 *
 * ── 왜 React 상태가 아니라 URL 인가 ─────────────────────────────────────
 * QR 로 들어온 모바일 웹에서 뒤로 가는 주된 수단은 화면 안의 버튼이 아니라 **브라우저(또는 OS)의
 * 뒤로가기**다. React 상태로만 관리하면 그 뒤로가기가 상세를 닫는 대신 서비스를 통째로 벗어난다.
 * history 에 항목을 쌓아두면 뒤로가기가 기대대로 상세만 걷어낸다.
 */

export const ROUTE_MAIN = { name: "main", id: null, parts: [] };

/* 상세 화면의 종류. 여기 없는 이름은 전부 셸로 떨어진다 —
   새 상세 화면을 붙일 때 고칠 곳이 이 배열과 MainApp 의 target/detail 두 군데뿐이도록 둔다. */
const DETAIL = ["facility", "store", "course", "festival", "route"];

/* 대상 없이도 열리는 화면.
     report     보통은 시설·점포 상세에서 대상을 달고 들어오지만(#/report/facility/fc-001),
                대상을 특정하지 못한 문의(#/report)도 받아야 한다.
     festivals  S12 축제 전체보기. 목록 화면이라 애초에 대상이 없다 (#/festivals).
     districts  S13 상점가 전체보기. 같은 성격이다 (#/districts).
   위 DETAIL 과 나누는 이유는 아래 parseHash 의 "조각이 없으면 셸" 규칙 때문이다 —
   그 규칙은 오타난 딥링크를 걸러내는 장치라 없애면 안 되고, 여기만 예외로 둔다. */
const OPTIONAL_ID = ["report", "festivals", "districts"];

/* "#/store/dj-042"           → { name: "store", id: "dj-042", parts: ["dj-042"] }
   "#/route/facility/fc-001"  → { name: "route", id: "facility", parts: ["facility", "fc-001"] }

   길찾기만 조각이 둘이다. 도착지가 시설일 수도 점포일 수도 있어 id 하나로는 어느 목록에서
   찾아야 할지 알 수 없기 때문이다 (fc-001 과 dj-042 는 지금은 접두사가 다르지만, 그건
   더미 데이터의 성질이지 규약이 아니다 — 실데이터의 id 체계에 기대면 안 된다).

   모르는 경로는 전부 main 으로 떨어뜨린다 — 오타난 딥링크에 빈 화면을 보여주지 않는다. */
export function parseHash(hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  if (!raw) return ROUTE_MAIN;

  const [name, ...rest] = raw.split("/").filter(Boolean);
  const parts = rest.map(decodeURIComponent);
  if (DETAIL.includes(name) && parts.length) return { name, id: parts[0], parts };
  if (OPTIONAL_ID.includes(name)) return { name, id: parts[0] || null, parts };
  return ROUTE_MAIN;
}

/* pushState 는 hashchange 를 발생시키지 않으므로 직접 알린다.
   PopStateEvent 생성자 대신 평범한 Event 를 쓴다 — 구독자가 이벤트 객체를 보지 않고
   location.hash 를 다시 읽기 때문에 종류만 맞으면 된다. */
function announce() {
  window.dispatchEvent(new Event("popstate"));
}

/* 우리가 쌓은 항목 수를 history entry 자체에 적어둔다. 모듈 변수에 두면 브라우저 뒤로가기로
   돌아왔을 때 값이 실제 위치와 어긋난다 — history.state 는 항목마다 따로 보관되므로
   뒤로 가면 그 항목의 값이 자동으로 복원된다. */
const depthOf = () => (window.history.state && window.history.state.shellDepth) || 0;

export function useHashRoute() {
  const [route, setRoute] = React.useState(() =>
    parseHash(typeof location !== "undefined" ? location.hash : ""));

  React.useEffect(() => {
    const sync = () => setRoute(parseHash(location.hash));
    /* hashchange 는 사용자가 주소창을 직접 고쳤을 때, popstate 는 뒤로가기와 go() 일 때 */
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    /* 마운트와 첫 effect 사이에 해시가 바뀌었을 수 있다 (딥링크 + 느린 첫 로딩) */
    sync();
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return route;
}

/* history 에 한 칸 쌓는다 → 브라우저 뒤로가기가 이 이동을 되돌린다 */
export function go(path) {
  window.history.pushState({ shellDepth: depthOf() + 1 }, "", path);
  announce();
}

/* 뒤로.
   우리가 쌓은 항목이 있으면 history 를 거슬러야 한다 — 해시를 "#/" 로 덮어쓰는 방식으로 닫으면
   뒤로가기를 눌렀을 때 방금 닫은 상세가 다시 열린다.

   딥링크로 상세에 바로 들어온 경우(#/store/dj-042 를 붙여넣은 경우)에는 되돌아갈 항목이 없다.
   그때 history.back() 은 서비스 밖으로 나가므로, 현재 항목을 셸로 **교체**한다. */
export function back() {
  if (depthOf() > 0) {
    window.history.back();
    return;
  }
  window.history.replaceState({ shellDepth: 0 }, "", `${location.pathname}${location.search}#/`);
  announce();
}

/* 쌓인 것을 전부 걷어내고 셸(지도)로 나간다. [X] 가 쓴다.
   뒤로가기가 한 칸씩 되돌리는 것과 달리 한 번에 되감는다 — 목록 → 상세 → 길찾기로 들어온
   사용자가 지도로 돌아가려면 뒤로를 두 번 눌러야 하는데, 그 두 번째가 무엇을 걷어낼지는
   눌러봐야 안다. "여기서 나간다"는 뜻의 버튼은 한 번에 나가야 한다.

   해시를 "#/" 로 덮어쓰지 않고 history.go(-n) 으로 되감는 이유는 back() 과 같다 —
   덮어쓰면 우리가 쌓은 항목이 앞쪽에 남아 뒤로가기가 방금 닫은 화면을 다시 연다.
   go() 는 popstate 를 스스로 일으키므로 announce() 가 필요 없다. */
export function closeAll() {
  const depth = depthOf();
  if (depth > 0) {
    window.history.go(-depth);
    return;
  }
  window.history.replaceState({ shellDepth: 0 }, "", `${location.pathname}${location.search}#/`);
  announce();
}
