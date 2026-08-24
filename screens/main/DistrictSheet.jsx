import React from "react";
import {
  ListControls, OnnuriChip, Pagination,
  Notice, StoreRow, FestivalBanner, CATEGORY_LABELS,
} from "../../design-systems/index.js";
import { PAGE_SIZE, STORE_AS_OF } from "./config.js";

/* S03 상점가 탭 바텀시트 내용.
 *
 * 시트는 **결과와 콘텐츠만** 담는다. 검색과 업종 칩은 지도 위 상단 필터 바가 갖고 있다.
 *
 *   [시트 헤더]  둔전골목형상점가   포곡읍 포곡로124번길 2 일원  ← 항상 보임 (스크롤 밖)
 *   ─────────────────────────────────────────────
 *   우리 상점가 축제 배너 (U-FT-03) [X]                       ← 닫을 수 있다. 스크롤로 올라간다
 *   ─────────────────────────────────────────────
 *   전체 335곳  (🎫 온누리 가맹점)        ⇅ 거리순              ← 여기부터 sticky
 *   ─────────────────────────────────────────────     (ListControls 한 줄)
 *   점포 목록 20곳
 *   335곳 중 1–20   ‹  1  …  17  ›                           ← 쪽 나누기
 *   기준일자·고지                          ← 주변 공공시설 블록이 그 위에 있었다 (2026-08-24 뺌)
 *
 * **소재지는 상점가명 옆이다** (2026-08-18). 제목 아래 한 줄로 두면 절반 스냅에서 그 한 줄이
 * 점포 한 줄을 통째로 먹어, 시트를 열었는데 가게가 하나밖에 안 보였다. 같은 이유로 헤더 아래
 * 여백과 제어 줄 안팎의 여백도 걷어냈다 — 제어 줄의 두 행은 각각 44px(--tap-min)을 이미
 * 갖고 있어서, 그 바깥 여백은 손가락 자리에 아무것도 보태지 않으면서 세로만 먹고 있었다.
 *
 * 점포 수와 온누리 수는 헤더에서 뺐다 (2026-08-18) — 이 두 줄이 같은 것을 말하고 있었고,
 * 이쪽은 조건을 걸면 함께 줄어드는 살아 있는 수다 (DistrictSummary 주석).
 *
 * 정렬과 온누리가 여기 있는 이유(5-3 #4): 둘 다 "목록에 적용되는 조건"이라
 * 지도가 아니라 목록에 붙어야 성격이 분명해진다. 지도 위도 한 줄 아낀다.
 *
 * 여기서 빠진 것 (기능명세서 v1.1):
 *   신규 및 인기 매장  → 둘러보기 탭 S04 (U-DC-02). 여기서는 정렬 고르기가 그 역할을 한다
 *   다른 상점가 목록   → 둘러보기 탭 S04 최하단 (U-ST-14 → U-DC-04)
 */
/* 고른 업종을 목록 머리에 한 줄로 적는다 (2026-08-20).
   [전체] 칩이 없어졌으므로 **아무것도 안 고른 상태가 전체**이고, 그 사실은 여기서만 글자로
   드러난다 — 칩 줄은 지도 위에 있고 시트를 올리면 그 줄이 보이지 않는다.

   셋부터는 이름을 잇지 않고 세어 적는다. 업종 이름이 짧지 않아서(카페·디저트, 미용·생활)
   셋만 이어도 이 줄의 절반을 넘기는데, 그 오른쪽에는 정렬 컨트롤이 서 있다.

   잇는 가운뎃점은 **앞뒤를 띄운다** (2026-08-20). 업종 이름 안에 이미 가운뎃점이 들어 있어서
   붙여 쓰면 "음식·카페·디저트"가 두 업종인지 세 업종인지 갈리지 않는다. 띄우면
   "음식 · 카페·디저트" 로 어느 점이 잇는 점인지 눈에 보인다. */
function catTitle(cats, labels) {
  if (!cats.length) return "전체";
  if (cats.length <= 2) return cats.map(c => labels[c] || c).join(" · ");
  return `업종 ${cats.length}종`;
}

export function DistrictSheet({
  data, rows, cats = [], onnuriOnly, setOnnuriOnly, sort, setSort, q,
  /* 쪽 번호는 셸이 들고 있다 (2026-08-18). 쪽을 넘기면 목록을 맨 위로 되돌려야 하는데,
     그 스크롤 컨테이너는 이 시트가 아니라 Sheet 이고 Sheet 는 scrollKey 로만 되돌린다 —
     셸이 두 값을 다 쥐고 있어야 한 문자열로 묶을 수 있다. 필터가 바뀔 때 1쪽으로
     되돌리는 것도 같은 이유로 셸이 한다 (필터도 셸의 상태다). */
  page = 1, setPage,
  /* `onPickFacility` 가 여기 있었다 — 주변 공공시설 블록과 함께 나갔다 (2026-08-24) */
  selectedId, onPickStore, onOpenFestival,
  /* 축제 배너 닫기 (2026-08-18). 닫힘 상태는 셸이 들고 있다 — 이 시트는 탭을 옮기면
     언마운트되므로 여기에 두면 둘러보기를 갔다 올 때마다 배너가 되살아난다 */
  festivalDismissed = false, onDismissFestival,
}) {
  /* rows(필터 결과)는 App 이 계산해 내려준다 — 목록과 지도 마커가 같은 배열을 봐야
     "12곳"이라 적힌 목록과 지도에 찍힌 마커 수가 어긋나지 않는다. */

  /* ── 무한 스크롤 → 쪽 나누기 (2026-08-18) ──────────────────────────────
     U-ST-04 는 "한 번에 다 그리지 않는다"를 요구하고, 그 방법으로 무한 스크롤을 썼다.
     요구는 지켜졌지만 **끝이 없는 목록**이 됐다 — 335곳을 내려가는 동안 어디쯤 왔는지도
     얼마나 남았는지도 알 수 없고, 처음으로 돌아가려면 내려온 만큼을 되감아야 했다.
     쪽으로 끊으면 목록에 끝이 생기고, [1]이 늘 손 닿는 곳에 있다.

     지도 마커는 쪽을 따르지 않는다 — 필터에 걸린 335곳이 전부 그대로 찍힌다. 쪽은 읽는
     단위이지 범위가 아니고, 2쪽으로 넘겼다고 지도의 핀이 사라지면 지도가 목록의 부속이 된다. */
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const shown = rows.slice(start, start + PAGE_SIZE);

  /* "적용 중" 필터 pill 은 없앴다 — 검색·온누리가 스크롤로 사라질 때만 필요했는데
     이제 상단 필터 바에 항상 떠 있어 켜진 상태가 그 자리에서 그대로 보인다 */

  return (
    <div style={{ paddingBottom: "var(--space-9)" }}>
      {/* ── 우리 상점가 축제 배너 (U-FT-03) — 현재 상점가 1건.
             둘러보기 탭의 상점가 전체 축제 목록과 범위가 다르므로 중복이 아니다.
             닫으면 자리째 사라진다 — 축제에 관심이 없는 사람에게는 점포 목록 위에
             늘 얹혀 있는 두 줄이었다. 다시 보려면 둘러보기 탭에 그대로 있다. ── */}
      {data.festival && !festivalDismissed ? (
        <div style={{ padding: "0 var(--gutter-screen) var(--space-3)" }}>
          <FestivalBanner festival={data.festival} onClick={onOpenFestival}
            onDismiss={onDismissFestival} />
        </div>
      ) : null}

      {/* ── 목록 제어 (sticky) — 결과 수 · 정렬(U-ST-15) · 온누리(U-ST-11) ── */}
      <ListControls
        title={`${catTitle(cats, CATEGORY_LABELS)} ${rows.length}곳`}
        sort={sort}
        onSortChange={setSort}
        sortOptions={[{ id: "distance", label: "거리순" }, { id: "popular", label: "인기순" }]}
        /* 온누리는 칩이고, **결과 수 옆에 선다** (2026-08-20. 종전 스위치 → 칩 → 같은 줄).
           제 줄을 주면 알약 하나가 44px 을 쓰면서 오른쪽 3분의 2가 빈다 — 절반 스냅에서
           그 44px 은 점포 한 줄이다. 이 줄은 이제 "얼마나 · 무엇이 걸렸나 · 어떤 차례로"를
           한 줄로 말한다.

           **가맹 수(139)를 칩에 적지 않는다** (OnnuriChip 머리말). 칩을 켜면 왼쪽 제목이
           곧 그 수다 — `rows` 가 온누리로 걸러진 배열이라 "전체 139곳"이 된다. 같은 수를
           한 줄에 두 번 적을 이유가 없고, 이 줄에는 그럴 가로도 없다. */
        aside={<OnnuriChip checked={onnuriOnly} onChange={setOnnuriOnly} />} />

      {/* ── 점포 목록 ─────────────────────────────────────────── */}
      <div style={{ padding: "var(--space-2) var(--gutter-screen) 0" }}>
        {rows.length === 0 ? (
          /* 한 줄이다 (2026-08-24, 사용자 요청). "업종 칩을 전체로 바꾸거나 온누리
             조건을 꺼보세요"와 상점가 전체 곳수가 뒤에 붙어 있었는데, 조건을 방금 건
             사람은 그 조건이 무엇인지 이미 알고 있고 그것을 거는 칩은 바로 위에 켜진 채로
             서 있다. 빈 목록에서 알아야 하는 것은 **지금 이 조건에 맞는 것이 없다**는
             사실 하나뿐이고, 그 다음에 할 일은 문장을 읽는 것이 아니라 칩을 다시 누르는 것이다 */
          <Notice tone="info">조건에 맞는 매장이 없습니다.</Notice>
        ) : (
          <div role="list">
            {shown.map((s, i) => (
              <StoreRow key={s.id} store={s} selected={s.id === selectedId}
                divider={i < shown.length - 1} onClick={() => onPickStore(s)} />
            ))}
          </div>
        )}

        {/* 지금 쪽이 목록의 어디인지 한 줄로 적는다. 위의 "전체 335곳"은 조건에 걸린
            전부이고, 이 줄은 그중 지금 화면에 있는 구간이다 — 쪽 단추만 있으면
            "20곳씩인가 25곳씩인가"를 세어봐야 안다 */}
        {rows.length > 0 ? (
          <div style={{ padding: "var(--space-4) 0 var(--space-2)" }}>
            <p style={{ textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {rows.length}곳 중 {start + 1}–{start + shown.length}
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage}
              label="점포 목록 쪽 넘기기" style={{ marginTop: "var(--space-2)" }} />
          </div>
        ) : null}
      </div>

      {/* ── 주변 공공시설(U-ST-07) 블록이 여기 있었다 (2026-08-24 삭제, 사용자 요청) ──
             점포 상세(S06)에서 뺀 것과 **같은 이유의 마지막 자리**다. 그때 남긴 근거는
             "여기는 상점가 전체를 내려다보는 목록의 끝이라 성격이 다르다"였는데, 그 말이
             성립하려면 이 목록을 끝까지 내려온 사람이 시설을 찾고 있어야 한다. 그는
             **가게를 고르고 있다** — 시설을 찾을 생각이었다면 탭 하나 옆의 공공시설 탭이
             그 일을 통째로 맡고 있고, 거기에는 유형 칩도 거리순 목록도 지도 마커도 있다.

             블록 하나로는 그중 아무것도 못 준다. 실제로 이 줄을 누르면 하는 일이
             **공공시설 탭으로 데려가는 것**이었다 (MainApp 의 showFacilityOnMap) —
             갈 곳이 그 탭뿐이라는 것을 코드가 이미 말하고 있었다.

             U-ST-07 은 이로써 화면에서 사라진다. 시설 자료(`data.nearby`)는 그대로 있고
             공공시설 탭이 같은 것을 본다 — 두 탭이 같은 시설을 다른 거리로 말하지 않게
             하려고 한 출처를 쓰는 규칙(MainApp 의 `d`)도 그대로다. */}

      {/* ── 고지 ──────────────────────────────────────────────
             "다른 상점가 목록"은 둘러보기 탭 최하단으로 이동했다 (U-ST-14 → U-DC-04) ── */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {/* U-CM-07 정보 기준일자 · U-CM-08 참고용 고지.
            오류 신고(U-CM-10)는 여기 두지 않는다 — 신고 대상이 특정되는 상세 화면에서 진입한다.

            ── 119 안내를 껐다 (2026-08-24) ────────────────────────────────────
            그 문장은 **안전시설을 보여준 화면의 고지**다. AED·대피소를 안내한 다음
            "그래도 급하면 119"로 잇는 자리이고, 앞의 안내가 있어야 뒷문장이 고지가 된다
            (DetailNotice 의 emergency 주석). 이 화면이 그 문장을 달고 있던 이유는 바로 위에
            주변 공공시설 네 줄이 있었기 때문인데, 같은 날 그 블록을 뺐다 — 이제 이 시트에
            깔리는 것은 점포뿐이고, 가게 목록 끝의 119 는 걸릴 데 없이 떠 있는 문장이다.
            S06 점포 상세 · S08 코스 · S09 축제 · S12 · S13 이 이미 같은 이유로 꺼져 있다. */}
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {/* 줄바꿈을 넣지 않는다 (2026-08-24, 사용자 요청). 두 문장이 같은 것을
              말하고 있고(이 화면이 보여준 자료), 각 줄이 화면 폭의 절반도 못 채워
              두 조각으로 갈라 놓을 근거가 없었다 — 둘러보기 탭이 이미 한 줄이다
              (DiscoverPanel). 폭이 모자라면 어차피 접히고, 그때 접히는 자리는
              문장의 자리가 아니라 화면의 자리다 */}
          점포 정보 {STORE_AS_OF} 기준. 안내 정보는 참고용입니다.
        </p>
      </div>
    </div>
  );
}

export default DistrictSheet;
