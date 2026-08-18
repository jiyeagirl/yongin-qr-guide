import React from "react";
import { SegmentedTabs } from "../navigation/SegmentedTabs.jsx";

/* 목록 바로 위에 붙는 제어 줄 — 결과 수 + 정렬 토글, 그리고 그 아래 보조 필터 한 줄.
 *
 * 기능명세서 5-3 #4 의 답 중 시트 쪽 절반이다. S03 상점가 탭에는 필터가 4개(검색·업종 칩·
 * 온누리 토글·정렬) 있는데 전부 한 곳에 고정하면 시트 상단 절반이 필터로 찬다.
 * 그래서 둘로 나눈다:
 *
 *   지도 위 (z 300)   검색창 · 업종 칩       — 지도를 보며 범위를 좁히는 것
 *   목록 위 (sticky)  결과 수 · 정렬 · 온누리 — 목록을 보며 순서와 조건을 바꾸는 것
 *
 * 정렬은 업종 칩과 조합 가능해야 하므로(U-ST-15) 칩을 대체하지 않고 별도 축으로 둔다.
 * 예: 음식 칩 + 인기순.
 *
 * sticky 는 시트의 스크롤 컨테이너 기준이다. 335개를 스크롤하는 동안에도
 * 정렬과 온누리 조건은 손에 닿아야 한다.
 */
export function ListControls({ title, sort, sortOptions = [], onSortChange, children, sticky = true, style, ...rest }) {
  return (
    <div style={{
      position: sticky ? "sticky" : "static", top: 0, zIndex: 2,
      background: "var(--surface-card)",
      borderBottom: "var(--stroke-hairline) solid var(--border-default)",
      padding: "var(--space-2) var(--gutter-screen) var(--space-1)", ...style }} {...rest}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", minHeight: "var(--tap-min)" }}>
        <h3 style={{ font: "var(--type-title-3)", letterSpacing: "var(--ls-snug)", minWidth: 0 }}>{title}</h3>
        {sortOptions.length ? (
          <SegmentedTabs variant="pill" items={sortOptions} value={sort} onChange={onSortChange}
            style={{ flex: "0 0 auto" }} aria-label="정렬 기준" />
        ) : null}
      </div>

      {/* 두 줄 사이에 구분선을 두지 않는다 — 같은 제어 묶음이라 선이 있으면 남남처럼 갈라져 보인다.
          바깥쪽 아래 테두리만으로 목록과 분리된다 */}
      {children || null}
    </div>
  );
}
