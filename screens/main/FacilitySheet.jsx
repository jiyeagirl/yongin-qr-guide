import React from "react";
import {
  SectionHeader, Notice, Pagination, FacilityRow, FACILITY_LABELS, SAFETY, CONVENIENCE,
} from "../../design-systems/index.js";
import { FACILITY_PAGE_SIZE } from "./config.js";

/* S02 공공시설 탭 바텀시트 내용 (기능명세서 v1.1 4장 S02 행).
 * 관련 기능: U-FC-02(주변 시설 목록) · U-FC-04(안전시설 우선) · U-FC-06(거리 표기) · U-FC-09(원거리 안내)
 *
 * 상점가 탭(DistrictSheet)과 골격이 같다. 시트는 결과만 담고, 유형 칩은 지도 위 필터 바가 갖는다.
 *
 *   [시트 헤더]   주변 공공시설 · 기준 문구 · AED n곳 / ⚠대피소 n곳   ← 접힘 상태에서도 보임
 *                 (원거리 안내 U-FC-09 는 저 주의 배지의 말풍선이다 — FacilitySummary)
 *   ────────────────────────────────────────────────
 *   안전시설   AED · 대피소   거리순     (U-FC-04)
 *   편의시설   화장실 · 쉼터  거리순
 *   16곳 중 1–8      1  2                                  ← 쪽 나누기 (아래)
 *   ────────────────────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * 상점가 탭에 있는 것 중 여기 없는 것과 그 이유
 *   정렬 토글      시설은 거리순 하나뿐이다. 인기순 시설이라는 개념이 없다
 *   검색창        이름을 알고 찾는 대상이 아니라 유형으로 고르는 대상이다
 *   결과 수 sticky 줄
 *                섹션 머리(안전시설/편의시설)가 그 역할을 겸한다. 여기에 sticky 줄까지 더하면
 *                20건도 안 되는 목록 위에 제어 줄이 두 겹이 된다
 *
 * ── 쪽 나누기를 들였다 (2026-08-20) ──────────────────────────────────────────
 * 여기에는 "수십 건이라 한 번에 다 그린다. 페이지를 나눌 이유가 없다"고 적혀 있었다.
 * 그 판단의 근거는 **둔전이라는 한 지점**이었다. QR 지점은 시 전역에 서고, 시설이 몰린
 * 곳에서는 목록이 그만큼 길어진다 — 그때 이 화면에는 끝까지 끌고 가는 것 말고 길이 없다.
 * 세 줄짜리 행이 서른 개면 절반 스냅에서 열 번 넘게 밀어야 목록 끝의 기준일자에 닿는다.
 *
 * 장치는 점포 목록(U-ST-04)에서 쓰던 것 그대로다. 새로 만들지 않는 이유는 두 목록이
 * **같은 시트 안에서 탭으로만 갈리기** 때문이다 — 한쪽은 쪽 단추, 한쪽은 [더 보기]면
 * 같은 자리의 같은 컨트롤이 탭에 따라 다른 물건이 된다.
 *
 * 쪽은 **읽는 단위이지 범위가 아니다** — 지도 마커는 쪽을 따르지 않고 필터에 걸린 전부가
 * 그대로 찍힌다 (DistrictSheet 와 같은 규칙). 2쪽으로 넘겼다고 핀이 사라지면 지도가
 * 목록의 부속이 되고, AED 가 어디 있는지 보려고 연 화면에서 AED 가 없어진다.
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
   갱신 주기가 유형마다 달라서다. 그래서 **화면에 깔린 유형만** 적는다: 한 종만 보고 있으면
   그 값 하나를, 여럿이면 그 여럿을. 대표값 하나로 뭉치면 나머지 종에는 틀린 날짜가 붙고,
   보이지도 않는 유형의 날짜까지 적으면 그 줄이 화면과 어긋난다. */
function asOfLine(asOf, types, labels) {
  if (types.length === 1) return `공공시설 정보 ${asOf[types[0]] || ""} 기준`;
  const parts = types.map(t => `${labels[t] || t} ${asOf[t]}`);
  return `공공시설 정보 ${parts.join(" · ")} 기준`;
}

export function FacilitySheet({
  rows,
  /* 고른 유형들. **빈 배열이 전체**다 (2026-08-20. [전체] 칩을 없앤 뒤로 그것이 전체를
     뜻하는 유일한 상태다 — FilterBar 머리말). 이 값은 목록을 거르는 데 쓰이지 않는다:
     걸러진 결과는 셸이 rows 로 내려준다. 여기서는 **무엇을 보고 있는지**를 적는 데만 쓴다
     (기준일 줄) — 거르는 자리가 둘이면 칩과 목록이 갈릴 길이 열린다. */
  types = [],
  selectedId, onPick, asOf,
  /* 쪽 번호는 셸이 들고 있다 — 점포 목록과 같은 이유다. 쪽을 넘기면 목록을 맨 위로
     되돌려야 하는데 그 스크롤 컨테이너는 이 시트가 아니라 Sheet 이고, Sheet 는
     scrollKey 로만 되돌린다. 유형 칩이 바뀔 때 1쪽으로 되돌리는 것도 셸이 한다
     (유형 칩도 셸의 상태다 — 지도 마커가 같은 값을 본다). */
  page = 1, setPage, pageSize = FACILITY_PAGE_SIZE,
}) {
  /* ── 쪽은 섹션 위가 아니라 아래에서 자른다 ─────────────────────────────────
     묶음마다 따로 쪽을 매기지 않는다. 쪽 단추가 둘이면 어느 쪽 것을 넘기는지 매번
     확인해야 하고, 안전시설 2쪽·편의시설 1쪽 같은 상태가 화면에 남는다.

     자르는 대상은 **화면에 놓이는 그 순서 그대로 편 한 줄**(안전시설 다음 편의시설,
     각 묶음 안에서는 거리순)이다. 그래서 쪽을 넘겨도 U-FC-04 의 "안전시설이 먼저"가
     깨지지 않고, 잘린 자리에 걸친 묶음은 다음 쪽에서 머리말을 다시 달고 이어진다 —
     머리말 없이 이어붙이면 2쪽 첫 줄이 무슨 묶음인지 알 수 없다.

     묶음 순서는 **고른 것과 무관하게 늘 같다**. 유형을 여럿 고를 수 있게 되면서 (2026-08-20)
     "안전시설이 먼저"가 걸리는 조합이 늘었다 — 화장실+AED 를 고르면 AED 가 위다. */
  const ordered = GROUPS.flatMap(g => rows.filter(r => g.types.includes(r.type)));

  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  const shown = ordered.slice(start, start + pageSize);

  /* 머리말(안전시설/편의시설)은 **두 묶음이 다 있을 때만** 단다 (2026-08-20).
     한 묶음뿐인데 머리말이 붙으면 "다른 묶음이 아래 더 있나" 하고 스크롤하게 된다 —
     예전에는 "[전체]인가 아닌가"로 갈랐는데, 여럿 고르기에서는 그 물음이 답을 주지 못한다
     (AED+대피소를 고르면 둘 다 안전시설이라 머리말이 한 줄짜리 장식이 된다).
     **지금 화면에 무엇이 깔렸는지**로 정하면 어느 조합에서도 맞는다. */
  const sections = GROUPS
    .map(g => ({ ...g, items: shown.filter(r => g.types.includes(r.type)) }))
    .filter(g => g.items.length);
  const showHeads = sections.length > 1;

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
            선택한 유형 칩을 해제하면 주변 공공시설이 모두 나옵니다.
          </Notice>
        ) : sections.map((sec, si) => (
          <section key={sec.id} style={{ marginTop: si === 0 ? 0 : "var(--space-5)" }}>
            {showHeads ? (
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

        {/* 지금 쪽이 목록의 어디인지 한 줄로 적는다. 시트 헤더의 유형별 개수(FacilitySummary)는
            조건에 걸린 전부이고, 이 줄은 그중 화면에 있는 구간이다 — 쪽 단추만 있으면
            "8곳씩인가 10곳씩인가"를 세어봐야 안다. 점포 목록과 같은 문장, 같은 자리다.
            0건일 때는 통째로 감춘다 (Pagination 머리말) — 없는 쪽을 가리키는 [1] 이 된다. */}
        {ordered.length > 0 ? (
          <div style={{ padding: "var(--space-4) 0 var(--space-2)" }}>
            <p style={{ textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {ordered.length}곳 중 {start + 1}–{start + shown.length}
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage}
              label="공공시설 목록 쪽 넘기기" style={{ marginTop: "var(--space-2)" }} />
          </div>
        ) : null}
      </div>

      {/* ── 고지 (U-CM-07 · U-CM-08) ───────────────────────────────────── */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {/* 고른 것이 없으면(=전체) 화면에 깔린 유형은 4종 전부다 */}
          {asOfLine(asOf, types.length ? types : Object.keys(asOf), FACILITY_LABELS)}<br />
          안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

export default FacilitySheet;
