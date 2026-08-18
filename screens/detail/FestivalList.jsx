import React from "react";
import {
  DetailPage, DetailNotice, ListControls, Chip, Select, FestivalCard, EmptyState,
} from "../../design-systems/index.js";

/* S12 축제 전체보기 (2026-08-18 신설 · 08-18 카드형으로 개편).
 * 관련 기능: U-FT-01(축제 목록 · 진행중/예정/종료 구분) · U-DC-01 · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 상점가 축제 정보
 *   ─────────────────────────────────
 *   n건                    [임박순|가까운 순]
 *   [전체][진행중][예정][종료]
 *   [상점가 ▾]
 *   ─────────────────────────────────
 *   ┌─ 홍보 카드 ─────────────────┐   ← 한 열, 한 건이 한 뼘
 *   │ [진행중] 날짜        조아용   │
 *   │ 축제명                      │
 *   │ 홍보 문구                    │
 *   │ 상점가명 · 거리               │
 *   └────────────────────────────┘
 *   …
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * ── 왜 이 화면이 생겼나 ─────────────────────────────────────────────────
 * 둘러보기 탭(S04)의 축제 섹션은 **진행중과 예정만** 보여준다. 그 탭은 "지금 갈 수 있는
 * 곳"을 훑는 자리라 끝난 행사가 자리를 차지할 이유가 없다. 그런데 U-FT-01 은 세 상태를
 * 모두 다루라고 요구하고, 실제로 "그 축제 언제였지"를 확인하러 오는 사람도 있다.
 * 그래서 종료를 포함한 전체는 이 화면이 맡는다.
 *
 * ── 행이 아니라 카드다 (2026-08-18 개편) ────────────────────────────────
 * 처음에는 둘러보기 탭과 같은 `FestivalRow` 를 썼다. 같은 축제가 화면마다 다르게 생기면
 * 다른 목록으로 읽힌다는 이유였는데, **여기가 하는 일이 그 탭과 달랐다.**
 *
 *   둘러보기 탭  네 섹션 중 하나. 축제는 "지금 뭘 하나"의 한 답이고, 한 건이 한 뼘을
 *                차지하면 아래 세 섹션이 첫 화면에서 사라진다 → 행이 맞다.
 *   이 화면      화면 전체가 축제다. 여섯 줄이 똑같이 생기면 훑고 나가지 한 건도
 *                읽지 않는다. 상점가 축제를 알리는 자리인데 알려지지 않는다 → 카드.
 *
 * 그래서 카드마다 바탕색·아이콘·조아용 포즈를 다르게 주고, 축제의 성질을 한 문장으로
 * 적는다 (`hook`). 그 값은 화면이 아니라 데이터가 정한다 (`districts.js` 의 LOOK) —
 * 화면이 인덱스로 색을 돌리면 축제 하나가 늘 때 나머지 색이 전부 밀린다.
 *
 * 카드 색은 **구별일 뿐 상태가 아니다.** 진행중·예정·종료는 카드 안 배지가 글자로 말한다.
 *
 * ── 필터 셋을 고른 이유 ─────────────────────────────────────────────────
 *   상태  칩 — 이 목록에 오는 이유의 대부분이 "끝난 것도 보고 싶다"라서 1순위 축이다.
 *              칩은 한 번에 보이고 한 번에 눌린다.
 *   상점가 Select — 후보가 축제가 있는 곳뿐이라 여섯이다. 칩으로 늘어놓으면 상태 칩과
 *              같은 무게로 읽혀 어느 쪽이 주된 축인지 흐려진다.
 *   정렬  ListControls 의 SortSelect — S03 상점가 탭과 같은 자리, 같은 어법이다.
 *
 * **지역 후보에 상점가를 다 넣지 않는다.** 고를 수 있는 값이 결과를 0 건으로 만드는
 * 선택지로 가득하면 필터가 아니라 함정이 된다.
 */
export function FestivalList({ festivals = [], asOf, sortSoon, sortNear, onOpen, onBack,
  base = "../../design-systems/" }) {
  const [state, setState] = React.useState("전체");
  const [district, setDistrict] = React.useState("전체");
  const [sort, setSort] = React.useState("soon");

  /* 상태 칩에 개수를 함께 적는다. "종료"를 눌러보기 전에 몇 건인지 알 수 있어야
     누를지 말지를 정한다 (S03 업종 칩과 같은 규칙). */
  const counts = React.useMemo(() => {
    const o = { 전체: festivals.length, 진행중: 0, 예정: 0, 종료: 0 };
    festivals.forEach(f => { o[f.state] = (o[f.state] || 0) + 1; });
    return o;
  }, [festivals]);

  const districtOptions = React.useMemo(() => {
    const names = [];
    festivals.forEach(f => { if (!names.includes(f.districtName)) names.push(f.districtName); });
    return [{ value: "전체", label: "상점가 전체" }].concat(names.map(n => ({ value: n, label: n })));
  }, [festivals]);

  const rows = React.useMemo(() => {
    const out = festivals.filter(f =>
      (state === "전체" || f.state === state)
      && (district === "전체" || f.districtName === district));
    return out.sort(sort === "near" ? sortNear : sortSoon);
  }, [festivals, state, district, sort, sortNear, sortSoon]);

  const gutter = { padding: "0 var(--gutter-screen)" };

  return (
    <DetailPage title="상점가 축제 정보" onBack={onBack}>
      {/* sticky 를 끈다. S03 상점가 탭에서는 335곳을 스크롤하는 내내 정렬이 손에 닿아야 해서
          붙여두지만, 여기는 축제 6건이라 스크롤이 길지 않다. 필터 세 줄이 화면 위에 눌러앉으면
          정작 카드가 설 자리가 사라진다. */}
      <ListControls
        sticky={false}
        title={`${rows.length}건`}
        sort={sort}
        sortOptions={[{ id: "soon", label: "임박순" }, { id: "near", label: "가까운 순" }]}
        onSortChange={setSort}>

        <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto",
          scrollbarWidth: "none", paddingBottom: 2 }}>
          {["전체", "진행중", "예정", "종료"].map(s => (
            <Chip key={s} selected={state === s} count={counts[s] || 0}
              onClick={() => setState(s)}>{s}</Chip>
          ))}
        </div>

        {/* 라벨을 숨기지 않는다 — "상점가 전체"라는 기본값만 보이면 그것이 고를 수 있는
            것인지 그냥 적힌 글자인지 알 수 없다 */}
        <Select label="상점가" options={districtOptions} value={district}
          onChange={e => setDistrict(e.target.value)}
          style={{ paddingBottom: "var(--space-2)" }} />
      </ListControls>

      <div style={{ ...gutter, paddingTop: "var(--space-4)", paddingBottom: "var(--space-6)" }}>
        {rows.length ? (
          /* 한 열이다. 두 열로 깔면 카드 폭이 절반이 되어 홍보 문구가 들어갈 자리가 없고,
             축제명조차 세 줄로 접힌다 — 카드로 바꾼 이유가 사라진다. */
          <div role="list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {rows.map(f => (
              <FestivalCard key={f.id} festival={f} base={base}
                tone={f.tone} icon={f.icon} pose={f.pose} hook={f.hook}
                onClick={() => onOpen(f)} />
            ))}
          </div>
        ) : (
          /* 조건을 좁히다 0 건이 되는 것은 고장이 아니라 정상 상태다. 무엇을 풀면 되는지
             함께 적는다 — 빈 화면만 두면 사용자는 자료가 없다고 읽는다 */
          <EmptyState pose="curious" base={base}
            title="해당하는 축제가 없습니다"
            description="상태나 상점가 조건을 넓혀보세요."
            style={{ padding: "var(--space-8) 0" }} />
        )}

        <DetailNotice asOf={`축제 정보 ${asOf}`} style={{ marginTop: "var(--space-6)" }}>
          <span style={{ display: "block" }}>
            일정과 프로그램은 주최 상점가 사정으로 변경될 수 있습니다.
          </span>
        </DetailNotice>
      </div>
    </DetailPage>
  );
}

export default FestivalList;
