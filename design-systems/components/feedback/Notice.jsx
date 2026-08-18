import React from "react";
import { Icon } from "../core/Icon.jsx";

/* [바탕, 아이콘·제목 색, 아이콘 이름, 본문 색] */
const TONES = {
  info: ["var(--state-info-soft)", "var(--yong-teal-700)", "info", "var(--text-body)"],
  success: ["var(--state-success-soft)", "var(--yong-green-800)", "circle-check", "var(--text-body)"],
  warning: ["var(--state-warning-soft)", "#8a5a12", "triangle-alert", "var(--text-body)"],
  danger: ["var(--state-danger-soft)", "#a5322b", "circle-alert", "var(--text-body)"],
  /* ── neutral (2026-08-18) ────────────────────────────────────────────────
     `info` 의 바탕(teal-100)이 **온누리 배지와 같은 색**이다. 둘 다 같은 화면에 있으면
     안내 띠가 온누리와 관련된 것처럼 읽힌다 — teal 은 이 앱에서 온누리가 가져간 색이다.
     그런데 "새 창으로 열립니다" 같은 문장은 알림도 경고도 아니고 그냥 사실 한 줄이라,
     의미색을 쓸 이유 자체가 없다. 회색 바탕에 회색 글자로 조용히 깐다.
     ink-500 on ink-50 = 5.05:1 로 AA(4.5:1)를 넘는다. */
  neutral: ["var(--surface-sunken)", "var(--text-muted)", "info", "var(--text-muted)"],
};

/* sm 은 본문 옆에 붙는 한 줄짜리 고지용이다. 글자만 줄이는 것이 아니라 여백·아이콘까지
   함께 줄인다 — 12px 글자에 space-4 여백이 붙으면 글자보다 여백이 크다.
   높이를 박지는 않는다: 글자를 확대하면 두 줄이 되며 늘어난다 (U-CM-14). */
const SIZES = {
  md: ["var(--space-4)", "var(--space-3)", 20, "var(--fs-body)", 1.55],
  sm: ["var(--space-2) var(--space-3)", "var(--space-2)", 15, "var(--fs-micro)", 1.45],
};

/* Inline advisory. Also used for the 원거리 안내 배너 (U-FC-09) — never show an empty result screen. */
export function Notice({ children, tone = "info", size = "md", title, style, ...rest }) {
  const [bg, fg, icon, ink] = TONES[tone] || TONES.info;
  const [pad, gap, iconSize, fs, lh] = SIZES[size] || SIZES.md;
  return (
    <div style={{ display: "flex", gap, padding: pad, background: bg, borderRadius: "var(--radius-md)", ...style }} {...rest}>
      <Icon name={icon} size={iconSize} color={fg} style={{ flex: "0 0 auto", marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? <div style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)", color: fg, marginBottom: 3 }}>{title}</div> : null}
        <div style={{ fontSize: fs, lineHeight: lh, color: ink }}>{children}</div>
      </div>
    </div>
  );
}
