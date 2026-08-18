import React from "react";
import {
  DetailPage, DetailNotice, ListControls, Chip, DistrictRow, EmptyState, Notice,
} from "../../design-systems/index.js";

/* S13 용인시 골목형 상점가 전체보기 (2026-08-18 신설).
 * 관련 기능: U-DC-04(옛 U-ST-14) · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 용인시 골목형 상점가 정보
 *   ─────────────────────────────────
 *   n곳                    [가까운 순 ⇅]
 *   [전체 32][처인구 7][기흥구 11][수지구 14]
 *   ─────────────────────────────────
 *   상점가명                    [축제]
 *   구 행정동 · 거리 · 점포 n곳 [온누리] n곳   상세 페이지 ›
 *   …
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * ── 왜 이 화면이 생겼나 ─────────────────────────────────────────────────
 * 둘러보기 탭(S04) 최하단의 같은 목록은 8곳씩 끊어 붙인다. 그 탭은 축제·코스·매장까지
 * 네 가지를 훑는 자리라, 32곳을 한 번에 깔면 탭 최하단이라는 배치가 무의미해지기 때문이다.
 * 그런데 그 접기가 **목록을 훑는 것 자체를 어렵게** 만들었다 — 수지구의 어느 상점가를
 * 찾으려면 [더 보기]를 세 번 누르고 거리순으로 늘어선 32줄을 눈으로 훑어야 했다.
 *
 * 그래서 축제와 같은 구조를 쓴다: 탭에는 앞의 몇 건만 두고 [전체보기]가 이 화면을 연다.
 * 여기는 화면 전체가 목록이라 접을 이유가 없고, 대신 좁히는 축을 준다.
 *
 * ── 칩이 구(區)인 이유 ──────────────────────────────────────────────────
 * 32곳을 가르는 축으로 쓸 만한 것이 셋 있었다 — 구 · 축제 유무 · 온누리 가맹 여부.
 *
 *   구          용인시는 처인·기흥·수지 셋으로 나뉘고 세 곳의 생활권이 실제로 갈린다.
 *               게다가 각 줄이 이미 구 이름을 달고 있어, 칩이 목록의 말과 같은 말을 쓴다.
 *   축제 유무    후보가 6곳뿐이라 나머지 26곳을 "축제 없음"으로 뭉뚱그리게 된다.
 *               게다가 축제는 이 화면이 아니라 S12 가 맡는 축이다.
 *   온누리       가맹 수를 모르는 곳이 4곳 있어(시 안내에 그 수가 없다) 셋째 상태가 생긴다.
 *               "모름"을 어느 칩에 넣어도 거짓말이 된다.
 *
 * 구는 셋이라 칩이 한 줄에 들어가고, 어느 것도 결과를 0 곳으로 만들지 않는다.
 * 차례는 가나다순이 아니라 시가 쓰는 행정 구 번호순이다 (`GU_ORDER`).
 *
 * ── 현재 상점가도 목록에 넣는다 ──────────────────────────────────────────
 * 둘러보기 탭의 같은 목록에서는 뺀다 — 지금 서 있는 곳이라 "다른 상점가"가 아니다.
 * 그런데 이 화면의 제목은 "용인시 골목형 상점가 정보"이고 머리말이 총 32곳이라고 적는다.
 * 여기서 한 곳을 빼면 세어보는 사람에게 수가 맞지 않고, 구 칩의 개수도 함께 어긋난다.
 * 대신 그 줄의 거리 자리에 "지금 계신 곳"이라고 적는다 (DistrictRow).
 *
 * ── 줄을 누르면 앱 밖으로 나간다 ────────────────────────────────────────
 * 우리에게는 다른 상점가의 점포도 지도도 없다. 있는 것은 이름·규모·거리뿐이라 앱 안에서
 * 열어봐야 이 줄에 이미 적힌 것을 한 번 더 보게 된다. 소개·연혁·연락처는 시가 이미
 * 관리하므로 그리로 보낸다 (`DistrictRow` 의 external 주석).
 */
export function DistrictList({ districts = [], guOrder = [], asOf, sortNear, sortName,
  onBack, base = "../../design-systems/" }) {
  const [gu, setGu] = React.useState("전체");
  const [sort, setSort] = React.useState("near");

  /* 칩에 개수를 함께 적는다. 누르기 전에 몇 곳인지 알아야 누를지를 정한다
     (S03 업종 칩 · S12 상태 칩과 같은 규칙) */
  const counts = React.useMemo(() => {
    const o = { 전체: districts.length };
    guOrder.forEach(g => { o[g] = 0; });
    districts.forEach(d => { o[d.gu] = (o[d.gu] || 0) + 1; });
    return o;
  }, [districts, guOrder]);

  const rows = React.useMemo(() => {
    const out = districts.filter(d => gu === "전체" || d.gu === gu);
    return [...out].sort(sort === "name" ? sortName : sortNear);
  }, [districts, gu, sort, sortNear, sortName]);

  const gutter = { padding: "0 var(--gutter-screen)" };

  return (
    <DetailPage title="용인시 골목형 상점가 정보" onBack={onBack}>
      {/* sticky 를 켠다. S12 축제(6건)와 달리 여기는 32줄이라 스크롤이 길고, 구를 바꾸려고
          맨 위까지 되돌아가야 하면 칩이 있으나 마나가 된다 (S03 상점가 탭과 같은 판단) */}
      <ListControls
        title={`${rows.length}곳`}
        sort={sort}
        sortOptions={[{ id: "near", label: "가까운 순" }, { id: "name", label: "가나다순" }]}
        onSortChange={setSort}>

        <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto",
          scrollbarWidth: "none", paddingBottom: "var(--space-2)" }}>
          {["전체"].concat(guOrder).map(g => (
            <Chip key={g} selected={gu === g} count={counts[g] || 0}
              onClick={() => setGu(g)}>{g}</Chip>
          ))}
        </div>
      </ListControls>

      <div style={{ ...gutter, paddingTop: "var(--space-2)", paddingBottom: "var(--space-6)" }}>
        {/* 줄 전체가 바깥 링크라는 것을 목록에 들어가기 전에 한 번 말한다. 줄마다 붙은
            "상세 페이지 ›"만으로는 첫 줄을 누르고 나서야 알게 되는데, 그때는 이미
            브라우저가 바뀌어 있다 (U-CM-08 의 결과 아니라 성질에 대한 고지다) */}
        <Notice tone="info" style={{ marginTop: "var(--space-4)" }}>
          각 상점가의 자세한 안내는 용인시 누리집에서 새 창으로 열립니다.
        </Notice>

        {rows.length ? (
          <div role="list" style={{ marginTop: "var(--space-2)" }}>
            {rows.map((d, i) => (
              /* [축제] 배지는 켜둔다. 둘러보기 탭에서는 껐는데 거기는 맨 위 섹션이 통째로
                 축제여서 같은 사실을 세 번째로 말하는 꼴이었다. 여기에는 축제 정보가
                 따로 없으므로 배지가 그 상점가에 갈 이유를 말한다 (DistrictRow 주석) */
              <DistrictRow key={d.id} district={d} external divider={i < rows.length - 1} />
            ))}
          </div>
        ) : (
          <EmptyState pose="curious" base={base}
            title="해당하는 상점가가 없습니다"
            description="다른 구를 선택해 보세요."
            style={{ padding: "var(--space-8) 0" }} />
        )}

        <DetailNotice asOf={`상점가 지정 현황 ${asOf}`} style={{ marginTop: "var(--space-6)" }}>
          <span style={{ display: "block" }}>
            점포 수와 온누리 가맹 수는 시 안내 기준이며 실제와 다를 수 있습니다.
          </span>
        </DetailNotice>
      </div>
    </DetailPage>
  );
}

export default DistrictList;
