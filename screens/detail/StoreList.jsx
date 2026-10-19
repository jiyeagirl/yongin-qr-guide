import React from "react";
import {
  DetailPage, DetailNotice, ListControls, OnnuriChip, StoreRow, Pagination, Notice,
  SearchField, CATEGORY_LABELS,
} from "../../design-systems/index.js";
import { STORE_AS_OF } from "../main/config.js";

/* S15 가게 전체보기 (2026-10-19 신설, `docs/direction_v2_rules.md` 9장).
 *
 *   [AppBar]  ← 뒤로 · 둔전골목형상점가 가게
 *   ─────────────────────────────────
 *   [검색창]                               ← 업종 칩 줄은 없다 (2026-10-19)
 *   ─────────────────────────────────
 *   전체 335곳  (🎫 온누리)      ⇅ 거리순    ← sticky
 *   점포 목록 20곳
 *   335곳 중 1–20   ‹  1  …  17  ›
 *
 * ── 왜 이 화면이 생겼나 ─────────────────────────────────────────────────
 * 상점가 탭의 바텀시트는 지도 아래에 가게 335곳이 바로 깔려 있었다. 상점 QR 로 들어온 사람이 상세를
 * 닫고 처음 보는 화면이 가게 목록이면 **상점가를 알리는 화면**이 되지 못한다. 그래서 시트는 축제 ·
 * 인기 매장 · 코스 · 다른 상점가로 바꾸고(DistrictSheet), 전체 목록은 여기로 옮겼다. 시트의
 * [가게 전체보기]와 지도 위 검색창(Enter)이 이 화면을 연다.
 *
 * ── 상태는 셸이 들고 있다 ───────────────────────────────────────────────
 * 검색어 · 업종 · 온누리 · 정렬 · 쪽은 MainApp 의 값이고 여기서는 받아 쓰기만 한다. 상세로 갔다
 * 돌아와도 걸어둔 조건이 그대로이고, 지도 핀이 같은 `rows` 를 본다 — 목록에 "12곳"이라 적혀 있는데
 * 지도에는 335개가 찍혀 있는 어긋남이 없다. (DistrictList 처럼 이 화면이 상태를 들면 뒤로가기마다
 * 조건이 초기화된다 — 335곳에서 좁혀놓고 한 곳 보고 오면 처음부터다.)
 *
 * 점포 행을 누르면 지도에서 켜지 않고 **상세(S06)로 바로** 간다. 이 화면이 지도를 덮고 있어서 지도에
 * 켜 봐야 보이지 않는다.
 */
export function StoreList({
  rows = [], chips = [], cats = [], setCats, q = "", setQ,
  onnuriOnly, setOnnuriOnly, sort, setSort,
  page = 1, setPage, pageSize = 20,
  title = "가게 전체보기",
  onPickStore, onBack,
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const shown = rows.slice(start, start + pageSize);

  /* DistrictSheet 의 catTitle 과 같은 규칙 — 아무것도 안 고른 상태가 전체다 */
  const catTitle = !cats.length ? "전체"
    : cats.length === 1 ? (CATEGORY_LABELS[cats[0]] || cats[0]) : `업종 ${cats.length}종`;

  return (
    <DetailPage title={title} onBack={onBack}
      scrollKey={`${cats.join(",")}|${onnuriOnly}|${sort}|${q}|${safePage}`}>

      <div data-store-search style={{ padding: "var(--space-3) var(--gutter-screen) var(--space-2)" }}>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")} />
      </div>
      {/* 업종 칩 줄은 없다 (2026-10-19, 사용자 요청) — 검색창으로 찾고 온누리·정렬만 남긴다 */}

      <ListControls
        title={`${catTitle} ${rows.length}곳`}
        sort={sort}
        onSortChange={setSort}
        sortOptions={[{ id: "distance", label: "거리순" }, { id: "popular", label: "인기순" }]}
        aside={<OnnuriChip checked={onnuriOnly} onChange={setOnnuriOnly} />} />

      <div style={{ padding: "var(--space-2) var(--gutter-screen) var(--space-6)" }}>
        {rows.length === 0 ? (
          /* 붉은 계열의 작은 안내 (2026-10-19, 사용자 요청) — 종전 info/md 는 글자가 커서 빈 결과인데도
              차분한 정보 상자로 읽혔다. 글자색도 같이 붉게 한다(Notice 의 danger 는 상자·아이콘만 붉다) */
          <Notice tone="danger" size="sm">
            <span style={{ color: "var(--yong-red-800)", fontWeight: "var(--fw-semibold)" }}>조건에 맞는 매장이 없습니다.</span>
          </Notice>
        ) : (
          <div role="list">
            {shown.map((s, i) => (
              <StoreRow key={s.id} store={s} divider={i < shown.length - 1}
                onClick={() => onPickStore(s)} />
            ))}
          </div>
        )}

        {rows.length > 0 ? (
          <div style={{ padding: "var(--space-4) 0 var(--space-2)" }}>
            <p style={{ textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {rows.length}곳 중 {start + 1}–{start + shown.length}
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage}
              label="점포 목록 쪽 넘기기" style={{ marginTop: "var(--space-2)" }} />
          </div>
        ) : null}

        <DetailNotice emergency={false} style={{ marginTop: "var(--space-5)" }}>
          점포 정보 {STORE_AS_OF} 기준. 안내 정보는 참고용입니다.
        </DetailNotice>
      </div>
    </DetailPage>
  );
}

export default StoreList;
