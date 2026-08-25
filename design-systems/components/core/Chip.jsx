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
/* pad 는 [아이콘 있을 때, 없을 때], padX 는 뒤에 ×가 붙었을 때의 같은 쌍이다.
   ×는 글자가 아니라 그림이라 오른쪽 여백이 그대로면 알약이 헐렁해 보인다 — 4px 줄인다. */
/* ── dense (2026-08-24 신설) ────────────────────────────────────────────────
   **가로 여백과 아이콘-글자 사이만 줄인다.** 알약 높이(pill) · 글자 크기 · 아이콘 크기 ·
   44px 손가락 자리는 하나도 건드리지 않는다 — 작아 보이게 하려는 것이 아니라 **한 줄에
   몇 개가 들어오느냐**를 늘리려는 것이다.

   나온 자리는 필터 칩 줄이다 (FilterBar). 공공시설 탭이 [전체]까지 다섯 알약이 되면서
   360px 화면에서 마지막 [화장실]이 가장자리 너머로 완전히 나가 버렸다. `size="sm"` 으로
   내리면 들어오기는 하지만 글자가 12px 이 되어, 칩이 주인공인 줄에서 결과보다 조건이
   작아진다 (size 머리말). 알약 하나에서 6~7px 씩만 걷어내면 다섯이 걸친다.

   개당 md 기준 −7px: 왼쪽 9→7 · 오른쪽 11→8 · 아이콘 사이 5→4. */
const CHIP_SIZES = {
  md: { pill: 34, pad: ["0 11px 0 9px", "0 12px"], padX: ["0 7px 0 9px", "0 8px 0 12px"],
    font: "var(--fs-caption)", icon: 15, gap: 5,
    dense: { pad: ["0 8px 0 7px", "0 9px"], padX: ["0 5px 0 7px", "0 6px 0 9px"], gap: 4 } },
  sm: { pill: 28, pad: ["0 9px 0 7px", "0 10px"], padX: ["0 5px 0 7px", "0 6px 0 10px"],
    font: "var(--fs-micro)", icon: 13, gap: 4,
    dense: { pad: ["0 7px 0 6px", "0 8px"], padX: ["0 4px 0 6px", "0 5px 0 8px"], gap: 3 } },
};

/* tint 는 **선택되지 않은** 쉼 상태에 색을 준다 (2026-08-19 추가). 칩 줄이 그대로
   범례가 되게 하려는 것이다 — AED 는 적색, 쉼터는 호박색처럼 지도 핀과 같은 갈래로
   보이면 칩을 누르기 전에 무엇이 무엇인지 알 수 있다. 선택 상태는 언제나 꽉 찬 색(-solid)
   이라, "지금 고른 것"이 어느 틴트에서든 같은 방식으로 읽힌다.
   tint 를 주지 않으면 예전 그대로 흰 알약이다 — 업종 칩처럼 갈래가 없는 자리를 위해서다.

   ── `tintRest={false}` — 색은 켜졌을 때만 (2026-08-20 추가) ────────────────────
   **혼자 서 있는 칩**을 위한 것이다. 범례는 칩이 여럿 늘어서서 서로를 견줄 때 성립한다 —
   넷이 각기 다른 색이면 그 색이 갈래를 말하지만, 하나뿐인 칩이 색을 띠고 있으면 견줄 대상이
   없어 그 색이 **"켜져 있다"로 읽힌다.** 온누리 칩이 그랬다: 걸지도 않았는데 걸린 것처럼
   보였다.

   그래서 쉼 상태는 흰 알약(업종 칩과 같은 모양)으로 두고, 색은 켜졌을 때만 쓴다.
   `tint` 는 여전히 **어느 색으로 차는가**를 정한다 — 온누리는 teal 로 차서 브랜드 초록으로
   차는 업종 칩과 갈린다. */
const CHIP_TINTS = ["green", "teal", "cream", "amber", "red", "blue", "violet", "sand", "rose", "neutral"];
const SOLID_INK = { cream: true, sand: true };

/* removable: 켜져 있을 때 알약 끝에 ×를 보인다 (2026-08-20 추가).
   **×는 따로 눌리는 버튼이 아니다.** 알약 전체가 이미 하나의 버튼이고, 그 안에 두 번째
   버튼을 넣으면 `<button>` 안의 `<button>` 이 되어 문법이 깨지는 데다 34px 알약 안에서
   두 개의 44px 손가락 자리를 나눌 수도 없다. ×는 **"눌러서 지울 수 있다"고 말하는 그림**이며,
   누르는 자리는 알약 어디든 같다.

   덕분에 켜짐/꺼짐이 색뿐 아니라 **형태**로도 갈린다 — 색약 사용자에게 그것이 유일한 단서다
   (OnnuriToggle 이 축소판 스위치를 달고 있던 것과 같은 이유). */
export function Chip({ children, selected = false, tint, tintRest = true, icon, count, removable = false,
  elevated = false, size = "md", dense = false, onClick, style, ...rest }) {
  const base = CHIP_SIZES[size] || CHIP_SIZES.md;
  const z = dense && base.dense ? { ...base, ...base.dense } : base;
  const t = CHIP_TINTS.includes(tint) ? tint : null;
  const showX = removable && selected;
  const skin = selected
    ? (t
      /* cream·sand 만 -solid 위 글자가 잉크다. 나머지 여덟은 흰 글자로 대비가 나오지만
         이 둘은 -solid 단(cream-700 · sand-500)도 밝아 흰 글자가 AA 에 못 미친다
         (sand-500 위 흰 글자 2.67:1 · 잉크 6.14:1) */
      ? { background: `var(--tint-${t}-solid)`, color: SOLID_INK[t] ? "var(--yong-ink-900)" : "var(--yong-white)",
          borderColor: `var(--tint-${t}-solid)` }
      : { background: "var(--brand-primary)", color: "var(--text-on-brand)", borderColor: "var(--brand-primary)" })
    : (t && tintRest
      ? { background: `var(--tint-${t}-bg)`, color: `var(--tint-${t}-fg)`, borderColor: `var(--tint-${t}-border)` }
      : { background: "var(--surface-card)", color: "var(--text-body)", borderColor: "var(--border-strong)" });
  return (
    <button onClick={onClick}
      style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: "var(--tap-min)", padding: "5px 0", background: "none", border: "none",
        cursor: "pointer", WebkitTapHighlightColor: "transparent", ...style }} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: z.gap, whiteSpace: "nowrap",
        minHeight: z.pill, padding: (showX ? z.padX : z.pad)[icon ? 0 : 1], borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)", fontSize: z.font, fontWeight: "var(--fw-bold)",
        lineHeight: 1.3, letterSpacing: "var(--ls-normal)",
        transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)",
        /* elevated: 지도 위에 떠 있을 때. 배경 패널 없이 알약만 놓이므로 그림자로 지도와 분리한다 */
        boxShadow: elevated ? "var(--shadow-card)" : "none",
        borderWidth: "var(--stroke-hairline)", borderStyle: "solid", ...skin }}>
        {icon ? (typeof icon === "string" ? <Icon name={icon} size={z.icon} /> : icon) : null}
        {children}
        {count != null ? <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", opacity: selected ? 0.85 : 0.55 }}>{count}</span> : null}
        {/* 개수 뒤에 온다 — "온누리 가맹점 139 ×" 에서 ×가 지우는 대상은 개수가 아니라 알약 전체다.
            marginLeft 로 앞의 글자와 조금 떼어 낱말의 일부처럼 붙어 보이지 않게 한다 */}
        {showX ? <Icon name="x" size={z.icon} style={{ marginLeft: 1, opacity: 0.9 }} /> : null}
      </span>
    </button>
  );
}
