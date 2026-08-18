import React from "react";
import { Icon } from "./Icon.jsx";

/* 업종 필터 알약. icon 은 Lucide 이름이나 완성된 엘리먼트(CategoryIcon)를 받는다.

   버튼(히트 영역)과 알약(보이는 것)을 분리한다.
   알약은 34px 이지만 버튼은 위아래 투명 여백을 포함해 44px 이다 —
   칩이 시각적으로 뚱뚱하지 않으면서도 터치 타겟 44px 규칙(U-CM-13)을 지킨다.
   고정 높이가 아니라 min-height 이므로 2차 글자 확대에서 알약이 함께 늘어난다. */
export function Chip({ children, selected = false, icon, count, elevated = false, onClick, style, ...rest }) {
  return (
    <button onClick={onClick}
      style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: "var(--tap-min)", padding: "5px 0", background: "none", border: "none",
        cursor: "pointer", WebkitTapHighlightColor: "transparent", ...style }} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        minHeight: 34, padding: icon ? "0 11px 0 9px" : "0 12px", borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)",
        lineHeight: 1.3, letterSpacing: "var(--ls-normal)",
        transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)",
        /* elevated: 지도 위에 떠 있을 때. 배경 패널 없이 알약만 놓이므로 그림자로 지도와 분리한다 */
        boxShadow: elevated ? "var(--shadow-card)" : "none",
        background: selected ? "var(--brand-primary)" : "var(--surface-card)",
        color: selected ? "var(--text-on-brand)" : "var(--text-body)",
        border: selected ? "var(--stroke-hairline) solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)" }}>
        {icon ? (typeof icon === "string" ? <Icon name={icon} size={15} /> : icon) : null}
        {children}
        {count != null ? <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", opacity: selected ? 0.85 : 0.55 }}>{count}</span> : null}
      </span>
    </button>
  );
}
