import React from "react";
import { SortSelect } from "./SortSelect.jsx";

/* 목록 바로 위에 붙는 제어 줄 — 결과 수 + 정렬 토글, 그리고 그 아래 보조 필터 한 줄.
 *
 * 기능명세서 5-3 #4 의 답 중 시트 쪽 절반이다. S03 상점가 탭에는 필터가 4개(검색·업종 칩·
 * 온누리 칩·정렬) 있는데 전부 한 곳에 고정하면 시트 상단 절반이 필터로 찬다.
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
 *
 * ── 정렬은 분절 토글이 아니라 고르기다 (2026-08-18) ──────────────────────────
 * [거리순|인기순] 두 칸짜리 알약을 쓰다가 `SortSelect`(글자 + ⇅, 눌러서 고르기)로 바꿨다.
 * 칸 둘이 나란하면 바로 아랫줄의 온누리 칩처럼 **둘 다 켤 수 있는 것**으로 보이는데,
 * 정렬은 하나만 고르는 축이다. 가로도 짧아져 결과 수가 밀리지 않는다. (SortSelect 주석)
 */
/* ── `aside` — 제목 옆에 서는 것 (2026-08-20) ────────────────────────────────
 * `children` 은 **제 줄**을 갖는다 (S12·S13 의 칩 줄처럼 가로로 흐르는 것들). 조건이
 * 알약 하나뿐일 때 그 줄을 통째로 내주면, 44px 을 쓰면서 오른쪽 3분의 2가 비어 있는 줄이
 * 생긴다 — 절반 스냅의 시트에서 그 44px 은 점포 한 줄이다. `aside` 는 제목 바로 오른쪽에
 * 붙어 그 줄을 아낀다.
 *
 * 자리는 제목 **다음, 정렬 앞**이다. 셋 다 "이 목록에 지금 걸린 것"이지만 제목(결과 수)이
 * 결과이고 나머지 둘이 원인이라, 결과를 맨 앞에 두고 원인을 뒤에 세운다.
 *
 * 가로가 빠듯한 줄이므로 `aside` 에 넣는 것은 **짧아야 한다.** 360px 화면에서 제목
 * ("전체 335곳" ≈ 84px)과 정렬("⇅ 거리순" ≈ 92px)을 빼면 남는 것은 130px 남짓이다.
 * 넘치면 제목이 두 줄로 접히는데, "전체 / 335곳" 은 잘린 것처럼 보인다. */
export function ListControls({ title, aside, sort, sortOptions = [], onSortChange, children, sticky = true, style, ...rest }) {
  return (
    <div style={{
      position: sticky ? "sticky" : "static", top: 0, zIndex: 2,
      background: "var(--surface-card)",
      borderBottom: "var(--stroke-hairline) solid var(--border-default)",
      /* 위아래 여백을 space-2 → space-1 → 0 으로 두 번 줄였다 (2026-08-18).
         **안쪽 두 행이 각각 44px(--tap-min)을 이미 갖고 있어, 바깥 여백은 손가락 자리에
         아무것도 보태지 않으면서 세로만 먹는다.** 절반 스냅의 시트에서는 그 세로가
         곧 목록 한 줄이다. 위로는 시트 헤더가, 아래로는 이 블록의 테두리가 경계를 맡는다. */
      padding: "0 var(--gutter-screen)", ...style }} {...rest}>

      {/* 결과 수도 정렬도 없으면 이 줄 자체를 그리지 않는다 (2026-08-18). 빈 h3 를 남기면
          44px(--tap-min)짜리 빈 띠가 칩 위에 앉는다 — 누를 것이 없는 자리가 손가락 하나
          높이를 차지한다. 칩만 쓰는 화면(S12)에도 이 컴포넌트를 쓸 수 있게 하려는 것이지,
          결과 수를 없애도 된다는 뜻은 아니다: 목록이 길고 필터가 여럿이면 여전히 필요하다. */}
      {title || aside || sortOptions.length ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minHeight: "var(--tap-min)" }}>
          {/* 제목과 aside 를 한 묶음으로 두고 그 묶음이 남는 가로를 갖는다 —
              정렬은 그래서 따로 밀지 않아도 오른쪽 끝에 선다 */}
          <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <h3 style={{ font: "var(--type-title-3)", letterSpacing: "var(--ls-snug)", minWidth: 0 }}>{title}</h3>
            {aside || null}
          </div>
          {sortOptions.length ? (
            <SortSelect options={sortOptions} value={sort} onChange={onSortChange} label="정렬 기준" />
          ) : null}
        </div>
      ) : null}

      {/* 두 줄 사이에 구분선을 두지 않는다 — 같은 제어 묶음이라 선이 있으면 남남처럼 갈라져 보인다.
          바깥쪽 아래 테두리만으로 목록과 분리된다 */}
      {children || null}
    </div>
  );
}
