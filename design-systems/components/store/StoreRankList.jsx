import React from "react";
import { Icon } from "../core/Icon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 인기 매장 순위 목록 (2026-10-19, 사용자 요청 — 첨부한 예약 앱의 「TOP 랭킹」 모양).
 *
 *   ┌────────────────────────────────────────┐
 *   │ [사진]  1  가게 이름                    │   한 쪽에 네 줄. 옆으로 밀면 다음 쪽이 나오고,
 *   │ [칸 ]     음식 · 처인구 포곡읍 …        │   다음 쪽이 오른쪽에 살짝 걸쳐 더 있다는 것을 알린다
 *   │           이번 주 조회 1위              │
 *   └────────────────────────────────────────┘
 *
 * 사진 칸은 비워 둔다 — 이미지는 나중에 수집해 `store.images[0]` 로 들어온다. 값이 없으면
 * PhotoStrip 의 자리표시와 같은 회색 칸에 이미지 아이콘만 둔다.
 * 높이는 상수가 아니라 글에 따라 자란다 (고정 높이 금지, 2차 글자 확대 대응). 사진 칸만 정사각형이다.
 * 이름·업종·주소는 길면 줄이 접힌다 — 말줄임으로 잘라내지 않는다. */
const PER_PAGE = 4;
const THUMB = 84;

export function StoreRankList({ items = [], onPick, label = "인기 매장", style, ...rest }) {
  return (
    <div role="list" aria-label={label}
      style={{ display: "grid", gridAutoFlow: "column", gridTemplateRows: `repeat(${PER_PAGE}, auto)`,
        gridAutoColumns: "calc(100% - var(--space-6))", columnGap: "var(--space-4)",
        overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain", ...style }} {...rest}>
      {items.map((s, i) => {
        const src = s.images && s.images[0];
        const lastOfPage = (i % PER_PAGE) === PER_PAGE - 1 || i === items.length - 1;
        return (
          <button key={s.id || s.name} role="listitem" type="button" onClick={() => onPick && onPick(s)}
            style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", textAlign: "left",
              padding: "var(--space-3) 0", background: "none", border: "none", cursor: "pointer",
              borderBottom: lastOfPage ? "none" : "var(--stroke-hairline) solid var(--border-default)",
              scrollSnapAlign: "start", font: "inherit", color: "inherit" }}>
            <span style={{ flex: "0 0 auto", width: THUMB, height: THUMB, borderRadius: "var(--radius-md)",
              overflow: "hidden", background: "var(--surface-sunken)", display: "inline-flex",
              alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Icon name="image" size={24} />}
            </span>
            <span style={{ flex: "0 0 auto", minWidth: 18, fontSize: "var(--fs-title-3, 18px)", fontWeight: "var(--fw-bold)",
              fontStyle: "italic", color: "var(--text-heading)" }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)",
                  color: "var(--text-heading)", lineHeight: 1.35, wordBreak: "keep-all" }}>{s.name}</span>
                {s.onnuri ? <OnnuriBadge size="sm" /> : null}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", color: "var(--text-body)",
                lineHeight: 1.45, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                {[s.biz, s.addr].filter(Boolean).join(" · ")}
              </span>
              {s.note ? (
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)",
                  color: "var(--rail-hot-ink)", lineHeight: 1.35 }}>{s.note}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
