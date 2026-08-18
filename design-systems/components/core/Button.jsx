import React from "react";
import { Icon } from "./Icon.jsx";

const VARIANTS = {
  primary: { background: "var(--brand-primary)", color: "var(--text-on-brand)", border: "none" },
  secondary: { background: "var(--brand-secondary)", color: "var(--text-on-dark)", border: "none" },
  soft: { background: "var(--brand-primary-soft)", color: "var(--yong-green-800)", border: "none" },
  outline: { background: "var(--surface-card)", color: "var(--text-heading)", border: "var(--stroke-hairline) solid var(--border-strong)" },
  ghost: { background: "transparent", color: "var(--text-body)", border: "none" },
  danger: { background: "var(--state-danger)", color: "var(--text-on-dark)", border: "none" },
};
/* Heights are minimums — buttons grow with the label so 2차 글자 확대에서 잘리지 않는다. */
const SIZES = {
  sm: { minHeight: 40, padding: "8px 14px", fontSize: "var(--fs-label)", radius: "var(--radius-sm)", icon: 16 },
  md: { minHeight: "var(--tap-min)", padding: "11px 18px", fontSize: "var(--fs-body)", radius: "var(--radius-control)", icon: 20 },
  lg: { minHeight: 52, padding: "14px 22px", fontSize: "var(--fs-body-lg)", radius: "var(--radius-lg)", icon: 22 },
};

export function Button({ children, variant = "primary", size = "md", icon, iconEnd, block, disabled, style, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  return (
    <button disabled={disabled}
      style={{ display: block ? "flex" : "inline-flex", width: block ? "100%" : undefined, alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
        minHeight: s.minHeight, padding: s.padding, fontFamily: "var(--font-sans)", fontSize: s.fontSize, fontWeight: variant === "ghost" ? "var(--fw-semibold)" : "var(--fw-bold)",
        lineHeight: 1.35, letterSpacing: "var(--ls-snug)", borderRadius: s.radius, cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)", opacity: disabled ? 0.42 : 1, ...v, ...style }}
      onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(var(--press-scale))"; }}
      onPointerUp={e => { e.currentTarget.style.transform = "none"; }}
      onPointerLeave={e => { e.currentTarget.style.transform = "none"; }} {...rest}>
      {icon ? (typeof icon === "string" ? <Icon name={icon} size={s.icon} /> : icon) : null}
      {children}
      {iconEnd ? (typeof iconEnd === "string" ? <Icon name={iconEnd} size={s.icon} /> : iconEnd) : null}
    </button>
  );
}
