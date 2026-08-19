import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Badge } from "../core/Badge.jsx";
import { token } from "../core/token.js";

/* 관리자 웹의 페이지 셸 — /admin/ 의 모든 화면이 이 안에 들어간다.
 *
 *   ┌──────────────────────────────────────────────────┐
 *   │ [로고] 용인시 QR 안내 관리자      [행동] 담당자 ▾ │  ← 상단바 (고정)
 *   ├──────────┬───────────────────────────────────────┤
 *   │ 대시보드 │                                       │
 *   │ 시설     │   children (스크롤되는 것은 여기다)   │
 *   │ ▸ 점포   │                                       │
 *   │ …        │                                       │
 *   └──────────┴───────────────────────────────────────┘
 *
 * ── 시민용 DetailPage 와 무엇이 다른가 ──────────────────────────────────────
 * DetailPage 는 **한 번에 한 화면**을 덮는 오버레이다. 뒤로가기가 유일한 출구이고,
 * 그래서 셸이 스스로를 언마운트하지 않는 것이 전부였다.
 *
 * 관리자는 반대다. 담당자는 시설을 고치다 문의를 확인하고 다시 점포로 간다 —
 * **여덟 화면 사이를 계속 오간다.** 그래서 목적지 목록(내비)이 항상 보여야 하고,
 * 그것이 화면을 덮지 않아야 한다. 좌측 고정 내비가 그 답이다.
 *
 * ── 좁은 화면에서는 그리지 않는다 ───────────────────────────────────────────
 * 1024px(--admin-min) 미만이면 안내 문구로 대신한다. 표를 카드로 접는 대응을
 * 화면 8개마다 따로 설계하는 대신, "담당자가 PC 에서 쓴다"는 전제를 그대로 지킨다.
 * 안내를 띄우는 쪽이 정직하다 — 반쯤 접힌 표는 되는 것처럼 보이면서 열을 감춘다.
 *
 * 판정을 CSS 미디어쿼리가 아니라 matchMedia 로 하는 이유: 이 시스템은 인라인 스타일로
 * 되어 있어 컴포넌트가 쓸 수 있는 미디어쿼리 자리가 없고, 무엇보다 좁을 때는 본문을
 * **아예 렌더하지 않아야** 한다. 숨기기만 하면 표 8개가 뒤에서 계속 그려진다.
 */

/* --admin-min 을 토큰에서 읽어 온다. 값을 여기에 다시 적으면 토큰을 고쳐도 따라오지 않는다. */
function useWideEnough() {
  const [wide, setWide] = React.useState(true);   /* 첫 렌더는 넓다고 본다 — 대부분 맞고, 틀려도 한 프레임이다 */
  React.useEffect(() => {
    const min = parseInt(token("--admin-min", "1024px"), 10) || 1024;
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const sync = () => setWide(mq.matches);
    sync();
    /* addListener 는 구형 Safari 용 — addEventListener 가 없는 환경이 아직 있다 */
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", sync);
      else mq.removeListener(sync);
    };
  }, []);
  return wide;
}

function NarrowNotice() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "var(--space-7)", background: "var(--surface-page)" }}>
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        <Icon name="monitor" size={40} color="var(--text-muted)" />
        <h1 style={{ marginTop: "var(--space-4)", font: "var(--type-title-2)", color: "var(--text-heading)" }}>
          데스크톱에서 이용해 주세요
        </h1>
        <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.6 }}>
          관리자 화면은 표와 입력 항목이 많아 넓은 화면을 전제로 만들어졌습니다.
          가로 1,024px 이상인 창에서 열어 주세요.
        </p>
      </div>
    </div>
  );
}

/* 내비 한 줄. 현재 화면이면 왼쪽에 초록 막대가 서고 바탕이 옅게 깔린다.
   색만으로 현재 위치를 말하지 않는다 — aria-current 가 스크린리더에게 같은 말을 한다. */
function NavItem({ item, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <li>
      <button type="button" onClick={onClick} aria-current={active ? "page" : undefined}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: "var(--space-3)",
          minHeight: "var(--tap-min)", padding: "var(--space-2) var(--space-4)",
          background: active ? "var(--brand-primary-soft)" : hover ? "var(--surface-sunken)" : "transparent",
          border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
          fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
          fontWeight: active ? "var(--fw-bold)" : "var(--fw-medium)",
          color: active ? "var(--brand-primary)" : "var(--text-body)",
          transition: "background var(--dur-fast), color var(--dur-fast)" }}>
        {active ? (
          <span aria-hidden="true" style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
            width: 3, height: "60%", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)" }} />
        ) : null}
        <Icon name={item.icon} size={20} />
        <span style={{ flex: 1, minWidth: 0, wordBreak: "keep-all" }}>{item.label}</span>
        {/* 미처리 건수 같은 것. 0 은 배지를 달지 않는다 — 없는 일에 빨간 점을 붙이지 않는다 */}
        {item.badge ? <Badge tone="danger" size="sm">{item.badge}</Badge> : null}
      </button>
    </li>
  );
}

export function AdminShell({
  nav = [], current, onNavigate,
  account,                 /* { name, role, roleLabel } */
  actions,                 /* 상단바 우측 보조 행동 (예: 데모 데이터 초기화) */
  note,                    /* 상단바 아래 얇은 띠 — 화면 전체에 걸리는 전제 한 줄 */
  onSignOut,
  children, style, ...rest
}) {
  const wide = useWideEnough();
  if (!wide) return <NarrowNotice />;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-page)", ...style }} {...rest}>
      {/* ── 상단바 ────────────────────────────────────────────────────────
             고정이다. 화면을 아래로 굴려도 "지금 누구로 들어와 있나"가 보여야 한다 —
             권한에 따라 할 수 있는 일이 다른 화면에서 그것이 사라지면 안 된다. */}
      <header style={{ position: "sticky", top: 0, zIndex: "var(--z-filter)",
        minHeight: "var(--admin-topbar-h)", display: "flex", alignItems: "center", gap: "var(--space-4)",
        padding: "var(--space-2) var(--space-6)", background: "var(--surface-card)",
        borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--brand-primary)" }}>
            <Icon name="qr-code" size={18} color="var(--text-on-brand)" />
          </span>
          <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)",
            color: "var(--text-heading)", letterSpacing: "var(--ls-snug)", whiteSpace: "nowrap" }}>
            용인시 QR 위치안내 <span style={{ color: "var(--text-muted)", fontWeight: "var(--fw-medium)" }}>관리자</span>
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {actions}

        {account ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", paddingLeft: "var(--space-4)",
            borderLeft: "var(--stroke-hairline) solid var(--border-default)" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
                {account.name}
              </div>
              <div style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>{account.roleLabel}</div>
            </div>
            {onSignOut ? (
              <button type="button" onClick={onSignOut}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: "var(--tap-min)",
                  padding: "0 var(--space-3)", background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>
                <Icon name="log-out" size={16} />로그아웃
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* ── 전제 한 줄 ────────────────────────────────────────────────────
             시민용 셸의 ContextBar 와 같은 자리, 같은 성격이다 — 저쪽이 "이 화면의 모든
             거리는 QR 지점 기준"이라고 말하듯, 여기서는 "여기서 고친 것이 어디까지 가는가"를
             말한다. 화면마다 안내 상자를 놓지 않고 한 줄로 모으는 이유는, 그 사실이
             한 화면의 사정이 아니라 여덟 화면 전부의 전제이기 때문이다. */}
      {note ? (
        /* 고정하지 않는다. 상단바와 함께 붙여 두면 좌측 내비의 sticky 시작점을 둘의 합으로
           계산해야 하는데, 이 문장은 한 번 읽으면 되는 전제이지 줄마다 필요한 사실이 아니다 */
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-6)", background: "var(--state-warning-soft)",
          borderBottom: "var(--stroke-hairline) solid var(--border-default)",
          fontSize: "var(--fs-caption)", color: "var(--text-body)", lineHeight: 1.5 }}>
          <Icon name="triangle-alert" size={15} color="var(--state-warning)" style={{ flex: "0 0 auto" }} />
          <span>{note}</span>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {/* ── 좌측 내비 ──────────────────────────────────────────────────
               sticky 다. 점포 335곳을 굴려 내려가도 다른 화면으로 가는 길이 남아야 한다.
               top 은 상단바 높이만큼 — 두 고정 요소가 겹치면 내비 첫 항목이 가려진다. */}
        <nav aria-label="관리 메뉴"
          style={{ position: "sticky", top: "var(--admin-topbar-h)", flex: `0 0 var(--admin-nav-w)`,
            width: "var(--admin-nav-w)", height: "calc(100dvh - var(--admin-topbar-h))",
            overflowY: "auto", padding: "var(--space-4) var(--space-3)",
            background: "var(--surface-card)", borderRight: "var(--stroke-hairline) solid var(--border-default)" }}>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map(item => (
              <NavItem key={item.key} item={item} active={item.key === current}
                onClick={() => onNavigate && onNavigate(item.key)} />
            ))}
          </ul>
        </nav>

        {/* ── 본문 ────────────────────────────────────────────────────────
               minWidth 0 이 반드시 필요하다. flex 아이템의 기본 min-width 는 auto 라
               안쪽 표가 넓어지면 본문이 통째로 늘어나 내비를 화면 밖으로 밀어낸다.
               표는 자기 상자 안에서 가로 스크롤되어야 한다 (DataTable 이 그렇게 한다). */}
        <main style={{ flex: 1, minWidth: 0, maxWidth: "var(--admin-max)",
          padding: "var(--space-7) var(--space-7) var(--space-9)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
