import React from "react";
import {
  SectionHeader, TextButton, Notice, StoreRail, CourseCard, FestivalRow, DistrictRow,
} from "../../design-systems/index.js";
import { DISTRICT_PAGE_SIZE, FESTIVAL_PREVIEW } from "./config.js";

/* S04 둘러보기 탭 (기능명세서 v1.0 4장 S04 행).
 * 관련 기능: U-DC-01~06 · U-FT-01 · U-ST-14(→U-DC-04)
 *
 * ── 이 탭에는 지도가 없다 (2026-08-18 변경) ─────────────────────────────────
 * 앞의 두 탭과 달리 **고르는 화면이 아니라 훑는 화면**이다. 필터도, sticky 제어 줄도 없다.
 * 지도도 마찬가지였다 — 32개소를 한 화면에 담으려면 시 전역(약 25km)까지 줌아웃해야 하는데,
 * 그 축척에서는 핀이 어디에 있든 "용인시 어딘가"로만 읽혀 아무 것도 알려주지 못했다.
 * 게다가 이 탭의 주인공인 축제·신규매장·코스는 애초에 지도 위의 점이 아니라 읽을거리다.
 * 그래서 지도를 걷어내고 앱바 아래 전체를 정보 화면으로 쓴다.
 *
 * **지도 인스턴스는 그대로 살아 있고 감춰지기만 한다** (MainApp 참조). 언마운트하면
 * 탭을 되돌아올 때 지도가 다시 뜨는데 U-CM-16 이 그것을 금지한다. 여기서 금지되는 것은
 * "재로딩"이지 "안 보이는 것"이 아니다.
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
export function DiscoverPanel({
  festivals = [], newStores = [], popular = [], courses = [], districts = [],
  currentDistrict,               /* 없으면(null) U-DC-06 축소 모드 */
  onOpenFestival, onOpenStore, onOpenCourse, onOpenDistrict,
}) {
  /* 다른 상점가 31곳을 한 번에 그리지 않는다. 목록이 화면 밖으로 한참 이어지면
     탭 최하단이라는 위치 자체가 무의미해진다 (U-DC-04 는 "탭 최하단 배치"를 요구한다) */
  const [limit, setLimit] = React.useState(DISTRICT_PAGE_SIZE);
  const rest = districts.length - limit;

  /* 축제도 같은 방식으로 접는다 (위 섹션 주석 참조). 다만 [더 보기]를 한 번 누르면
     전부 펼친다 — 6건짜리 목록을 두 번 나눠 펼치게 하면 누르는 일이 목적이 된다. */
  const [festivalLimit, setFestivalLimit] = React.useState(FESTIVAL_PREVIEW);
  const shownFestivals = festivals.slice(0, festivalLimit);
  const restFestivals = festivals.length - shownFestivals.length;

  const scope = { padding: "0 var(--gutter-screen)" };

  return (
    /* 시트가 아니라 화면 전체를 쓰는 스크롤 패널이다. 위에는 앱바·컨텍스트 바가,
       아래에는 탭바가 형제로 있으므로 여기서는 세로 스크롤만 맡는다. */
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
      WebkitOverflowScrolling: "touch", background: "var(--surface-page)" }}>
      <div style={{ padding: "var(--space-5) 0 var(--space-9)" }}>

      {/* ── 1. 축제 (U-DC-01 · U-FT-01) — 32개소 전체, 앞의 몇 건만 펼쳐둔다 ───
             6건이 한 번에 깔리면 이 탭의 나머지 세 섹션이 통째로 첫 화면 밖으로 밀린다.
             둘러보기는 축제 목록 화면이 아니라 **네 가지를 훑는 화면**이라, 첫 화면에서
             네 섹션이 다 보이지 않으면 아래 셋은 없는 것이나 마찬가지다.

             자료를 줄이는 것이 아니라 접는 것이다 — [더 보기]로 그 자리에서 펼친다.
             목록은 상태(진행중 → 예정 → 종료) 다음 거리 순이므로 접히는 것은 늘
             덜 급한 쪽이다. 진행 중인 축제가 접혀 들어가는 일은 없다. */}
      <section style={scope}>
        <SectionHeader title="축제" note={`32개소 전체 · ${festivals.length}건`} />
        {festivals.length === 0 ? (
          <Notice tone="info" title="예정된 축제가 없습니다">
            새 축제가 확정되면 이 자리에 표시됩니다.
          </Notice>
        ) : (
          <>
            <div role="list">
              {shownFestivals.map((f, i) => (
                /* 축제는 지도 마커가 아니다 — 마커는 상점가 지점이고, 축제는 그 위에 얹힌 정보다.
                   그래서 여기에는 선택 강조가 없다 (아래 다른 상점가 목록에는 있다) */
                <FestivalRow key={f.id} festival={f}
                  divider={i < shownFestivals.length - 1} onClick={() => onOpenFestival(f)} />
              ))}
            </div>
            {/* 펼침/접힘 손잡이. 축제는 한 번에 전부 펼치므로 둘 중 하나만 나온다 */}
            {restFestivals > 0 || festivalLimit > FESTIVAL_PREVIEW ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                {restFestivals > 0 ? (
                  <TextButton iconEnd="chevron-down" aria-expanded={false}
                    onClick={() => setFestivalLimit(festivals.length)}>
                    축제 {restFestivals}건 더 보기
                  </TextButton>
                ) : (
                  <TextButton iconEnd="chevron-up" aria-expanded
                    onClick={() => setFestivalLimit(FESTIVAL_PREVIEW)}>
                    축제 접기
                  </TextButton>
                )}
              </div>
            ) : null}
          </>
        )}
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
        {/* 지도가 없어졌으므로 마커 선택 강조(selected)도 없다 — 강조할 지도가 없다 */}
        <div role="list">
          {districts.slice(0, limit).map((d, i) => (
            <DistrictRow key={d.id} district={d}
              divider={i < Math.min(limit, districts.length) - 1} onClick={() => onOpenDistrict(d)} />
          ))}
        </div>
        {/* 이쪽은 축제와 달리 8곳씩 끊어 붙인다 (31곳을 한 번에 펼치면 탭 최하단이라는
            배치가 무의미해진다). 그래서 펼치는 중에는 [더 보기]와 [접기]가 함께 나온다 —
            여덟 곳을 더 봤는데 되돌릴 길이 없으면 처음 상태로 가려고 탭을 나갔다 와야 한다. */}
        {rest > 0 || limit > DISTRICT_PAGE_SIZE ? (
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-4)" }}>
            {rest > 0 ? (
              <TextButton iconEnd="chevron-down" aria-expanded={limit > DISTRICT_PAGE_SIZE}
                onClick={() => setLimit(n => n + DISTRICT_PAGE_SIZE)}>
                {rest}곳 더 보기
              </TextButton>
            ) : null}
            {limit > DISTRICT_PAGE_SIZE ? (
              <TextButton tone="muted" iconEnd="chevron-up" onClick={() => setLimit(DISTRICT_PAGE_SIZE)}>
                접기
              </TextButton>
            ) : null}
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
    </div>
  );
}

export default DiscoverPanel;
