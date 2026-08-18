import React from "react";
import { Icon } from "./Icon.jsx";

/* Category entry tile: a bare Lucide glyph over a Korean label. No tinted square, no fill. */
export function PictogramTile({ icon, label, caption, emergency = false, badge, onClick, style, ...rest }) {
  return (
    <button onClick={onClick} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
      minHeight: 96, padding: "var(--space-4) var(--space-3)", background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", cursor: "pointer", transition: "transform var(--dur-fast) var(--ease-standard)", ...style }}
      onPointerDown={e => { e.currentTarget.style.transform = "scale(var(--press-scale))"; }}
      onPointerUp={e => { e.currentTarget.style.transform = "none"; }}
      onPointerLeave={e => { e.currentTarget.style.transform = "none"; }} {...rest}>
      {typeof icon === "string" ? <Icon name={icon} size={28} color={emergency ? "var(--pin-emergency)" : "var(--text-heading)"} /> : icon}
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", letterSpacing: "var(--ls-snug)", textAlign: "center" }}>{label}</span>
      {caption ? <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", textAlign: "center" }}>{caption}</span> : null}
      {badge ? <span style={{ position: "absolute", top: 8, right: 10, padding: "1px 6px", borderRadius: 999, background: "var(--state-danger)", color: "#fff", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-semibold)" }}>{badge}</span> : null}
    </button>
  );
}
