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

/* 크기는 둘뿐이고 글자 크기는 건드리지 않는다 — 달라지는 것은 여백뿐이다 (2026-08-18).
   sm 은 **ListRow 의 tag 자리**를 위한 값이다. 그 자리에는 온누리 배지(OnnuriBadge)가
   이미 sm 으로 앉아 있는데, 같은 자리에 md 배지가 오면 목록을 훑을 때 알약 높이가
   행마다 들쭉날쭉해진다. 공공시설 목록(쉼터·AED)과 점포 목록(온누리)이 나란히 놓이는
   S02/S03 시트에서 특히 눈에 띈다. 글자는 그대로인데 알약만 커 보이는 것도 그래서다.
   md 는 상세 화면처럼 배지가 홀로 서는 자리에 남긴다. */
const SIZES = { md: "4px 9px", sm: "2px 7px" };

export function Badge({ children, tone = "neutral", size = "md", dot = false, style, ...rest }) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color: fg, fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-semibold)", lineHeight: 1.4, letterSpacing: "var(--ls-normal)", padding: SIZES[size] || SIZES.md, borderRadius: "var(--radius-pill)", ...style }} {...rest}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} /> : null}
      {children}
    </span>
  );
}
