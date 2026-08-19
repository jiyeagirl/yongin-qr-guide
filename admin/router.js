import React from "react";

/* 관리자 해시 라우터 — screens/main/router.js 의 축소판이다.
 *
 * 저쪽과 다른 점은 하나다. 시민용은 셸 **위에 덮는** 오버레이라 히스토리 깊이를 세야 했지만
 * (뒤로가기가 상세만 걷어내야 하므로), 여기는 화면이 통째로 갈리는 평범한 이동이다.
 * 그래서 깊이 계산이 없고 pushState 만 있다.
 *
 * 경로가 해시인 이유는 같다 — 정적 호스팅이라 /admin/stores 같은 주소는 새로고침할 때
 * 서버가 404 를 낸다. 해시는 서버로 가지 않는다.
 *
 *   #/dashboard   #/facilities   #/districts   #/stores
 *   #/festivals   #/qr           #/inquiries
 */

export const PAGES = ["dashboard", "facilities", "districts", "stores", "festivals", "qr", "inquiries"];

export function parseHash(hash) {
  const raw = String(hash || "").replace(/^#\/?/, "").split("/").filter(Boolean)[0];
  return PAGES.includes(raw) ? raw : null;
}

export function useHashPage() {
  const [page, setPage] = React.useState(() =>
    parseHash(typeof location !== "undefined" ? location.hash : ""));

  React.useEffect(() => {
    const sync = () => setPage(parseHash(location.hash));
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    sync();
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return page;
}

/* pushState 는 hashchange 를 일으키지 않으므로 직접 알린다 (시민용 router.js 와 같다) */
export function go(page) {
  window.history.pushState({}, "", `${location.pathname}${location.search}#/${page}`);
  window.dispatchEvent(new Event("popstate"));
}

/* 권한이 없는 경로로 들어왔을 때 주소를 갈아끼운다. 히스토리에 쌓지 않는 이유:
   쌓으면 뒤로가기가 다시 그 금지된 주소로 돌아가고, 그러면 또 튕겨나가 무한히 오간다. */
export function replace(page) {
  window.history.replaceState({}, "", `${location.pathname}${location.search}#/${page}`);
  window.dispatchEvent(new Event("popstate"));
}
