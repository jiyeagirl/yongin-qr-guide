import React from "react";
import { SectionHeader, StoreRankList, CourseCard, DistrictRow, Button } from "../../design-systems/index.js";

/* 상점가 탭 시트(DistrictSheet)와 둘러보기 탭(DiscoverPanel)이 같이 쓰는 섹션 조각 (2026-10-19).
 * 같은 「인기 매장」 · 「골목 한바퀴 코스」 · 「다른 골목형 상점가」가 두 화면에 한 벌씩 있으면
 * 한쪽만 고쳐지는 날이 온다 — 그래서 한 곳에 두고 두 화면이 가져다 쓴다. 가로 여백(gutter)은
 * 부르는 쪽이 정한다(`scope`). */

const GUTTER = { padding: "0 var(--gutter-screen)" };

/* 인기 매장 (U-DC-02) — 조회수 상위 순위 목록 (2026-10-19. 종전 가로 카드 레일 `StoreRail` 에서 바뀜) */
export function PopularSection({ items, note, onPick, style }) {
  if (!items || !items.length) return null;
  return (
    <section style={{ ...GUTTER, ...style }}>
      <SectionHeader title="인기 매장" note={note} />
      <StoreRankList items={items} label="인기 매장" onPick={onPick} />
    </section>
  );
}

/* 골목 한바퀴 추천 코스 (U-DC-03) — 가로 스크롤 카드 */
export function CourseSection({ courses, note, onPick, style }) {
  if (!courses || !courses.length) return null;
  return (
    <section style={style}>
      <div style={GUTTER}>
        <SectionHeader title="골목 한바퀴 코스 추천" note={note} />
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-3)",
        overflowX: "auto", padding: "2px var(--gutter-screen) var(--space-2)", scrollbarWidth: "none" }}>
        {courses.map(c => <CourseCard key={c.id} course={c} onClick={() => onPick(c)} />)}
      </div>
    </section>
  );
}

/* 다른 골목형 상점가 (U-DC-04) — 가까운 몇 곳 미리보기 + [전체보기]. 줄을 누르면 앱 안의
   상점가 안내로 간다 (DistrictInfo). `title` 은 화면마다 다르게 적는다. */
export function DistrictPreviewSection({ title, districts, onOpenAll, onOpen, allButtonLabel, style }) {
  return (
    <section style={{ ...GUTTER, ...style }}>
      {/* allButtonLabel 을 주면 [전체보기]가 머리말 오른쪽이 아니라 **목록 아래 회색 알약**으로 선다
          (2026-10-19, 사용자 요청 — 상점가 탭 시트). 안 주면 종전대로 머리말 오른쪽이다 */}
      <SectionHeader title={title} action={allButtonLabel ? undefined : "전체보기"}
        onAction={allButtonLabel ? undefined : onOpenAll} />
      <div role="list">
        {districts.map((d, i) => (
          <DistrictRow key={d.id} district={d} divider={i < districts.length - 1}
            onClick={() => onOpen && onOpen(d)} />
        ))}
      </div>
      {allButtonLabel ? (
        <Button variant="subtle" size="sm" block iconEnd="chevron-right" onClick={onOpenAll}
          style={{ marginTop: "var(--space-3)" }}>{allButtonLabel}</Button>
      ) : null}
    </section>
  );
}
