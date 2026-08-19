import React from "react";
import { CategoryIcon } from "../core/CategoryIcon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 신규 및 인기 매장 가로 스크롤 (U-ST-09). 수백 개 목록 탐색을 우회하는 지름길이므로
   상점가 상세 상단(목록보다 위)에 둔다. S02 홈의 "신규 및 인기 매장" 영역도 같은 컴포넌트를 쓴다.
   카드에 고정 높이를 주지 않는다 — 가장 긴 카드에 맞춰 stretch 된다.

   ── tone: 두 레일은 **같은 초록의 두 겹**이다 (2026-08-19 개편) ──────────────
   둘 다 초록이었다가 신규 초록 · 인기 크림으로 갈랐던 자리다. 두 섹션이 나란히 이어져
   있어서 머리말을 읽지 않으면 **같은 줄이 두 번 깔린 것처럼** 보였기 때문이다 —
   뽑은 근거가 다른 목록인데("새로 생겼다" / "많이 봤다") 생김새가 같으면 그 근거가
   화면에서 사라진다.

   그런데 틴트 시스템(tokens/surfaces.css)에서 **크림은 축제·이벤트의 색**이다. 둘러보기
   탭은 축제 섹션 바로 아래가 이 레일이라, 같은 화면에서 크림이 두 가지를 뜻하게 됐다.

   신규도 인기도 도메인은 상점가·점포(green) 하나다. 그래서 다른 색을 주지 않고 같은
   초록의 농도로 가른다 — 둘 다 1px 이고 신규는 green-500, 인기는 green-700 이다.
   "둘 다 점포"라는 사실은 남는다.

   ── 바탕을 비웠다 (2026-08-19) ────────────────────────────────────────────
   전에는 두 레일 다 green-100 을 깔았다. "흰 카드는 흰 시트 위에서 테두리만 남아 지름길로
   읽히지 않는다"가 그 이유였는데, 같은 날 **축제 진행중 카드가 green-50 으로 오면서**
   근거가 뒤집혔다 — 축제 섹션 바로 아래에 그보다 진한 초록 카드가 여덟 장 깔리자,
   화면에서 제일 넓은 초록이 축제가 아니라 이 레일이 됐다.

   지름길로 읽히는 일은 이제 **테두리와 가로 스크롤**이 맡는다. 아래 점포 목록은 행 사이
   실선뿐이라, 테두리로 둘린 카드가 가로로 늘어선 것만으로 이미 다른 물건이다.

   색도 굵기도 화면이 고르지 않고 토큰이 정한다 (--rail-new-* / --rail-hot-*). 어느 계열을
   왜 쓸 수 있고 없는지는 tokens/colors.css 에 적어두었다 — 화면마다 다시 고르면
   같은 레일이 화면에 따라 다른 색이 된다. */
const TONES = {
  new: ["var(--rail-new-bg)", "var(--rail-new-line)", "var(--rail-new-ink)", "var(--rail-new-w)"],
  hot: ["var(--rail-hot-bg)", "var(--rail-hot-line)", "var(--rail-hot-ink)", "var(--rail-hot-w)"],
};

export function StoreRail({ items = [], onPick, tone = "new", label = "신규 및 인기 매장", style, ...rest }) {
  const [bg, line, ink, weight] = TONES[tone] || TONES.new;
  return (
    <div role="list" aria-label={label}
      style={{ display: "flex", alignItems: "stretch", gap: "var(--space-2)", overflowX: "auto",
        padding: "2px 0 var(--space-2)", scrollbarWidth: "none", ...style }} {...rest}>
      {items.map(s => (
        <button key={s.name} role="listitem" onClick={() => onPick && onPick(s)}
          style={{ flex: "0 0 auto", width: 152, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5,
            padding: "var(--space-3)", textAlign: "left", background: bg,
            border: `${weight} solid ${line}`, borderRadius: "var(--radius-md)",
            cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: ink }}>
            <CategoryIcon type={s.cat} size={18} />
            {s.onnuri ? <OnnuriBadge size="sm" /> : null}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{s.name}</span>
          {/* note 는 이 카드가 여기 있는 이유다("이번 주 조회 1위"). 회색으로 묻히면 지름길의
              근거가 사라지므로 테두리와 같은 계열의 짙은 색으로 적는다 (흰 바탕 6.4:1) */}
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)", color: ink, lineHeight: 1.35 }}>{s.note}</span>
        </button>
      ))}
    </div>
  );
}
