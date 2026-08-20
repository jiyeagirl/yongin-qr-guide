import React from "react";
import { AdminShell, Toast } from "../design-systems/admin.js";
import { useSession, can } from "./data/account.js";
import { subscribe, setActor, readCollection } from "./data/store.js";
import { useHashPage, replace, go } from "./router.js";
import { REPORTS, isOpen } from "./data/reports.js";

import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Districts } from "./pages/Districts.jsx";
import { Stores } from "./pages/Stores.jsx";
import { Festivals } from "./pages/Festivals.jsx";
import { Facilities } from "./pages/Facilities.jsx";
import { QrPoints } from "./pages/QrPoints.jsx";
import { Reports } from "./pages/Reports.jsx";
import { DataAsOf } from "./pages/DataAsOf.jsx";
import { Settings } from "./pages/Settings.jsx";
import { Accounts } from "./pages/Accounts.jsx";

/* 관리자 웹 진입점 (/admin/) — 관리자 웹 기능명세서 v1.1 의 M01 ~ M16.
 *
 * ── 이 화면이 하는 일은 좁다 (2026-08-20, 명세서 개정) ──────────────────────
 * 명세서 범위 문단이 그것을 못 박았다: "개별 건의 조회·수정·신규 등록과 오류신고 기반
 * 보정. **데이터 일괄 적재, 매칭, 갱신, 검수는 개발 쪽에서 처리하며 별도 문서로 분리한다.**"
 *
 * 그래서 화면 둘이 빠졌다 — 매칭 검수 큐와 공공데이터 동기화. 함께 빠진 것들:
 * 점포 일괄 업로드 · 상점가 구역 주소 편집과 재매칭 · 게시값 대비 산출값 비교 ·
 * 공공시설의 `source`(덮어쓰기 기준) · 노출 순서. 전부 **데이터를 무리로 다루는 일**이고,
 * 그 일의 결과를 담당자가 화면에서 확인할 수는 있어도 화면에서 고칠 수는 없었다.
 *
 * 남은 것은 한 건씩 고치는 일이다. 그래서 화면 열이 전부 목록 + 폼 한 벌로 같은 모양이다.
 *
 * ── 시민용 App.jsx 와 같은 자리에 있다 ──────────────────────────────────────
 * 저쪽은 QR 코드를 조회해 셸로 보낼지 안내 화면으로 보낼지 **셸보다 앞에서** 갈랐다.
 * 여기도 같다 — 로그인하지 않았으면 셸을 세우지 않는다. 셸이 서는 순간 데이터 파일
 * 다섯 개(점포 335곳 포함)를 읽고 표를 그리는데, 들어올 자격이 확인되지 않은 사람에게
 * 그 일을 할 이유가 없다.
 *
 * ── 권한을 나누지 않는다 (2026-08-20) ──────────────────────────────────────
 * 전에는 계정에 `CITY`/`DEVELOPER` 두 권한이 있었고 내비가 그에 따라 갈렸다. 이 화면을
 * 쓰는 사람이 용인시 담당자뿐이라 그 구분을 없앴다 — **모든 계정이 열 화면을 다 본다.**
 * 남은 판정은 하나다: 로그인했는가, 그리고 그 주소가 있는 화면인가 (`can()`).
 * 실서비스의 권한은 어차피 서버가 막는다. 화면이 막는 것은 보안이 아니라 실수 방지다.
 */

/* 내비 — `{ section }` 한 줄이 구획 제목이고, 뒤에 오는 항목들이 그 구획에 속한다
   (AdminShell 이 빈 구획을 걷어낸다).

   ── 이름은 **담당자가 하는 일**로 적는다 (2026-08-20) ─────────────────────────
   전에는 구획이 명세서의 장 이름(골목형 상점가 · 공공시설 · 안내 지점)이고 항목이
   대상 이름 한 마디(상점가 · 점포 · 축제)였다. 명세서를 펴 놓고 보면 맞는 차례지만,
   화면을 여는 사람은 명세서를 펴 놓고 있지 않다. 「상점가」는 무엇을 하는 자리인지
   말하지 않는다 — 보는 자리인지, 고치는 자리인지, 새로 넣는 자리인지.

   그래서 항목은 「상점가 정보 관리」처럼 **일 이름**으로 적고, 구획은 그 일들을 묶는
   더 큰 일(정보 관리 · 민원 관리 · 시스템 운영)로 적는다. 대상 이름(골목형 상점가 ·
   공공시설)은 항목 안에 이미 들어 있으므로 구획 제목에서 되풀이하지 않는다.
   이름이 길어진 만큼 --admin-nav-w 를 264px 로 넓혔다. */
const NAV = [
  { key: "dashboard", label: "대시보드", icon: "layout-dashboard" },

  { section: "정보 관리" },
  { key: "districts", label: "상점가 정보 관리", icon: "store" },
  { key: "stores", label: "점포 정보 관리", icon: "shopping-bag" },
  { key: "festivals", label: "축제 정보 관리", icon: "party-popper" },
  { key: "facilities", label: "공공시설 정보 관리", icon: "life-buoy" },
  { key: "qr", label: "QR 지점 관리", icon: "qr-code" },

  { section: "민원 관리" },
  { key: "reports", label: "오류신고 관리", icon: "inbox" },

  { section: "시스템 운영" },
  { key: "asof", label: "데이터 기준일 관리", icon: "calendar-clock" },
  { key: "settings", label: "환경 설정", icon: "settings" },
  { key: "accounts", label: "계정 관리", icon: "users" },
];

const PAGES = {
  dashboard: Dashboard,
  districts: Districts,
  stores: Stores,
  festivals: Festivals,
  facilities: Facilities,
  qr: QrPoints,
  reports: Reports,
  asof: DataAsOf,
  settings: Settings,
  accounts: Accounts,
};

export function AdminApp() {
  const { account, signIn, signOut } = useSession();
  const page = useHashPage();
  const [toast, setToast] = React.useState(null);
  const [, bump] = React.useReducer(n => n + 1, 0);

  /* 덮개가 바뀌면 내비 배지를 다시 그린다 — 배지의 숫자가 화면 밖에서 바뀌기 때문이다
     (신고 하나를 처리하면 배지가 줄어야 한다).

     상단바에 있던 [데모 데이터 초기화]는 뺐다 (2026-08-20, 사용자 요청). 화면 맨 위,
     모든 화면에서 보이는 자리에 **되돌리는 버튼**이 서 있을 이유가 없다 — 담당자가
     날마다 여는 화면에서 그것은 언젠가 잘못 눌리는 버튼이다. 세션 저장이라 탭을 닫으면
     어차피 처음 상태로 돌아간다. 되돌리는 통로 자체는 `store.js` 의 `resetAll` 로 남아 있다. */
  React.useEffect(() => subscribe(bump), []);

  /* 변경 이력에 적히는 "주체" (명세서 10장). 저장하는 쪽(useCollection)이 지금 누가
     로그인해 있는지 알 방법이 없어, 여기서 한 번 넣어 둔다 */
  React.useEffect(() => { setActor(account); }, [account]);

  /* 저장·삭제 알림. 화면 열이 같은 통로를 쓴다 — 화면마다 토스트를 들고 있으면
     같은 "저장되었습니다"가 열 벌 생기고 위치도 제각각이 된다 */
  const notify = React.useCallback(msg => setToast({ msg, at: Date.now() }), []);
  React.useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* 내비 배지는 **지금 값**이어야 한다. 원본을 세면 검수 중에 신고 하나를 처리해도
     배지가 그대로 남아, 눌러도 아무 일이 없는 숫자가 된다.
     배지를 다는 곳은 오류신고 하나뿐이다 — 관리자가 **답해야 하는 것**이 그것뿐이다. */
  const openReports = readCollection("reports", REPORTS).filter(isOpen).length;
  const badges = { reports: openReports || null };

  /* 알 수 없는 경로면 첫 화면으로 되돌린다 (`#/zzz`).
     로그인 전에는 아무 것도 하지 않는다 — 그때는 셸 자체가 없다. */
  const allowed = account
    ? NAV.filter(n => n.section || can(account, n.key))
      .map(n => (n.section ? n : { ...n, badge: badges[n.key] || null }))
    : [];
  const firstPage = allowed.find(n => !n.section);
  const current = account && page && can(account, page)
    ? page : (firstPage ? firstPage.key : null);

  React.useEffect(() => {
    if (account && current && current !== page) replace(current);
  }, [account, current, page]);

  if (!account) return <Login onSignIn={signIn} />;

  const Page = PAGES[current];

  return (
    <>
      <AdminShell
        nav={allowed} current={current} onNavigate={go}
        account={account} onSignOut={signOut}
        /* ── 이 한 줄을 감추지 않는다 ────────────────────────────────────
             서버가 없어 관리자와 시민용 화면이 자료를 주고받지 못한다. 여기서 고친 것은
             이 탭의 sessionStorage 에만 남는다 — 저장소가 탭 단위라 시민용 화면을 다른 탭에서
             열면 애초에 닿지 않는다. 그것을 적어두지 않으면 검수하는 사람이 시설 하나를
             고쳐놓고 시민 화면에서 찾다가 "반영이 안 된다"를 결함으로 적게 된다.
             실연동 때는 양쪽이 같은 서버를 보므로 이 줄을 지운다. */
        note="서버 연동 전입니다. 여기서 고친 내용은 이 브라우저 탭 안에서만 유지되며, 시민용 화면(/screens/main/)에는 반영되지 않습니다.">
        {Page ? <Page account={account} onToast={notify} onNavigate={go} /> : null}
      </AdminShell>

      {/* 토스트는 셸 **밖**이다. 셸 안에 두면 좌측 내비 폭만큼 밀려 화면 가운데가 아니게 된다 */}
      {toast ? (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "var(--space-7)",
          display: "flex", justifyContent: "center", zIndex: "var(--z-toast)", pointerEvents: "none" }}>
          <Toast>{toast.msg}</Toast>
        </div>
      ) : null}
    </>
  );
}

export default AdminApp;
