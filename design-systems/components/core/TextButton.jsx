import React from "react";
import { Icon } from "./Icon.jsx";

/* 글자만으로 된 작은 동작. 목록을 펼치고 접는 자리가 첫 사용처다 (S04 둘러보기).
 *
 * ── 왜 Button 을 쓰지 않는가 ───────────────────────────────────────────────
 * `Button` 은 가장 작은 `sm` 도 최소 높이 40px 에 굵은 라벨이고, `outline` 은 흰 바탕과
 * 테두리를 갖는다. 목록 끝의 [더 보기]에 그것을 쓰면 **목록 항목보다 버튼이 더 눈에 띈다** —
 * 주인공은 목록이고 이 동작은 그 목록을 다루는 손잡이일 뿐이다.
 *
 * 그래서 바탕도 테두리도 없이 글자와 꺾쇠만 남긴다. 색은 브랜드색을 써서 "누를 수 있는
 * 글자"로 읽히게 한다 — 회색으로 두면 안내 문구와 구분되지 않는다.
 *
 * ── 그래도 터치 영역은 44px 이다 (U-CM-13) ────────────────────────────────
 * 보이는 크기와 누를 수 있는 크기는 다른 이야기다. 글자는 캡션 크기지만 위아래로 보이지
 * 않는 여백을 두어 손가락이 닿는 높이는 지킨다. 눈에는 작고 손에는 크다.
 *
 * 고정 높이가 아니라 최소 높이다 — 2차의 글자 확대에서 라벨이 커지면 함께 늘어난다.
 */
export function TextButton({ children, icon, iconEnd, tone = "brand", style, ...rest }) {
  const color = tone === "muted" ? "var(--text-muted)" : "var(--brand-primary)";
  return (
    <button type="button"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        minHeight: "var(--tap-min)", padding: "0 var(--space-3)",
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)",
        fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-normal)",
        lineHeight: 1.4, color, ...style }} {...rest}>
      {icon ? (typeof icon === "string" ? <Icon name={icon} size={14} /> : icon) : null}
      {children}
      {iconEnd ? (typeof iconEnd === "string" ? <Icon name={iconEnd} size={14} /> : iconEnd) : null}
    </button>
  );
}

export default TextButton;
