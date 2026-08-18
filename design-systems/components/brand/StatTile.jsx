import React from "react";
import { Icon } from "../core/Icon.jsx";

/* A single number told plainly — used on dashboards and program status screens. */
export function StatTile({ label, value, unit, icon, tone = "plain", delta, style, ...rest }) {
  const dark = tone === "dark";
  return (
    <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-card)", background: dark ? "var(--surface-dark)" : tone === "brand" ? "var(--surface-brand-soft)" : "var(--surface-card)", border: dark ? "none" : "var(--stroke-hairline) solid var(--border-default)", boxShadow: dark ? "none" : "var(--shadow-card)", ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon ? <Icon name={icon} size={18} color={dark ? "var(--yong-green-300)" : "var(--brand-secondary)"} /> : null}
        <span style={{ font: "var(--type-caption)", color: dark ? "rgba(255,255,255,.72)" : "var(--text-muted)" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--fw-semibold)", fontSize: 24, lineHeight: 1.15, letterSpacing: "var(--ls-tight)", color: dark ? "var(--yong-white)" : "var(--text-heading)" }}>{value}</span>
        {unit ? <span style={{ font: "var(--type-caption)", color: dark ? "rgba(255,255,255,.72)" : "var(--text-muted)" }}>{unit}</span> : null}
      </div>
      {delta ? <div style={{ marginTop: 6, font: "var(--type-micro)", color: dark ? "var(--yong-green-300)" : "var(--yong-green-700)" }}>{delta}</div> : null}
    </div>
  );
}
