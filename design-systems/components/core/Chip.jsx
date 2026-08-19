import React from "react";
import { Icon } from "./Icon.jsx";

/* 업종 필터 알약. icon 은 Lucide 이름이나 완성된 엘리먼트(CategoryIcon)를 받는다.

   버튼(히트 영역)과 알약(보이는 것)을 분리한다.
   알약은 34px 이지만 버튼은 위아래 투명 여백을 포함해 44px 이다 —
   칩이 시각적으로 뚱뚱하지 않으면서도 터치 타겟 44px 규칙(U-CM-13)을 지킨다.
   고정 높이가 아니라 min-height 이므로 2차 글자 확대에서 알약이 함께 늘어난다. */
/* size="sm" 은 **알약만 작아지고 버튼은 그대로 44px 이다.** 목록 행 안에 칩이 들어가는
   자리(S08 코스의 [방문 완료])에서 나왔다 — 거기서는 34px 알약도 행의 주인공인 상호명보다
   커 보인다. 눌리는 크기는 건드리지 않으므로 U-CM-13 을 지킨다: 눈에만 작아진다.
   필터 줄처럼 칩이 여럿 늘어서는 자리는 기본(md)을 쓴다. 거기서는 칩이 주인공이다. */
const CHIP_SIZES = {
  md: { pill: 34, pad: ["0 11px 0 9px", "0 12px"], font: "var(--fs-caption)", icon: 15, gap: 5 },
  sm: { pill: 28, pad: ["0 9px 0 7px", "0 10px"], font: "var(--fs-micro)", icon: 13, gap: 4 },
};

/* tint 는 **선택되지 않은** 쉼 상태에 색을 준다 (2026-08-19 추가). 칩 줄이 그대로
   범례가 되게 하려는 것이다 — AED 는 적색, 쉼터는 호박색처럼 지도 핀과 같은 갈래로
   보이면 칩을 누르기 전에 무엇이 무엇인지 알 수 있다. 선택 상태는 언제나 꽉 찬 색(-solid)
   이라, "지금 고른 것"이 어느 틴트에서든 같은 방식으로 읽힌다.
   tint 를 주지 않으면 예전 그대로 흰 알약이다 — 업종 칩처럼 갈래가 없는 자리를 위해서다. */
const CHIP_TINTS = ["green", "teal", "cream", "amber", "red", "blue", "violet", "sand", "rose", "neutral"];
const SOLID_INK = { cream: true, sand: true };

export function Chip({ children, selected = false, tint, icon, count, elevated = false, size = "md", onClick, style, ...rest }) {
  const z = CHIP_SIZES[size] || CHIP_SIZES.md;
  const t = CHIP_TINTS.includes(tint) ? tint : null;
  const skin = selected
    ? (t
      /* cream·sand 만 -solid 위 글자가 잉크다. 나머지 여덟은 흰 글자로 대비가 나오지만
         이 둘은 -solid 단(cream-700 · sand-500)도 밝아 흰 글자가 AA 에 못 미친다
         (sand-500 위 흰 글자 2.67:1 · 잉크 6.14:1) */
      ? { background: `var(--tint-${t}-solid)`, color: SOLID_INK[t] ? "var(--yong-ink-900)" : "var(--yong-white)",
          borderColor: `var(--tint-${t}-solid)` }
      : { background: "var(--brand-primary)", color: "var(--text-on-brand)", borderColor: "var(--brand-primary)" })
    : (t
      ? { background: `var(--tint-${t}-bg)`, color: `var(--tint-${t}-fg)`, borderColor: `var(--tint-${t}-border)` }
      : { background: "var(--surface-card)", color: "var(--text-body)", borderColor: "var(--border-strong)" });
  return (
    <button onClick={onClick}
      style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: "var(--tap-min)", padding: "5px 0", background: "none", border: "none",
        cursor: "pointer", WebkitTapHighlightColor: "transparent", ...style }} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: z.gap, whiteSpace: "nowrap",
        minHeight: z.pill, padding: icon ? z.pad[0] : z.pad[1], borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)", fontSize: z.font, fontWeight: "var(--fw-bold)",
        lineHeight: 1.3, letterSpacing: "var(--ls-normal)",
        transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)",
        /* elevated: 지도 위에 떠 있을 때. 배경 패널 없이 알약만 놓이므로 그림자로 지도와 분리한다 */
        boxShadow: elevated ? "var(--shadow-card)" : "none",
        borderWidth: "var(--stroke-hairline)", borderStyle: "solid", ...skin }}>
        {icon ? (typeof icon === "string" ? <Icon name={icon} size={z.icon} /> : icon) : null}
        {children}
        {count != null ? <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", opacity: selected ? 0.85 : 0.55 }}>{count}</span> : null}
      </span>
    </button>
  );
}
