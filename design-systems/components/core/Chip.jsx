import React from "react";
import { Icon } from "./Icon.jsx";

/* 업종 필터 알약. icon 은 Lucide 이름이나 완성된 엘리먼트(CategoryIcon)를 받는다.

   버튼(히트 영역)과 알약(보이는 것)을 분리한다.
   알약은 34px 이지만 버튼은 위아래 투명 여백을 포함해 44px 이다 —
   칩이 시각적으로 뚱뚱하지 않으면서도 터치 타겟 44px 규칙(U-CM-13)을 지킨다.
   고정 높이가 아니라 min-height 이므로 2차 글자 확대에서 알약이 함께 늘어난다. */
/* size="sm" 은 **알약만 작아지고 버튼은 그대로 44px 이다.** 목록 행 안에 칩이 들어가는
   자리(S08 코스의 [방문 완료])에서 나왔다 — 거기서는 34px 알약도 행의 주인공인 상호명보다
   커 보인다. 눌리는 크기는 건드리지 않으므로 U-CM-13 을 지킨다: 눈에만 작아진다.
   필터 줄처럼 칩이 여럿 늘어서는 자리는 기본(md)을 쓴다. 거기서는 칩이 주인공이다. */
const CHIP_SIZES = {
  md: { pill: 34, pad: ["0 11px 0 9px", "0 12px"], font: "var(--fs-caption)", icon: 15, gap: 5 },
  sm: { pill: 28, pad: ["0 9px 0 7px", "0 10px"], font: "var(--fs-micro)", icon: 13, gap: 4 },
};

export function Chip({ children, selected = false, icon, count, elevated = false, size = "md", onClick, style, ...rest }) {
  const z = CHIP_SIZES[size] || CHIP_SIZES.md;
  return (
    <button onClick={onClick}
      style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: "var(--tap-min)", padding: "5px 0", background: "none", border: "none",
        cursor: "pointer", WebkitTapHighlightColor: "transparent", ...style }} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: z.gap, whiteSpace: "nowrap",
        minHeight: z.pill, padding: icon ? z.pad[0] : z.pad[1], borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)", fontSize: z.font, fontWeight: "var(--fw-bold)",
        lineHeight: 1.3, letterSpacing: "var(--ls-normal)",
        transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)",
        /* elevated: 지도 위에 떠 있을 때. 배경 패널 없이 알약만 놓이므로 그림자로 지도와 분리한다 */
        boxShadow: elevated ? "var(--shadow-card)" : "none",
        background: selected ? "var(--brand-primary)" : "var(--surface-card)",
        color: selected ? "var(--text-on-brand)" : "var(--text-body)",
        border: selected ? "var(--stroke-hairline) solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)" }}>
        {icon ? (typeof icon === "string" ? <Icon name={icon} size={z.icon} /> : icon) : null}
        {children}
        {count != null ? <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", opacity: selected ? 0.85 : 0.55 }}>{count}</span> : null}
      </span>
    </button>
  );
}
