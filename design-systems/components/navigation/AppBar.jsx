import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 상단 바. 2차의 언어·음성·글자크기 버튼 자리는 코드에서만 비워둔다 — 화면에 노출하지 않는다.

   제목은 3열 그리드로 정중앙에 놓는다. 좌우 열이 모두 1fr 이라 뒤로가기 버튼만 있고
   오른쪽이 비어 있어도(또는 그 반대여도) 제목 열의 중심이 바 전체의 중심과 일치한다.
   flex + paddingRight 보정 방식은 양쪽 폭이 다를 때 제목이 한쪽으로 밀린다.

   제목이 길면 자르지 않고 줄바꿈한다 — 헤더는 min-height 만 가지므로 함께 늘어난다
   (U-CM-14 고정 높이 금지).

   ── 두 줄 제목 (label + leading) ────────────────────────────────────────
   셸(S02·S03·S04)의 상단은 화면 이름("용인시 위치안내")이 아니라 **지금 서 있는 곳**을 적는다.
   화면 이름은 바텀시트 제목이 이미 말하고 있어 같은 자리에 두 번 적을 이유가 없고,
   기준점은 이 서비스의 모든 거리 표기가 매달린 정보라 늘 보여야 한다 (U-CM-04).

     label   작은 윗줄 — "지금 계신 곳"
     title   굵은 아랫줄 — 지점명
     leading 왼쪽 자리 — 조아용 (기능명세서 5-1)

   둘 중 하나라도 있으면 제목을 **왼쪽으로 붙인다.** 왼쪽에 캐릭터가 서 있는데 글자만
   가운데 있으면 둘이 한 덩어리로 읽히지 않고, 두 줄짜리를 가운데 정렬하면 윗줄과 아랫줄의
   시작점이 어긋나 읽는 눈이 좌우로 흔들린다.

   뒤로가기(상세 화면)와 leading(셸)은 같은 자리를 쓰므로 동시에 오지 않는다. */
export function AppBar({ title, label, leading, back = false, onBack, actions, tone = "plain", style, ...rest }) {
  const brand = tone === "brand";
  const stacked = Boolean(label || leading);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: "var(--z-filter)",
      display: "grid",
      gridTemplateColumns: stacked
        ? "auto minmax(0, 1fr) auto"
        : "minmax(var(--tap-min), 1fr) auto minmax(var(--tap-min), 1fr)",
      alignItems: "center", gap: "var(--space-2)", minHeight: "var(--appbar-h)",
      padding: "6px var(--space-2)", background: brand ? "var(--brand-primary)" : "rgba(255,255,255,.94)",
      backdropFilter: brand ? "none" : "var(--blur-glass)",
      borderBottom: brand ? "none" : "var(--stroke-hairline) solid var(--border-default)",
      color: brand ? "var(--text-on-brand)" : "var(--text-heading)", ...style }} {...rest}>

      <span style={{ justifySelf: "start", display: "inline-flex", alignItems: "center" }}>
        {leading || (back ? (
          <button onClick={onBack} aria-label="뒤로"
            style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
            <Icon name="chevron-left" size={24} />
          </button>
        ) : null)}
      </span>

      <div style={{ minWidth: 0, textAlign: stacked ? "left" : "center" }}>
        {label ? (
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)",
            fontWeight: "var(--fw-medium)", lineHeight: 1.3, letterSpacing: "var(--ls-normal)",
            color: brand ? "var(--text-on-brand)" : "var(--text-muted)", opacity: brand ? 0.9 : 1 }}>{label}</span>
        ) : null}
        <h1 style={{ minWidth: 0, fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-bold)",
          color: "inherit", letterSpacing: "var(--ls-snug)", lineHeight: 1.35, wordBreak: "keep-all" }}>{title}</h1>
      </div>

      <span style={{ justifySelf: "end", display: "inline-flex", alignItems: "center", gap: 2 }}>{actions}</span>
    </header>
  );
}
