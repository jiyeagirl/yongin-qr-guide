import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Toast({ children, tone = "dark", icon = "circle-check", style, ...rest }) {
  const dark = tone === "dark";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "12px 16px", borderRadius: "var(--radius-pill)", zIndex: "var(--z-toast)",
      background: dark ? "rgba(22,34,28,.92)" : "var(--brand-primary)", color: dark ? "var(--text-on-dark)" : "var(--text-on-brand)",
      fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", boxShadow: "var(--shadow-raised)", animation: "yong-pop var(--dur-base) var(--ease-bounce)", ...style }} {...rest}>
      <Icon name={icon} size={20} />
      {children}
    </div>
  );
}
