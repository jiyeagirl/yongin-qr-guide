import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Badge } from "../core/Badge.jsx";

const STATE_TONE = { 진행중: "success", 예정: "accent", 종료: "neutral" };

/* 진행 중 또는 예정 축제 배너 (U-ST-03, U-FT-03). 상점가 탭 시트 헤더가 쓴다.
   종료된 축제는 호출하는 쪽에서 걸러 넣는다 — 배너 자리를 종료 안내로 채우지 않는다.
   범위가 "현재 상점가 1건"이라, 둘러보기 탭의 전체 축제 목록과 겹치지 않는다.

   ── 닫을 수 있다 (2026-08-18) ──────────────────────────────────────────────
   축제에 관심이 없는 사람에게 이 배너는 점포 목록 위에 늘 얹혀 있는 두 줄이다.
   `onDismiss` 를 주면 우측 상단에 [X] 가 붙는다.

   **닫힘 상태는 이 컴포넌트가 들고 있지 않는다.** 시트 헤더는 탭을 옮기면 언마운트되므로
   여기에 두면 둘러보기를 갔다 올 때마다 배너가 되살아나 같은 것을 몇 번이고 닫아야 한다
   (U-FC-09 말풍선에서 겪은 그대로다). 셸이 들고, 여기는 알리기만 한다.

   ── 왜 <button> 안에 [X] 를 넣지 않았나 ────────────────────────────────────
   단추 안의 단추는 HTML 이 허용하지 않고, 브라우저마다 안쪽 클릭이 바깥으로 새거나
   삼켜진다. 겉을 <div> 로 두고 본문과 [X] 를 형제 단추로 나란히 놓는다. */
export function FestivalBanner({ festival, onClick, onDismiss, dismissLabel = "축제 안내 닫기", style, ...rest }) {
  if (!festival) return null;

  return (
    <div
      style={{ display: "flex", alignItems: "stretch",
        background: "var(--brand-accent-soft)", border: "var(--stroke-hairline) solid var(--yong-cream-300)",
        borderRadius: "var(--radius-md)", overflow: "hidden", ...style }} {...rest}>

      <button onClick={onClick}
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-3)",
          minHeight: "var(--tap-comfortable)", padding: "var(--space-3) var(--space-4)", textAlign: "left",
          background: "none", border: "none", cursor: "pointer" }}>
        <Icon name="party-popper" size={22} color="var(--yong-cream-900)" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{festival.name}</span>
            {/* size="sm" — 축제명 옆에 붙는 알약이라 목록의 tag 자리와 같은 성격이다
                (Badge 주석). md 로 두면 12px 글자에 알약만 부풀어, 바로 아래 목록의
                온누리 배지보다 커 보인다 — 같은 시트 안에서 두 알약의 높이가 갈린다 */}
            <Badge size="sm" tone={STATE_TONE[festival.state] || "neutral"}>{festival.state}</Badge>
          </span>
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-body)", marginTop: 2, lineHeight: 1.4 }}>{festival.date}</span>
        </span>
        {/* [X] 가 붙으면 꺾쇠를 뺀다 — 오른쪽 끝에 아이콘 둘이 붙으면 어느 것이 닫기인지
            눌러봐야 안다. 누를 수 있다는 신호는 [X] 와 나란한 제목·배지가 이미 준다 */}
        {onDismiss ? null : <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" />}
      </button>

      {onDismiss ? (
        <button onClick={onDismiss} aria-label={dismissLabel} title={dismissLabel}
          style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "flex-start", justifyContent: "center",
            minWidth: "var(--tap-min)", padding: "var(--space-3) var(--space-2) 0 0",
            background: "none", border: "none", cursor: "pointer", color: "var(--yong-cream-900)" }}>
          <Icon name="x" size={18} />
        </button>
      ) : null}
    </div>
  );
}
