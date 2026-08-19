import React from "react";
import {
  SectionHeader, Notice, FacilityRow, FACILITY_LABELS, SAFETY, CONVENIENCE,
} from "../../design-systems/index.js";

/* S02 공공시설 탭 바텀시트 내용 (기능명세서 v1.0 4장 S02 행).
 * 관련 기능: U-FC-02(주변 시설 목록) · U-FC-04(안전시설 우선) · U-FC-06(거리 표기) · U-FC-09(원거리 안내)
 *
 * 상점가 탭(DistrictSheet)과 골격이 같다. 시트는 결과만 담고, 유형 칩은 지도 위 필터 바가 갖는다.
 *
 *   [시트 헤더]   주변 공공시설 · 기준 문구 · AED n곳 / ⚠대피소 n곳   ← 접힘 상태에서도 보임
 *                 (원거리 안내 U-FC-09 는 저 주의 배지의 말풍선이다 — FacilitySummary)
 *   ────────────────────────────────────────────────
 *   안전시설   AED · 대피소   거리순     (U-FC-04)
 *   편의시설   화장실 · 쉼터  거리순
 *   ────────────────────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * 상점가 탭에 있는 것 중 여기 없는 것과 그 이유
 *   정렬 토글      시설은 거리순 하나뿐이다. 인기순 시설이라는 개념이 없다
 *   검색창        이름을 알고 찾는 대상이 아니라 유형으로 고르는 대상이다
 *   무한 스크롤    수십 건이라 한 번에 다 그린다. 페이지를 나눌 이유가 없다
 *   결과 수 sticky 줄
 *                섹션 머리(안전시설/편의시설)가 그 역할을 겸한다. 여기에 sticky 줄까지 더하면
 *                20건도 안 되는 목록 위에 제어 줄이 두 겹이 된다
 */

/* U-FC-04 — 안전시설을 먼저, 그 다음 편의시설. 각 묶음 안에서는 거리순.
   섹션으로 나누는 것은 색약 대응 보조 수단이기도 하다 (핀 색상 외 구분, 6장 남은 확인사항 #1).

   쉼터(무더위·한파쉼터)는 안전시설이다. 그래서 편의시설로 남는 것은 화장실 하나뿐이다.
   지도 핀은 여전히 AED·대피소만 적색이다 — 이유는 FacilityIcon 의 SAFETY/EMERGENCY 주석 참조.

   섹션 안에서는 유형이 아니라 **거리순**이다. U-FC-04 의 "AED와 대피소를 목록 상단에"는
   섹션 배치로 이미 지켜진다 (안전시설 섹션이 통째로 위에 있다). 섹션 안에서까지 유형 순으로
   묶으면 90m 쉼터가 2km 대피소 아래로 내려가, 거리순이라는 목록의 약속이 깨진다. */
const GROUPS = [
  { id: "safety",  title: "안전시설", types: SAFETY },
  { id: "comfort", title: "편의시설", types: CONVENIENCE },
];

/* 기준일 문구 (입력 항목 정의서 3-2). **시설 4종이 각각 다른 값을 갖는다** — 표준데이터
   갱신 주기가 유형마다 달라서다. 한 유형만 보고 있으면 그 값 하나를, [전체]에서는 화면에
   깔린 유형을 전부 적는다. 대표값 하나로 뭉치면 나머지 세 종에는 틀린 날짜가 붙는다. */
function asOfLine(asOf, cat, labels) {
  if (cat !== "all") return `공공시설 정보 ${asOf[cat] || ""} 기준`;
  const parts = Object.keys(asOf).map(t => `${labels[t] || t} ${asOf[t]}`);
  return `공공시설 정보 ${parts.join(" · ")} 기준`;
}

export function FacilitySheet({ rows, cat, selectedId, onPick, asOf }) {
  /* 단일 유형을 고른 상태에서는 섹션을 나누지 않는다 — 한 묶음뿐인데 머리말을 달면
     "다른 묶음이 아래 더 있나" 하고 스크롤하게 된다 */
  const grouped = cat === "all";

  const sections = grouped
    ? GROUPS.map(g => ({ ...g, items: rows.filter(r => g.types.includes(r.type)) })).filter(g => g.items.length)
    : [{ id: cat, title: null, items: rows }];

  return (
    <div style={{ paddingBottom: "var(--space-9)" }}>

      {/* ── 시설 목록 ────────────────────────────────────────────────────
             U-FC-09 원거리 안내는 여기 있었으나 시트 헤더(FacilitySummary)로 옮겼다.
             배너 한 장이 목록 두 줄만큼을 먹으면서 말하는 것은 "대피소가 멀다" 한 가지뿐이었다.
             이제는 헤더의 유형 아이콘에 주의 배지가 붙고 말풍선이 문장을 갖는다 —
             경고와 그 대상이 같은 자리에 있어, 무엇이 먼지 문장을 읽기 전에 알 수 있다.
             "빈 결과 화면을 만들지 않는다"는 규칙 자체는 그대로다 (상한을 넘겨 최근접을 제시). */}
      <div style={{ padding: "var(--space-1) var(--gutter-screen) 0" }}>
        {rows.length === 0 ? (
          /* 유형 칩은 0건이면 아예 숨기므로(FilterBar) 여기까지 오는 경우는 거의 없다.
             그래도 빈 화면 대신 문장을 둔다 — U-FC-09 와 같은 취지다 */
          <Notice tone="info" title="표시할 시설이 없습니다">
            다른 유형을 선택하거나 전체 보기로 돌아가 보세요.
          </Notice>
        ) : sections.map((sec, si) => (
          <section key={sec.id} style={{ marginTop: si === 0 ? 0 : "var(--space-5)" }}>
            {sec.title ? (
              <SectionHeader title={sec.title} style={{ marginBottom: "var(--space-1)" }} />
            ) : null}
            <div role="list">
              {sec.items.map((f, i) => (
                <FacilityRow key={f.id} facility={f} selected={f.id === selectedId}
                  divider={i < sec.items.length - 1} onClick={() => onPick(f)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── 고지 (U-CM-07 · U-CM-08) ───────────────────────────────────── */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {asOfLine(asOf, cat, FACILITY_LABELS)}<br />
          안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

export default FacilitySheet;
