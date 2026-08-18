import React from "react";
import { AppBar } from "../navigation/AppBar.jsx";

/* 상세 화면의 페이지 셸 — S05 시설 상세, S06 점포 상세, 이후 S07~S10 이 모두 이것을 쓴다.
 *
 *   [AppBar]  ← 뒤로 + 제목. sticky
 *   ────────────────────────────
 *   본문 (스크롤)
 *   ────────────────────────────
 *   [하단 액션바]  ← sticky. 길찾기 같은 주 행동 하나
 *
 * ── 이것이 "페이지"인데 왜 오버레이인가 ─────────────────────────────────
 *
 * 별도 HTML 페이지로 나누면 뒤로 갈 때 지도가 재생성될 뿐 아니라(U-CM-16 의 취지),
 * S03 상점가 탭의 필터 상태가 통째로 초기화된다 — 업종 칩, 온누리 토글, 검색어, 정렬,
 * 시트 스냅. 335곳에서 조건을 좁혀놓고 한 곳 눌러본 뒤 돌아오면 처음부터 다시 걸어야 한다.
 * 그래서 셸(screens/main/) 을 언마운트하지 않고 그 **위에 덮는다**. 뒤로가기는 오버레이를
 * 걷어내는 것뿐이라 즉시이고, 아래 화면은 떠날 때 모습 그대로다.
 *
 * ── z 는 --z-modal 을 쓴다 (새 레이어를 만들지 않는다) ──────────────────
 *
 * tokens/layers.css 는 "아래 7개 외의 값은 쓰지 않는다"고 못박고 있고 그 근거가
 * 기능명세서 5-3 의 7단계 표다. 상세 오버레이는 탭바(450)와 시트(500) 위, 토스트(700)
 * 아래에 있어야 하는데 그 자리가 정확히 --z-modal(600) 이다. 성격도 다이얼로그 계열이라
 * 맞는 자리이므로 --z-page 같은 8번째 값을 만들지 않는다.
 *
 * 부모는 position:relative 여야 한다 (셸의 루트 div 가 그렇다). inset:0 으로 그 안을 채운다.
 */

/* 진입 애니메이션 — 오른쪽에서 밀려 들어온다. "덮었다"는 것이 보여야 뒤로가기가 예상된다.
   prefers-reduced-motion 에서는 움직이지 않고 그냥 나타난다 (전정기관 자극 회피).
   나갈 때는 애니메이션이 없다 — 뒤로가기는 즉시여야 하고, 언마운트를 지연시키면
   그 사이 사용자가 다른 것을 누를 수 있다. */
function useEnter() {
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return entered;
}

export function DetailPage({ title, onBack, children, footer, actions, style, ...rest }) {
  const entered = useEnter();
  const page = React.useRef(null);

  /* 열리자마자 포커스를 뒤로가기 버튼에 둔다. 그러지 않으면 포커스가 아래 화면(목록)에
     남아 있어 스크린리더 사용자는 새 화면이 열린 것을 모른 채 가려진 목록을 계속 읽는다.
     AppBar 가 ref 를 받지 않으므로 버튼을 DOM 에서 찾는다 — AppBar 는 이미 여러 화면이
     쓰고 있어 시그니처를 건드리면 파급이 크고, 여기서 필요한 것은 포커스 한 번뿐이다. */
  React.useEffect(() => {
    const btn = page.current && page.current.querySelector('header button[aria-label="뒤로"]');
    if (btn) btn.focus();
  }, []);

  /* Esc 로도 닫힌다 — 데스크톱 검수에서 필요하고, 모바일에서는 뒤로가기 제스처가 같은 일을 한다 */
  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape" && onBack) { e.preventDefault(); onBack(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const reduced = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div ref={page} role="dialog" aria-modal="true" aria-label={title}
      style={{ position: "absolute", inset: 0, zIndex: "var(--z-modal)",
        display: "flex", flexDirection: "column", background: "var(--surface-page)",
        transform: entered || reduced ? "none" : "translateX(16px)",
        opacity: entered || reduced ? 1 : 0,
        transition: reduced ? "none" : "transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out)",
        ...style }} {...rest}>

      {/* AppBar 는 이미 back/onBack 을 갖고 있다. 제목이 길면 자르지 않고 줄바꿈하며
          헤더가 함께 늘어난다 (U-CM-14) */}
      <AppBar title={title} back onBack={onBack} actions={actions} style={{ flex: "0 0 auto" }} />

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch" }}>
        {children}
      </div>

      {/* 하단 액션바 — 주 행동(길찾기)이 스크롤과 무관하게 늘 손 닿는 곳에 있어야 한다.
          min-height 만 쓰고 고정 높이를 주지 않는다. safe-area 는 body 가 이미 처리한다. */}
      {footer ? (
        <div style={{ flex: "0 0 auto", padding: "var(--space-3) var(--gutter-screen)",
          background: "var(--surface-card)", borderTop: "var(--stroke-hairline) solid var(--border-default)",
          boxShadow: "var(--shadow-sheet)" }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/* 상세 화면 본문의 공통 여백 컨테이너. 화면마다 padding 값을 다시 적으면
   S05 와 S06 의 좌우 여백이 조금씩 어긋난다. */
export function DetailBody({ children, style, ...rest }) {
  return (
    <div style={{ padding: "var(--space-4) var(--gutter-screen) var(--space-9)",
      display: "flex", flexDirection: "column", gap: "var(--space-5)", ...style }} {...rest}>
      {children}
    </div>
  );
}

/* 화면 하단 고지 (U-CM-07 정보 기준일자 · U-CM-08 참고용 고지와 119).
   두 상세 화면이 같은 문장을 각자 적으면 한쪽만 고쳐지는 일이 생긴다. */
export function DetailNotice({ asOf, children, style, ...rest }) {
  return (
    <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55, ...style }} {...rest}>
      {asOf}
      {children}
      <span style={{ display: "block" }}>
        안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.
      </span>
    </p>
  );
}
