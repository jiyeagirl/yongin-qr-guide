import React from "react";
import { AdminShell, Button, Toast } from "../design-systems/admin.js";
import { useSession, can } from "./data/account.js";
import { resetAll, hasChanges, subscribe } from "./data/store.js";
import { useHashPage, replace, go } from "./router.js";
import { OPEN_COUNT } from "./data/inquiries.js";

import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Facilities } from "./pages/Facilities.jsx";
import { Districts } from "./pages/Districts.jsx";
import { Stores } from "./pages/Stores.jsx";
import { Festivals } from "./pages/Festivals.jsx";
import { QrPoints } from "./pages/QrPoints.jsx";
import { Inquiries } from "./pages/Inquiries.jsx";

/* 관리자 웹 진입점 (/admin/).
 *
 * ── 시민용 App.jsx 와 같은 자리에 있다 ──────────────────────────────────────
 * 저쪽은 QR 코드를 조회해 셸로 보낼지 안내 화면으로 보낼지 **셸보다 앞에서** 갈랐다.
 * 여기도 같다 — 로그인하지 않았으면 셸을 세우지 않는다. 셸이 서는 순간 데이터 파일
 * 네 개(점포 335곳 포함)를 읽고 표를 그리는데, 들어올 자격이 확인되지 않은 사람에게
 * 그 일을 할 이유가 없다.
 *
 * ── 권한은 두 겹으로 막는다 ─────────────────────────────────────────────────
 * 1. 내비에서 감춘다 (갈 수 없는 곳을 보여주지 않는다)
 * 2. 주소로 직접 들어와도 되돌린다 (아래 useEffect)
 *
 * 하나만으로는 부족하다. 감추기만 하면 `#/inquiries` 를 주소창에 치는 것으로 들어와지고,
 * 되돌리기만 하면 눌러보고 튕겨나는 메뉴가 남는다. **다만 이것은 UI 수준의 분리일 뿐이다** —
 * 실서비스의 권한은 서버가 막는다. 화면이 막는 것은 실수를 줄이는 장치이지 보안이 아니다.
 */

const NAV = [
  { key: "dashboard", label: "대시보드", icon: "layout-dashboard" },
  { key: "facilities", label: "공공시설", icon: "life-buoy" },
  { key: "districts", label: "상점가", icon: "store" },
  { key: "stores", label: "점포", icon: "shopping-bag" },
  { key: "festivals", label: "축제", icon: "party-popper" },
  { key: "qr", label: "QR 지점", icon: "qr-code" },
  /* 미처리 건수를 배지로 단다. 0 이면 달지 않는다 — 없는 일에 표시를 붙이지 않는다 */
  { key: "inquiries", label: "문의·오류신고", icon: "inbox", badge: OPEN_COUNT || null },
];

const PAGES = {
  dashboard: Dashboard,
  facilities: Facilities,
  districts: Districts,
  stores: Stores,
  festivals: Festivals,
  qr: QrPoints,
  inquiries: Inquiries,
};

export function AdminApp() {
  const { account, signIn, signOut } = useSession();
  const page = useHashPage();
  const [toast, setToast] = React.useState(null);
  const [, bump] = React.useReducer(n => n + 1, 0);

  /* 덮개가 바뀌면 상단바를 다시 그린다. [데모 데이터 초기화]는 고친 것이 있을 때만 서는데,
     그 판단(hasChanges)이 아래 화면이 아니라 여기서 이루어지기 때문이다 */
  React.useEffect(() => subscribe(bump), []);

  /* 저장·삭제 알림. 화면 여덟 개가 같은 통로를 쓴다 — 화면마다 토스트를 들고 있으면
     같은 "저장되었습니다"가 여덟 벌 생기고 위치도 제각각이 된다 */
  const notify = React.useCallback(msg => setToast({ msg, at: Date.now() }), []);
  React.useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* 갈 수 없는 곳(권한 없음)이거나 알 수 없는 경로면 갈 수 있는 첫 화면으로 되돌린다.
     로그인 전에는 아무 것도 하지 않는다 — 그때는 셸 자체가 없다. */
  const allowed = account ? NAV.filter(n => can(account, n.key)) : [];
  const current = account && page && can(account, page) ? page : (allowed[0] ? allowed[0].key : null);

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
        note="서버 연동 전입니다. 여기서 고친 내용은 이 브라우저 탭 안에서만 유지되며, 시민용 화면(/screens/main/)에는 반영되지 않습니다."
        actions={hasChanges() ? (
          /* 고친 것이 있을 때만 선다. 아무 것도 안 고쳤는데 [초기화]가 서 있으면
             무엇을 되돌리는 버튼인지 알 수 없다 */
          <Button variant="ghost" size="sm" icon="rotate-ccw"
            onClick={() => { resetAll(); notify("데모 데이터를 처음 상태로 되돌렸습니다."); }}>
            데모 데이터 초기화
          </Button>
        ) : null}>
        {Page ? <Page account={account} onToast={notify} /> : null}
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
