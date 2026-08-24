import React from "react";
import { ALL_PAGES } from "./data/account.js";

/* 관리자 해시 라우터 — screens/main/router.js 의 축소판이다.
 *
 * 저쪽과 다른 점은 하나다. 시민용은 셸 **위에 덮는** 오버레이라 히스토리 깊이를 세야 했지만
 * (뒤로가기가 상세만 걷어내야 하므로), 여기는 화면이 통째로 갈리는 평범한 이동이다.
 * 그래서 깊이 계산이 없고 pushState 만 있다.
 *
 * 경로가 해시인 이유는 같다 — 정적 호스팅이라 /admin/stores 같은 주소는 새로고침할 때
 * 서버가 404 를 낸다. 해시는 서버로 가지 않는다.
 *
 * ── 화면 목록을 여기에 다시 적지 않는다 ─────────────────────────────────────
 * 권한 표(data/account.js 의 ALL_PAGES)가 유일한 목록이다. 라우터가 따로 배열을 들고
 * 있으면 화면을 하나 더할 때 고칠 곳이 둘이 되고, 그중 라우터를 빠뜨리면 내비에는
 * 보이는데 눌러도 아무 일이 안 일어난다.
 *
 *   #/dashboard  #/districts  #/stores    #/festivals  #/facilities
 *   #/qr         #/reports    #/asof      #/accounts
 *
 * `#/settings` 는 2026-08-24 에 없어졌다 (AdminApp 머리말). ALL_PAGES 에서 빠졌으므로
 * 그 주소로 들어와도 아래 parseHash 가 null 을 내고 첫 화면(대시보드)이 뜬다.
 */

export const PAGES = ALL_PAGES;

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
