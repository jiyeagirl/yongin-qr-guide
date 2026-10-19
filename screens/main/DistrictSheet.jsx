import React from "react";
import { Button, FestivalBanner } from "../../design-systems/index.js";
import { STORE_AS_OF } from "./config.js";
import { PopularSection, CourseSection, DistrictPreviewSection } from "./HomeSections.jsx";

/* S03 상점가 탭 바텀시트 내용 — **홈형** (2026-10-19, `docs/direction_v2_rules.md` 9장).
 *
 *   [시트 헤더]  둔전골목형상점가   포곡읍 포곡로124번길 2 일원  ← 항상 보임 (스크롤 밖)
 *   ─────────────────────────────────────────────
 *   우리 상점가 축제 배너 (U-FT-03) [X]                       ← 닫을 수 있다. 조아용이 선다
 *   인기 매장                                                  ← 가로 레일 (HomeSections)
 *   골목 한바퀴 코스 추천                                      ← 가로 카드 (HomeSections)
 *   [둔전 골목형 상점가 전체보기 >]                            ← S15 (#/stores). 회색 알약
 *   근처 골목형 상점가   [전체보기]                            ← 가까운 3곳 → 지도로 이동
 *   기준일자·고지
 *
 * ── 왜 가게 목록이 빠졌나 ───────────────────────────────────────────────
 * 이 시트는 지도 아래에 가게 335곳을 바로 깔고 있었다. 그런데 상점 QR 로 들어온 사람이 상세를 닫고
 * 처음 보는 화면이 이 탭이다 — 가게 목록이 첫 화면이면 **상점가와 그 안의 가게를 알리는**
 * 화면이 되지 못한다. 그래서 시트는 축제 · 인기 매장 · 코스 · 다른 상점가로 바꾸고, 335곳
 * 목록(업종 칩 · 온누리 · 정렬 · 쪽 나누기)은 별도 화면 S15(`detail/StoreList.jsx`)로 옮겼다.
 * 열리는 길은 이 시트의 [가게 전체보기]와 지도 위 검색창의 Enter 둘이다.
 *
 * 지도 핀은 그대로 335곳이고, 검색·업종 칩이 거르는 것도 핀이다 (상태는 셸이 든다). 시트는 더 이상
 * 그 결과 목록을 담지 않는다.
 *
 * 인기 매장 · 코스 · 다른 상점가 조각은 둘러보기 탭(S04)과 **같은 조각**이다 (HomeSections).
 */
/* 「둔전골목형상점가」→「둔전 골목형 상점가」 — 시 표기는 붙여 쓰지만 단추·제목은 띄어 쓴다 (2026-10-19) */
export const shortName = district => (district && district.name
  ? district.name.replace(/\s*골목형\s*상점가$/, " 골목형 상점가") : "상점가");

export function DistrictSheet({
  data,
  /* 가까운 몇 곳의 다른 상점가. 이미 거리순이므로 앞에서 자른 것이 가까운 순이다 */
  otherDistricts = [],
  onOpenStore, onOpenCourse, onOpenFestival, onOpenAllStores,
  onOpenDistrict, onOpenAllDistricts,
  /* 축제 배너 닫기 (2026-08-18). 닫힘 상태는 셸이 들고 있다 — 이 시트는 탭을 옮기면
     언마운트되므로 여기에 두면 둘러보기를 갔다 올 때마다 배너가 되살아난다 */
  festivalDismissed = false, onDismissFestival,
}) {
  const district = data.district;

  return (
    <div style={{ paddingBottom: "var(--space-9)" }}>
      {/* ── 우리 상점가 축제 배너 (U-FT-03) — 현재 상점가 1건.
             둘러보기 탭의 상점가 전체 축제 목록과 범위가 다르므로 중복이 아니다.
             닫으면 자리째 사라진다. 다시 보려면 둘러보기 탭에 그대로 있다. ── */}
      {data.festival && !festivalDismissed ? (
        <div style={{ padding: "var(--space-2) var(--gutter-screen) var(--space-3)" }}>
          <FestivalBanner festival={data.festival} onClick={onOpenFestival}
            onDismiss={onDismissFestival}
            mascot pose={data.festival.pose} base="../../design-systems/" />
        </div>
      ) : null}

      <PopularSection items={data.popular} note={district && district.name} onPick={onOpenStore}
        style={{ marginTop: "var(--space-2)" }} />

      <CourseSection courses={data.courses} note={district && district.name} onPick={onOpenCourse}
        style={{ marginTop: "var(--space-5)" }} />

      {/* ── 가게 전체보기 → S15. 목록이 이 시트에서 나간 대신 들어가는 길이다 ── */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <Button variant="subtle" size="sm" block iconEnd="chevron-right" onClick={onOpenAllStores}>
          {shortName(district)} 전체보기
        </Button>
      </div>

      {otherDistricts.length ? (
        <DistrictPreviewSection title="근처 골목형 상점가" districts={otherDistricts}
          allButtonLabel="근처 골목형 상점가 전체보기"
          onOpenAll={onOpenAllDistricts} onOpen={onOpenDistrict}
          style={{ marginTop: "var(--space-5)" }} />
      ) : null}

      {/* ── 고지 ── 119 안내는 이 화면에 안전시설이 없어 끈다 (2026-08-24 결정 그대로) */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          점포 정보 {STORE_AS_OF} 기준. 안내 정보는 참고용입니다.
        </p>
      </div>
    </div>
  );
}

export default DistrictSheet;
