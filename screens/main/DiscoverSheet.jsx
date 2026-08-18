import React from "react";
import {
  SectionHeader, Button, Notice, StoreRail, CourseCard, FestivalRow, DistrictRow,
} from "../../design-systems/index.js";
import { DISTRICT_PAGE_SIZE } from "./config.js";

/* S04 둘러보기 탭 바텀시트 내용 (기능명세서 v1.0 4장 S04 행).
 * 관련 기능: U-DC-01~06 · U-FT-01 · U-ST-14(→U-DC-04)
 *
 * 앞의 두 탭과 달리 **필터가 없는 섹션 스크롤 화면**이다. 그래서 지도 위에 필터 바를 두지 않고,
 * 시트 안에도 sticky 제어 줄이 없다. 여기서 하는 일은 고르는 것이 아니라 훑는 것이다.
 *
 *   축제                    32개소 전체   ← 기간 한정이라 최상단 (U-DC-05)
 *   신규 매장 / 인기 매장    현재 상점가
 *   골목 한바퀴 코스         현재 상점가
 *   다른 상점가              32개소 전체   ← 최하단 (U-DC-04)
 *
 * ── 범위가 섞이는 유일한 탭이다 ────────────────────────────────────────────
 * 축제와 다른 상점가는 32개소 전체, 가운데 두 섹션은 현재 상점가만 다룬다.
 * 그래서 섹션 머리말 오른쪽에 범위를 글자로 적고(`note`), 축제 행에는 상점가명과 거리를
 * 반드시 병기한다 (U-DC-01). 이게 없으면 네 섹션이 모두 둔전 이야기로 읽힌다.
 *
 * U-DC-06 — 현재 상점가가 없으면(임계 거리 초과, U-ST-16) 가운데 두 섹션을 통째로 숨긴다.
 * 빈 카드 자리를 남기지 않는다. 축제와 다른 상점가 목록만으로도 화면이 성립한다.
 */
export function DiscoverSheet({
  festivals = [], newStores = [], popular = [], courses = [], districts = [],
  currentDistrict,               /* 없으면(null) U-DC-06 축소 모드 */
  selectedId,
  onOpenFestival, onOpenStore, onOpenCourse, onOpenDistrict,
}) {
  /* 다른 상점가 31곳을 한 번에 그리지 않는다. 목록이 화면 밖으로 한참 이어지면
     탭 최하단이라는 위치 자체가 무의미해진다 (U-DC-04 는 "탭 최하단 배치"를 요구한다) */
  const [limit, setLimit] = React.useState(DISTRICT_PAGE_SIZE);
  const rest = districts.length - limit;

  const scope = { padding: "0 var(--gutter-screen)" };

  return (
    <div style={{ paddingBottom: "var(--space-9)" }}>

      {/* ── 1. 축제 (U-DC-01 · U-FT-01) — 32개소 전체 ─────────────────────── */}
      <section style={scope}>
        <SectionHeader title="축제" note={`32개소 전체 · ${festivals.length}건`} />
        {festivals.length === 0 ? (
          <Notice tone="info" title="예정된 축제가 없습니다">
            새 축제가 확정되면 이 자리에 표시됩니다.
          </Notice>
        ) : (
          <div role="list">
            {festivals.map((f, i) => (
              /* 축제는 지도 마커가 아니다 — 마커는 상점가 지점이고, 축제는 그 위에 얹힌 정보다.
                 그래서 여기에는 선택 강조가 없다 (아래 다른 상점가 목록에는 있다) */
              <FestivalRow key={f.id} festival={f}
                divider={i < festivals.length - 1} onClick={() => onOpenFestival(f)} />
            ))}
          </div>
        )}
        <p style={{ marginTop: "var(--space-2)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
          용인시 골목형 상점가 32개소의 축제를 가까운 순으로 보여줍니다.
        </p>
      </section>

      {/* ── 2·3. 현재 상점가 대상 섹션 — 없으면 통째로 숨긴다 (U-DC-06) ────── */}
      {currentDistrict ? (
        <>
          {/* 신규 및 인기 매장 (U-DC-02).
              "신규"와 "인기"를 한 줄에 섞지 않는다 — 새로 생긴 가게는 아직 조회수가 낮고
              조회수 상위는 대개 오래된 가게라, 섞으면 어느 근거로 뽑힌 카드인지 알 수 없다 */}
          <section style={{ ...scope, marginTop: "var(--space-6)" }}>
            <SectionHeader title="신규 매장" note={currentDistrict.name} />
            <StoreRail items={newStores} label="신규 매장" onPick={onOpenStore} />
          </section>

          <section style={{ ...scope, marginTop: "var(--space-5)" }}>
            <SectionHeader title="인기 매장" note={currentDistrict.name} />
            <StoreRail items={popular} label="인기 매장" onPick={onOpenStore} />
          </section>

          {/* 골목 한바퀴 추천 코스 (U-DC-03) */}
          {courses.length ? (
            <section style={{ marginTop: "var(--space-5)" }}>
              <div style={scope}>
                <SectionHeader title="골목 한바퀴" note={currentDistrict.name} />
              </div>
              <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-3)",
                overflowX: "auto", padding: "2px var(--gutter-screen) var(--space-2)", scrollbarWidth: "none" }}>
                {courses.map(c => (
                  <CourseCard key={c.id} course={c} onClick={() => onOpenCourse(c)} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        /* 현재 상점가가 없을 때 (U-DC-06). 빈 카드 자리를 남기는 대신 왜 없는지 한 줄로 적는다 */
        <section style={{ ...scope, marginTop: "var(--space-5)" }}>
          <Notice tone="info" title="가까운 상점가가 없습니다">
            신규·인기 매장과 골목 한바퀴 코스는 가까운 상점가가 있을 때 보여드립니다.
            아래에서 가볼 만한 상점가를 골라보세요.
          </Notice>
        </section>
      )}

      {/* ── 4. 다른 상점가 목록 (U-DC-04, 옛 U-ST-14) — 32개소 전체, 최하단 ── */}
      <section style={{ ...scope, marginTop: "var(--space-6)" }}>
        <SectionHeader title="다른 상점가" note={`32개소 전체 · ${districts.length}곳`} />
        <div role="list">
          {districts.slice(0, limit).map((d, i) => (
            <DistrictRow key={d.id} district={d} selected={d.id === selectedId}
              divider={i < Math.min(limit, districts.length) - 1} onClick={() => onOpenDistrict(d)} />
          ))}
        </div>
        {rest > 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4) 0" }}>
            <Button variant="outline" icon="chevron-down" onClick={() => setLimit(n => n + DISTRICT_PAGE_SIZE)}>
              {rest}곳 더 보기
            </Button>
          </div>
        ) : null}
      </section>

      {/* ── 고지 (U-CM-07 · U-CM-08) ───────────────────────────────────── */}
      <div style={{ ...scope, marginTop: "var(--space-5)" }}>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          상점가 지정 현황 2026.07 기준 · 축제 일정은 주최 상점가 사정으로 변경될 수 있습니다<br />
          안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

export default DiscoverSheet;
