import React from "react";

export function Card({ children, tone = "plain", outlined = false, padding = "var(--space-5)", style, ...rest }) {
  const tones = {
    plain: { background: "var(--surface-card)" },
    brand: { background: "var(--surface-brand-soft)" },
    accent: { background: "var(--brand-accent-soft)" },
    dark: { background: "var(--surface-dark)", color: "var(--text-on-dark)" },
  };
  return (
    <div style={{ borderRadius: "var(--radius-card)", padding, border: outlined ? "var(--stroke-hairline) solid var(--border-brand)" : "var(--stroke-hairline) solid var(--border-default)", boxShadow: outlined ? "none" : "var(--shadow-card)", ...(tones[tone] || tones.plain), ...style }} {...rest}>
      {children}
    </div>
  );
}
