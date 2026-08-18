import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Badge } from "../core/Badge.jsx";

const STATE_TONE = { 진행중: "success", 예정: "accent", 종료: "neutral" };

/* 진행 중 또는 예정 축제 배너 (U-ST-03, U-FT-03). 상점가 상세 헤더와 홈 상단이 같이 쓴다.
   종료된 축제는 호출하는 쪽에서 걸러 넣는다 — 배너 자리를 종료 안내로 채우지 않는다. */
export function FestivalBanner({ festival, onClick, style, ...rest }) {
  if (!festival) return null;
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%",
        minHeight: "var(--tap-comfortable)", padding: "var(--space-3) var(--space-4)", textAlign: "left",
        background: "var(--brand-accent-soft)", border: "var(--stroke-hairline) solid var(--yong-cream-300)",
        borderRadius: "var(--radius-md)", cursor: "pointer", ...style }} {...rest}>
      <Icon name="party-popper" size={22} color="var(--yong-cream-900)" />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{festival.name}</span>
          <Badge tone={STATE_TONE[festival.state] || "neutral"}>{festival.state}</Badge>
        </span>
        <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-body)", marginTop: 2, lineHeight: 1.4 }}>{festival.date}</span>
      </span>
      <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" />
    </button>
  );
}
