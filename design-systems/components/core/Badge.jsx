import React from "react";

const TONES = {
  neutral: ["var(--surface-sunken)", "var(--text-body)"],
  brand: ["var(--brand-primary-soft)", "var(--yong-green-800)"],
  info: ["var(--state-info-soft)", "var(--yong-teal-700)"],
  success: ["var(--state-success-soft)", "var(--yong-green-800)"],
  warning: ["var(--state-warning-soft)", "#8a5a12"],
  danger: ["var(--state-danger-soft)", "#a5322b"],
  accent: ["var(--brand-accent)", "var(--yong-ink-900)"],
  onnuri: ["var(--state-info-soft)", "var(--yong-teal-900)"],
};

export function Badge({ children, tone = "neutral", dot = false, style, ...rest }) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color: fg, fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-semibold)", lineHeight: 1.4, letterSpacing: "var(--ls-normal)", padding: "4px 9px", borderRadius: "var(--radius-pill)", ...style }} {...rest}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} /> : null}
      {children}
    </span>
  );
}
