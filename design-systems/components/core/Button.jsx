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
/* Heights are minimums — buttons grow with the label so 2차 글자 확대에서 잘리지 않는다.
 *
 * ── xs 는 터치 타겟 44px(U-CM-13)을 지키지 않는다 ────────────────────────────
 * 알고 쓰는 예외다. 지도 위 미리보기 카드처럼 **카드 자체가 작아서 버튼이 내용보다 커
 * 보이는 자리**에만 쓴다 (2026-08-18. 그 카드가 지도를 다 덮는다는 지적에서 나왔다).
 * sm 도 이미 40px 로 44 아래인데, xs 는 한 단계 더 내려간다.
 *
 * 그래서 쓸 수 있는 조건을 좁힌다:
 *   · 같은 줄에 버튼이 둘을 넘지 않고, 사이 간격이 --space-2 이상이어야 한다
 *   · 그 동작이 화면에서 유일한 길이면 안 된다 (미리보기의 [상세 보기]는 목록에도 있다)
 *   · 목록 행이나 폼처럼 반복되는 자리에는 쓰지 않는다 — 거기서는 오조작이 쌓인다
 * 조건에 맞지 않으면 sm 을 쓴다. 작아 보인다는 이유만으로 내리지 않는다.
 */
const SIZES = {
  xs: { minHeight: 34, padding: "6px 11px", fontSize: "var(--fs-caption)", radius: "var(--radius-sm)", icon: 14 },
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
