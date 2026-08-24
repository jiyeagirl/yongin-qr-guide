import React from "react";
import {
  DetailPage, DetailNotice, ListControls, Chip, DistrictRow, EmptyState, Notice, Pagination,
} from "../../design-systems/index.js";

/* S13 용인시 골목형 상점가 전체보기 (2026-08-18 신설).
 * 관련 기능: U-DC-04(옛 U-ST-14) · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 용인시 골목형 상점가 정보
 *   ─────────────────────────────────
 *   [전체 32][처인구 7][기흥구 11][수지구 14]
 *   ─────────────────────────────────
 *   상점가명
 *   구 행정동 · 거리 · 점포 n곳 [온누리] n곳   상세 페이지 ›
 *   …
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * ── 왜 이 화면이 생겼나 ─────────────────────────────────────────────────
 * 둘러보기 탭(S04) 최하단의 같은 목록은 한때 8곳씩 [더 보기]로 붙여 나갔다. 32곳을 한 번에
 * 깔면 탭 최하단이라는 배치가 무의미해지기 때문인데, 그 접기가 **목록을 훑는 것 자체를**
 * 어렵게 만들었다 — 수지구의 어느 상점가를 찾으려면 [더 보기]를 세 번 누르고 거리순으로
 * 늘어선 32줄을 눈으로 훑어야 했고, 누를 때마다 목록이 길어져 화면이 지저분해졌다.
 *
 * 그래서 축제와 같은 구조로 갈랐다 (2026-08-18): **탭에는 가까운 5곳만, [더 보기] 없이.**
 * 나머지는 [전체보기]가 여는 이 화면이 맡는다. 여기는 화면 전체가 목록이라 접을 이유가 없고,
 * 대신 좁히는 축을 준다.
 *
 * ── 제어는 구 칩 하나뿐이다 ─────────────────────────────────────────────
 * 결과 수("32곳")와 정렬(가까운 순|가나다순)도 뒀다가 걷어냈다. 결과 수는 칩이 이미 달고
 * 있어 같은 수를 두 번 적었고, 정렬은 이 목록에서 고를 값이 하나뿐이다 — 여기 오는 사람은
 * **가까운 곳을 찾으러** 온다. 가나다순은 이름을 이미 아는 사람을 위한 축인데, 이름을 안다면
 * 시 누리집에서 바로 찾는 편이 빠르다. 차례는 `sortNear`(가까운 순)로 고정한다.
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
 * 그런데 이 화면의 제목은 "용인시 골목형 상점가 정보"이고 [전체] 칩이 32라고 적는다.
 * 여기서 한 곳을 빼면 세어보는 사람에게 수가 맞지 않고, 구 칩의 개수도 함께 어긋난다.
 * 대신 그 줄의 거리 자리에 "지금 계신 곳"이라고 적는다 (DistrictRow).
 *
 * ── 줄을 누르면 앱 밖으로 나간다 ────────────────────────────────────────
 * 우리에게는 다른 상점가의 점포도 지도도 없다. 있는 것은 이름·규모·거리뿐이라 앱 안에서
 * 열어봐야 이 줄에 이미 적힌 것을 한 번 더 보게 된다. 소개·연혁·연락처는 시가 이미
 * 관리하므로 그리로 보낸다 (`DistrictRow` 의 external 주석).
 */
/* `onOpenDistrict` 는 **안내 주소가 없는 줄**만 쓴다 (2026-08-24). 주소가 있는 줄은
   DistrictRow 가 앵커로 만들어 앱 밖으로 나가고, 그때는 이 핸들러가 달리지 않는다
   (DistrictRow 의 external 주석). 없는 줄이 갈 곳 없는 줄이 되지 않게 하는 것이 전부다. */
export function DistrictList({ districts = [], guOrder = [], sortNear, pageSize = 10,
  onBack, onOpenDistrict, base = "../../design-systems/" }) {
  const [gu, setGu] = React.useState("전체");
  const [page, setPage] = React.useState(1);

  /* 구를 바꾸면 1쪽으로. 7곳뿐인 처인구에서 3쪽을 보고 있으면 빈 화면이 열린다 */
  React.useEffect(() => { setPage(1); }, [gu]);

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
    return [...out].sort(sortNear);
  }, [districts, gu, sortNear]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const shown = rows.slice(start, start + pageSize);

  const gutter = { padding: "0 var(--gutter-screen)" };

  return (
    /* 구를 바꾸거나 쪽을 넘기면 본문을 맨 위로 되돌린다. 쪽 단추는 목록 **끝**에 있어서
       [다음]을 누르면 새 쪽의 끝줄 근처가 열리고, 칩을 바꾸면 다른 목록의 한가운데가 열린다.
       두 경우 다 "위에 무엇이 있는지 모른 채 올려봐야 하는" 상태다 (S03 시트와 같은 장치). */
    <DetailPage title="용인시 골목형 상점가 정보" onBack={onBack} scrollKey={`${gu}|${safePage}`}>
      {/* sticky 를 켠다. S12 축제(6건)와 달리 여기는 32줄이라 스크롤이 길고, 구를 바꾸려고
          맨 위까지 되돌아가야 하면 칩이 있으나 마나가 된다 (S03 상점가 탭과 같은 판단).
          결과 수와 정렬은 넘기지 않으므로 칩 줄만 그려진다 (ListControls 주석). */}
      <ListControls>
        <div role="tablist" aria-label="구 선택"
          style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto",
            scrollbarWidth: "none", padding: "var(--space-1) 0 var(--space-2)" }}>
          {["전체"].concat(guOrder).map(g => (
            <Chip key={g} selected={gu === g} count={counts[g] || 0}
              role="tab" aria-selected={gu === g}
              onClick={() => setGu(g)}>{g}</Chip>
          ))}
        </div>
      </ListControls>

      <div style={{ ...gutter, paddingTop: "var(--space-2)", paddingBottom: "var(--space-6)" }}>
        {/* 줄 전체가 바깥 링크라는 것을 목록에 들어가기 전에 한 번 말한다. 줄마다 붙은
            "상세 페이지 ›"만으로는 첫 줄을 누르고 나서야 알게 되는데, 그때는 이미
            브라우저가 바뀌어 있다 (U-CM-08 의 결과 아니라 성질에 대한 고지다).

            tone 은 neutral 이다 — info 의 teal 바탕이 각 줄의 온누리 배지와 같은 색이라,
            안내 띠가 온누리와 관련된 것처럼 읽혔다. 이 문장은 알림도 경고도 아니고
            사실 한 줄이라 의미색을 쓸 이유가 없다. size 도 sm 으로 내려 한 줄에 넣는다. */}
        <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-3)" }}>
          용인시 누리집에서 새 창으로 열립니다
        </Notice>

        {rows.length ? (
          <div role="list" style={{ marginTop: "var(--space-2)" }}>
            {shown.map((d, i) => (
              /* [축제] 배지를 끈다 (2026-08-18). 한때 켜뒀다 — "이 화면에는 축제 정보가
                 따로 없으니 배지가 갈 이유를 말한다"는 이유였는데, 이 화면에 오는 사람은
                 축제를 찾으러 온 것이 아니다. 축제는 바로 위 섹션의 [전체보기] → S12 가
                 통째로 맡고, 거기는 상태·날짜·홍보 문구까지 있다. 여기 배지는 32줄 중
                 여섯에만 붙어 그 여섯 줄이 다른 종류처럼 보이게 할 뿐이고, 눌리지도 않는데
                 알약 모양이라 칩(구 선택)과 같은 것으로 읽히기까지 했다. */
              <DistrictRow key={d.id} district={d} festivalTag={false} external
                divider={i < shown.length - 1}
                onClick={() => onOpenDistrict && onOpenDistrict(d)} />
            ))}
          </div>
        ) : (
          <EmptyState pose="curious" base={base}
            title="해당하는 상점가가 없습니다"
            description="다른 구를 선택해 보세요."
            style={{ padding: "var(--space-8) 0" }} />
        )}

        {/* 지금 쪽이 목록의 어디인지 한 줄로 적는다 — 칩이 말하는 수는 조건에 걸린 전부이고,
            이 줄은 그중 지금 화면에 있는 구간이다 (S03 시트와 같은 어법) */}
        {rows.length ? (
          <div style={{ padding: "var(--space-4) 0 var(--space-2)" }}>
            <p style={{ textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {rows.length}곳 중 {start + 1}–{start + shown.length}
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage}
              label="상점가 목록 쪽 넘기기" style={{ marginTop: "var(--space-2)" }} />
          </div>
        ) : null}

        {/* 기준일자를 적지 않는다 (정의서 3-2: 상점가 정보는 미표기 대상)

             119 안내를 끄고 "참고용"을 위 문장에 이었다 (2026-08-19). 전에는 두 줄이었는데,
             앞줄이 이미 "실제와 다를 수 있다"고 말한 뒤 뒷줄이 "참고용입니다"로 같은 말을
             되풀이했다. 119 는 이 화면에 안전시설이 한 줄도 없어서 끈다 — S08·S09·S12 와
             같은 이유다 (DetailNotice 의 emergency 주석). */}
        <DetailNotice emergency={false} style={{ marginTop: "var(--space-6)" }}>
          안내 정보는 참고용이며, 점포 수와 온누리 가맹 수는 시 안내 기준이라
          실제와 다를 수 있습니다.
        </DetailNotice>
      </div>
    </DetailPage>
  );
}

export default DistrictList;
