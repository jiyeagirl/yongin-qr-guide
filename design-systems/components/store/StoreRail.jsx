import React from "react";
import { CategoryIcon } from "../core/CategoryIcon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 신규 및 인기 매장 가로 스크롤 (U-ST-09). 수백 개 목록 탐색을 우회하는 지름길이므로
   상점가 상세 상단(목록보다 위)에 둔다. S02 홈의 "신규 및 인기 매장" 영역도 같은 컴포넌트를 쓴다.
   카드에 고정 높이를 주지 않는다 — 가장 긴 카드에 맞춰 stretch 된다.

   흰 카드였을 때는 흰 시트 위에서 테두리만 남아 지름길로 읽히지 않았다.
   옅게 깔아 목록의 흰 행들과 구분한다.

   ── tone: 두 레일은 색이 다르다 (2026-08-18) ──────────────────────────────
   둘 다 초록이었는데, 두 섹션이 나란히 이어져 있어서 머리말을 읽지 않으면 **같은 줄이
   두 번 깔린 것처럼** 보였다. 뽑은 근거가 다른 목록인데("새로 생겼다" / "많이 봤다")
   생김새가 같으면 그 근거가 화면에서 사라진다.

     new   초록(brand). 이 앱의 기본색
     hot   크림(accent). 이 시스템에서 "눈길"을 맡는 색이고 조회수 상위라는 뜻과 맞는다

   색을 화면이 고르지 않고 토큰이 정한다 (--rail-new-* / --rail-hot-*). 어느 계열이
   왜 쓸 수 있고 없는지는 tokens/colors.css 에 적어두었다 — 화면마다 다시 고르면
   같은 레일이 화면에 따라 다른 색이 된다. */
const TONES = {
  new: ["var(--rail-new-bg)", "var(--rail-new-line)", "var(--rail-new-ink)"],
  hot: ["var(--rail-hot-bg)", "var(--rail-hot-line)", "var(--rail-hot-ink)"],
};

export function StoreRail({ items = [], onPick, tone = "new", label = "신규 및 인기 매장", style, ...rest }) {
  const [bg, line, ink] = TONES[tone] || TONES.new;
  return (
    <div role="list" aria-label={label}
      style={{ display: "flex", alignItems: "stretch", gap: "var(--space-2)", overflowX: "auto",
        padding: "2px 0 var(--space-2)", scrollbarWidth: "none", ...style }} {...rest}>
      {items.map(s => (
        <button key={s.name} role="listitem" onClick={() => onPick && onPick(s)}
          style={{ flex: "0 0 auto", width: 152, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5,
            padding: "var(--space-3)", textAlign: "left", background: bg,
            border: `var(--stroke-hairline) solid ${line}`, borderRadius: "var(--radius-md)",
            cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: ink }}>
            <CategoryIcon type={s.cat} size={18} />
            {s.onnuri ? <OnnuriBadge size="sm" /> : null}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{s.name}</span>
          {/* note 는 이 카드가 여기 있는 이유다("이번 주 조회 1위"). 회색으로 묻히면 지름길의
              근거가 사라지므로 바탕과 같은 계열의 짙은 색으로 적는다 (둘 다 AA 통과) */}
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)", color: ink, lineHeight: 1.35 }}>{s.note}</span>
        </button>
      ))}
    </div>
  );
}
