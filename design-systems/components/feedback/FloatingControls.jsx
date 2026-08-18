import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 플로팅 지도 컨트롤 (기능명세서 5-3 #3).
   목록 토글과 QR 지점 복귀 버튼을 화면 하단에 고정하면 시트가 올라올 때 시트 뒤로 사라진다.
   그래서 시트 상단 모서리에 앵커링해 함께 움직인다.

     bottom = clamp(시트 높이 + --float-gap, --float-gap, 지도 높이 - 44px - --float-gap)
     전체 스냅에서는 hidden — 시트가 화면을 소유하므로 버튼이 스크림 위에 떠 있으면 안 된다
     이동은 시트와 같은 --dur-slow / --ease-out (따로 두면 버튼이 시트를 쫓아가는 것처럼 보인다)

   bottom 은 Sheet 의 onHeightChange 가 준 px 값을 넘기는 것이 정확하다.
   측정값이 없을 때만 토큰(--sheet-half 등)으로 떨어진다. */
export function FloatingControls({ bottom = "var(--sheet-half)", hidden = false, items = [], style, ...rest }) {
  const anchor = typeof bottom === "number" ? `${bottom}px` : bottom;
  return (
    <div style={{ position: "absolute", right: "var(--float-inset)",
      bottom: `clamp(var(--float-gap), calc(${anchor} + var(--float-gap)), calc(100% - var(--tap-min) - var(--float-gap)))`,
      zIndex: "var(--z-float)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-2)",
      opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : "auto",
      transition: "bottom var(--dur-slow) var(--ease-out), opacity var(--dur-base) var(--ease-standard)", ...style }}
      aria-hidden={hidden ? "true" : undefined} {...rest}>
      {items.map(it => (
        <button key={it.label} onClick={it.onClick} aria-label={it.label} title={it.label} aria-pressed={it.active}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: "var(--tap-min)",
            padding: it.text ? "10px 14px" : "0 12px", minWidth: "var(--tap-min)", justifyContent: "center",
            background: it.active ? "var(--brand-primary)" : "var(--surface-card)",
            color: it.active ? "var(--text-on-brand)" : "var(--text-heading)",
            border: "var(--stroke-hairline) solid " + (it.active ? "var(--brand-primary)" : "var(--border-default)"),
            borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-raised)", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)" }}>
          <Icon name={it.icon} size={20} />
          {it.text}
        </button>
      ))}
    </div>
  );
}
