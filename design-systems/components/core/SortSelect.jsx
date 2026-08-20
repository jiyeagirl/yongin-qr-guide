import React from "react";
import { InlineSelect } from "./InlineSelect.jsx";

/* 정렬 기준 고르기 — 글자 + ⇅ 아이콘, 누르면 목록이 열린다 (2026-08-18).
 *
 *   [⇅ 거리순 ▾]
 *
 * ── 왜 분절 토글(SegmentedTabs)을 걷어냈나 ──────────────────────────────────
 * 전에는 [거리순|인기순] 두 칸짜리 알약이었다. 두 칸이 나란히 있으면 **둘 다 켤 수 있는
 * 것처럼** 보이는데(바로 옆줄의 온누리 칩이 실제로 그렇다) 정렬은 하나만 고르는 축이다.
 * 게다가 칸이 늘 때마다 가로가 늘어 결과 수("전체 335곳")를 밀어낸다 — 축제 목록(S12)은
 * 벌써 [임박순|가까운 순]으로 두 낱말이 길다.
 *
 * ── 알맹이는 InlineSelect 다 (2026-08-19) ──────────────────────────────────
 * 여닫기·바깥 누르기·Esc·초점 되돌리기·menuitemradio 는 정렬만의 것이 아니라 "줄 안에
 * 서는 하나 고르기"의 것이다. S08 코스 상세가 같은 모양으로 **출발지**를 고르게 되면서
 * 그 부분을 InlineSelect 로 옮겼다 — 두 벌로 두면 한쪽만 고쳐져 같은 드롭다운이 화면마다
 * 다르게 열린다. 여기 남은 것은 정렬이라는 **뜻**뿐이다 (⇅ 아이콘과 "정렬 기준" 라벨).
 */
export function SortSelect({ label = "정렬 기준", ...rest }) {
  return <InlineSelect icon="arrow-up-down" label={label} {...rest} />;
}

export default SortSelect;
