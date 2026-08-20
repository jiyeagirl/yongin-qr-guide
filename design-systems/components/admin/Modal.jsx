import React from "react";
import { IconButton } from "../core/IconButton.jsx";

/* 등록·수정 다이얼로그 — 관리자의 모든 입력이 이 안에서 일어난다.
 *
 * ── 시민용 Sheet 와 나눈 이유 ───────────────────────────────────────────────
 * Sheet 는 아래에서 올라와 화면의 일부만 덮고 손가락으로 끌어 높이를 바꾼다.
 * 그 셋이 전부 **한 손에 들린 화면**의 사정이다. 1440px 모니터에서 아래에서
 * 올라오는 시트는 위쪽 900px 을 비워둔 채 글자를 화면 밑바닥에 깔아 놓는다.
 *
 * ── 지켜야 하는 것 넷 ───────────────────────────────────────────────────────
 * 1. **ESC 로 닫힌다.** 마우스를 쓰는 화면이라도 폼을 채우던 손은 키보드에 있다
 * 2. **포커스가 안에 갇힌다.** 탭 키가 뒤쪽 표로 새어 나가면, 보이지도 않는 버튼에
 *    포커스가 가 있는 채로 엔터를 누르게 된다
 * 3. **열릴 때 첫 입력칸에 포커스가 간다.** 담당자가 [등록]을 누른 뒤 하려던 일은
 *    언제나 첫 칸을 채우는 것이다
 * 4. **닫히면 포커스가 열었던 버튼으로 돌아간다.** 그러지 않으면 키보드 사용자는
 *    문서 맨 위로 튕겨나가 목록을 처음부터 다시 훑는다
 *
 * 스크림을 눌러서는 닫지 않는다. 폼을 반쯤 채운 상태에서 옆을 잘못 눌러 전부 날아가는
 * 것이 이 화면에서 가장 비싼 실수다. 닫는 길은 [X]·[취소]·ESC 셋이고 전부 의도적이다.
 */

const SIZES = {
  md: 560,   /* 한 열 폼 — 계정, 데이터 기준일 */
  lg: 820,   /* 두 열 폼 — 시설, 점포, QR 지점 */
  /* xl 은 폼 안에 **지도나 1:N 목록이 들어가는** 화면용이다 (상점가의 구역 주소 4열,
     축제의 프로그램·부스). lg 에서는 1:N 한 줄의 칸 넷이 각각 120px 로 쪼그라들어
     도로명주소가 두 글자씩 끊겨 보인다. */
  xl: 1040,
};

/* 포커스가 상자 밖으로 나가지 않게 한다. 탭 순서를 직접 다시 짜지 않고,
   상자 안의 포커스 가능한 요소 목록을 그때그때 읽어 양 끝만 이어 붙인다 —
   폼 항목이 유형에 따라 늘었다 줄었다 하므로 목록을 미리 굳혀두면 어긋난다. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, title, description, children, footer, size = "md", onClose, style, ...rest }) {
  const box = React.useRef(null);
  const opener = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;

    /* 첫 입력칸으로. 없으면(안내만 있는 다이얼로그) 상자 자체로 — 어디로도 보내지 않으면
       포커스가 body 에 남아 스크린리더가 다이얼로그가 열린 것을 알리지 못한다 */
    const first = box.current && box.current.querySelector(FOCUSABLE);
    if (first) first.focus();
    else if (box.current) box.current.focus();

    const onKey = e => {
      if (e.key === "Escape") { e.stopPropagation(); if (onClose) onClose(); return; }
      if (e.key !== "Tab" || !box.current) return;
      const items = Array.from(box.current.querySelectorAll(FOCUSABLE));
      if (!items.length) return;
      const first2 = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first2) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first2.focus(); }
    };
    document.addEventListener("keydown", onKey);

    /* 뒤쪽 목록이 같이 굴러가면 다이얼로그가 종이 위에 떠 있는 것이 아니라
       화면에 붙어 있는 것처럼 보인다 */
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      if (opener.current && opener.current.focus) opener.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="presentation"
      style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", background: "var(--overlay-scrim)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "var(--space-8) var(--space-5)", overflowY: "auto" }}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        style={{ width: "100%", maxWidth: SIZES[size] || SIZES.md, background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sheet)", outline: "none",
          display: "flex", flexDirection: "column", ...style }} {...rest}>

        <header style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
          padding: "var(--space-5) var(--space-5) var(--space-4)",
          borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "var(--type-title-3)", color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>
              {title}
            </h2>
            {description ? (
              <p style={{ marginTop: 4, fontSize: "var(--fs-label)", color: "var(--text-muted)", lineHeight: 1.55 }}>
                {description}
              </p>
            ) : null}
          </div>
          <IconButton name="x" label="닫기" size={36} onClick={onClose} style={{ flex: "0 0 auto", marginTop: -4 }} />
        </header>

        <div style={{ padding: "var(--space-5)" }}>{children}</div>

        {footer ? (
          <footer style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)",
            padding: "var(--space-4) var(--space-5)", background: "var(--surface-sunken)",
            borderTop: "var(--stroke-hairline) solid var(--border-default)",
            borderRadius: "0 0 var(--radius-xl) var(--radius-xl)" }}>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
