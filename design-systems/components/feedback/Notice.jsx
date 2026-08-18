import React from "react";
import { Icon } from "../core/Icon.jsx";

const TONES = {
  info: ["var(--state-info-soft)", "var(--yong-teal-700)", "info"],
  success: ["var(--state-success-soft)", "var(--yong-green-800)", "circle-check"],
  warning: ["var(--state-warning-soft)", "#8a5a12", "triangle-alert"],
  danger: ["var(--state-danger-soft)", "#a5322b", "circle-alert"],
};

/* Inline advisory. Also used for the 원거리 안내 배너 (U-FC-09) — never show an empty result screen. */
export function Notice({ children, tone = "info", title, style, ...rest }) {
  const [bg, fg, icon] = TONES[tone] || TONES.info;
  return (
    <div style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-4)", background: bg, borderRadius: "var(--radius-md)", ...style }} {...rest}>
      <Icon name={icon} size={20} color={fg} style={{ marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        {title ? <div style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)", color: fg, marginBottom: 3 }}>{title}</div> : null}
        <div style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, color: "var(--text-body)" }}>{children}</div>
      </div>
    </div>
  );
}
