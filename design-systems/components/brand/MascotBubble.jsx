import React from "react";
import { Mascot } from "./Mascot.jsx";

/* 조아용 speaking to the citizen — used for guidance, empty states, and confirmations. */
export function MascotBubble({ children, pose = "hello", size = 84, side = "left", tone = "cream", base = "", style, ...rest }) {
  const bg = tone === "cream" ? "var(--brand-accent-soft)" : tone === "green" ? "var(--surface-brand-soft)" : "var(--surface-card)";
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)", flexDirection: side === "left" ? "row" : "row-reverse", ...style }} {...rest}>
      <Mascot pose={pose} size={size} base={base} bob />
      <div style={{ position: "relative", flex: 1, background: bg, borderRadius: "var(--radius-lg)", padding: "var(--space-4)", font: "var(--type-body)", fontSize: "var(--fs-body-lg)", lineHeight: 1.55, color: "var(--text-heading)", marginBottom: 8 }}>
        {children}
        <span style={{ position: "absolute", bottom: 14, [side === "left" ? "left" : "right"]: -6, width: 14, height: 14, background: bg, transform: "rotate(45deg)", borderRadius: 3 }} />
      </div>
    </div>
  );
}
