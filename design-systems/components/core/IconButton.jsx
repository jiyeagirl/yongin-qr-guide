import React from "react";
import { Icon } from "./Icon.jsx";

export function IconButton({ name, label, size = 44, variant = "ghost", style, ...rest }) {
  const skins = {
    ghost: { background: "transparent", border: "none", color: "var(--text-heading)" },
    soft: { background: "var(--surface-sunken)", border: "none", color: "var(--text-heading)" },
    outline: { background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-strong)", color: "var(--text-heading)" },
    brand: { background: "var(--brand-primary)", border: "none", color: "var(--text-on-brand)" },
  };
  return (
    <button aria-label={label} style={{ width: size, height: size, minWidth: "var(--tap-min)", minHeight: "var(--tap-min)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", cursor: "pointer", ...(skins[variant] || skins.ghost), ...style }} {...rest}>
      <Icon name={name} size={22} />
    </button>
  );
}
