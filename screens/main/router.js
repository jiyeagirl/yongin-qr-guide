import React from "react";

/* 해시 라우터 — 셸 위에 상세 화면을 덮기 위한 최소한의 것.
 *
 *   #/ 또는 없음       지도 + 탭 3개 (셸 그대로)
 *   #/facility/fc-001  S05 시설 상세
 *   #/store/dj-042     S06 점포 상세
 *   #/course/cs-eat    S08 골목 한바퀴 코스 상세
 *   #/festival/ft-dunjeon  S09 축제 상세
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

export const ROUTE_MAIN = { name: "main", id: null };

/* 상세 화면의 종류. 여기 없는 이름은 전부 셸로 떨어진다 —
   새 상세 화면을 붙일 때 고칠 곳이 이 배열과 MainApp 의 target/detail 두 군데뿐이도록 둔다. */
const DETAIL = ["facility", "store", "course", "festival"];

/* "#/store/dj-042" → { name: "store", id: "dj-042" }
   모르는 경로는 전부 main 으로 떨어뜨린다 — 오타난 딥링크에 빈 화면을 보여주지 않는다. */
export function parseHash(hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  if (!raw) return ROUTE_MAIN;

  const [name, id] = raw.split("/");
  if (DETAIL.includes(name) && id) {
    return { name, id: decodeURIComponent(id) };
  }
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
