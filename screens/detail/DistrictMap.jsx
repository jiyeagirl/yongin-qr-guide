import React from "react";
import {
  DetailPage, KakaoMap, MapPreviewCard, MapFilterOverlay, Sheet, Notice,
  StoreRow, Pagination, CATEGORY_LABELS, DetailNotice, ListControls, OnnuriChip,
} from "../../design-systems/index.js";
import { KAKAO_APP_KEY } from "../main/config.js";
import { metersFrom } from "../main/data/districts.js";

/* 다른 상점가의 지도 보기 (2026-10-19 신설, 사용자 요청. 같은 날 건물별 목록 → 상점가 탭형으로 바뀜).
 * `#/district/:id/map` — 둘러보기 탭에서 상점가를 누르면 상점가 안내(DistrictInfo)가 열리고, 거기의
 * [지도 보기]가 이 화면을 연다. **상점가 탭으로 옮겨 가지 않는다** — 둘러보기 안에서 한 칸 더 들어가는
 * 화면이라 뒤로가기가 안내로, 한 번 더 누르면 둘러보기로 돌아간다 (셸의 지도는 상점가 탭의 것이다).
 *
 * ── 상점가 탭(S03)과 같은 짜임이다 ──────────────────────────────────────────
 *   [AppBar]  ← 뒤로 · 상점가 이름
 *   [검색창] [업종 칩 줄]                  ← 지도 위 필터 바 (MapFilterOverlay)
 *   [지도 — 점포마다 핀(클러스터)]
 *     └ [미리보기 카드]  점포를 고르면 시트 위에 뜬다 · [길찾기] [상세 보기]
 *   [바텀시트 3단 스냅]  점포 목록 20곳씩 · 쪽 나누기   ← 카드가 뜨면 시트는 접힌다
 *
 * 레이어 · 스냅 · 지도 패딩 규칙은 S03 의 것을 그대로 쓴다 (docs/S03_map_overlay_rules.md) — 시트 높이와 필터 바
 * 높이를 실측해 지도의 가림 높이로 넘긴다. 이 화면에서만 다르게 정하지 않는다.
 *
 * 점포는 `stores` 로 받는다 — 상점가 탭이 점포를 읽는 것과 같은 모양이다(StoreRow · MapPreviewCard · 점포 상세 ·
 * 길찾기가 그대로 쓴다). 점포 자료가 없는 상점가는 지도에 중심 핀 하나 + 「준비 중」이다 — 이름만 바뀐 가짜
 * 점포를 만들지 않는다 (DistrictInfo 머리말과 같은 판단).
 *
 * 시트 제어 줄에는 상점가 탭과 같이 [온누리 가맹점] 칩과 거리순/인기순 드롭다운이 있다. 이 점포들은 온누리 가맹 여부를 몰라
 * 시연용으로 시 안내의 수만큼 표시하고, 거리순은 QR 스캔 지점 기준이다(줄에는 거리를 적지 않는다) (data/districtStores.js 머리말). 점포 좌표는 건물 단위의 대략 위치라 그 사실을 아래 고지가 적는다. */
const spaced = name => String(name || "").replace(/(\S)골목형상점가$/, "$1 골목형 상점가");
const PAGE = 20;
const CAT_ORDER = ["food", "cafe", "shop", "life", "edu", "culture", "etc"];

export function DistrictMap({ district, stores = [], onBack, onClose, onOpenStore, onRoute }) {
  const d = district;
  const hasList = stores.length > 0;
  const center = React.useMemo(() => ({ lat: d.lat, lng: d.lng }), [d]);
  const mapApi = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [cats, setCats] = React.useState([]);
  const [onnuriOnly, setOnnuriOnly] = React.useState(false);
  const [sort, setSort] = React.useState("distance");
  const [page, setPage] = React.useState(1);
  const [snap, setSnap] = React.useState("half");
  const [activeId, setActiveId] = React.useState(null);
  const [sheetH, setSheetH] = React.useState(0);
  const [filterH, setFilterH] = React.useState(0);
  const [cardH, setCardH] = React.useState(0);
  const GAP = 24;

  /* 업종 칩 — 점포에 있는 업종만, 곳수와 함께 (0건인 칩은 숨긴다) */
  const chips = React.useMemo(() => CAT_ORDER
    .map(id => ({ id, label: CATEGORY_LABELS[id], count: stores.filter(s => s.cat === id).length }))
    .filter(c => c.count > 0), [stores]);

  /* 지도 핀과 목록이 같은 배열을 본다 — 「12곳」과 지도의 핀 수가 어긋나지 않게 */
  const rows = React.useMemo(() => {
    const t = q.trim();
    const f = stores.filter(s => (cats.length === 0 || cats.includes(s.cat))
      && (!onnuriOnly || s.onnuri)
      && (!t || s.name.includes(t) || s.biz.includes(t) || (s.building || "").includes(t)));
    /* 거리순 = QR 스캔 지점에서 가까운 순(길찾기 출발지와 같은 기준 — 상점가 탭과 같다). 거리 값은 줄에 적지 않는다.
       인기순은 조회수 — 이 점포들은 조회 기록이 없어 0 이라 거리순과 같아진다 */
    const far = s => metersFrom(s.lat, s.lng);
    return sort === "popular"
      ? [...f].sort((a, b) => b.views - a.views || far(a) - far(b))
      : [...f].sort((a, b) => far(a) - far(b));
  }, [stores, cats, onnuriOnly, q, sort]);

  React.useEffect(() => { setPage(1); }, [cats, onnuriOnly, q, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE;
  const shown = rows.slice(start, start + PAGE);
  const active = rows.find(s => s.id === activeId) || null;
  const showPreview = Boolean(active) && snap !== "full";

  /* 카드를 띄우면 시트는 접힌다 (S03 와 같은 규칙 — 지금 보는 것은 카드가 말하고 있다) */
  const pick = React.useCallback(s => {
    setActiveId(s.id);
    if (snap !== "collapsed") setSnap("collapsed");
  }, [snap]);
  const closeCard = () => { setActiveId(null); setCardH(0); setSnap("half"); };
  const changeSnap = next => { setSnap(next); if (next === "full") { setActiveId(null); setCardH(0); } };

  /* 처음엔 점포 전체가 한눈에 들어오게. 좌표가 바뀌면(카카오가 건물 좌표를 찾아 오면) 다시 맞춘다 —
     점포를 골라 들어간 뒤에는 건드리지 않는다 */
  React.useEffect(() => {
    if (ready && hasList && !activeId && rows.length && mapApi.current) {
      mapApi.current.fitTo(rows, { top: filterH + 16, bottom: sheetH + 16, left: 40, right: 40 });
    }
  }, [ready, hasList, rows, activeId, filterH, sheetH]);

  /* 고른 점포를 지도 가운데로 — 시트·카드가 덮는 높이를 알고 난 뒤에 한 번 더 옮긴다 */
  React.useEffect(() => {
    if (active && mapApi.current) mapApi.current.focus(active.lat, active.lng);
  }, [activeId, cardH, sheetH, active]);

  const mapPadBottom = sheetH + (showPreview ? cardH + GAP : 0) + GAP;

  return (
    <DetailPage title={spaced(d.name)} onBack={onBack} onClose={onClose}>
      {/* 본문 전체가 지도 칸이다 — 시트 · 필터 바 · 카드의 좌표 기준 (S03 의 지도 영역과 같다) */}
      <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
        <KakaoMap
          appKey={KAKAO_APP_KEY}
          center={center}
          anchor={!hasList}
          anchorLabel={spaced(d.name)}
          level={hasList ? 3 : 4}
          stores={rows}
          selectedId={activeId}
          topPad={filterH + GAP}
          bottomPad={mapPadBottom}
          mapRef={mapApi}
          onReady={() => setReady(true)}
          onSelectStore={pick} />

        {hasList ? (
          <>
            <MapFilterOverlay
              onHeightChange={setFilterH}
              q={q} onQueryChange={e => setQ(e.target.value)} onQueryClear={() => setQ("")}
              chips={chips} cat={cats} onCatChange={setCats}
              filterLabel="업종 필터" />

            {showPreview ? (
              <MapPreviewCard
                item={active}
                bottom={sheetH}
                onHeightChange={setCardH}
                onClose={closeCard}
                onRoute={() => onRoute && onRoute(active)}
                onDetail={() => onOpenStore && onOpenStore(active)} />
            ) : null}

            {/* 시트에는 상점가 이름을 적지 않는다 (2026-10-19, 사용자 요청) — 위 상단 바가 이미 같은 이름을 적고 있다 */}
            <Sheet
              aria-label={spaced(d.name)}
              snap={snap}
              onSnapChange={changeSnap}
              onHeightChange={setSheetH}
              onClose={snap === "full" ? () => setSnap("half") : undefined}
              closeIcon="map"
              closeLabel="지도"
              topInset={filterH}
              scrollKey={`${cats.join(",")}|${onnuriOnly}|${sort}|${q}|${safePage}`}>
              <div style={{ paddingBottom: "var(--space-9)" }}>
                {/* 목록 제어 (sticky) — 결과 수 + 거리순 드롭다운 + [온누리 가맹점] 칩. 상점가 탭 시트의 같은 줄이다
                    (2026-10-19, 사용자 요청). 점포별 가맹 여부는 자료에 없어 시연용 표시다 (data/districtStores.js 머리말) */}
                <ListControls
                  title={`${cats.length === 1 ? CATEGORY_LABELS[cats[0]] : cats.length > 1 ? `업종 ${cats.length}종` : "전체"} ${rows.length}곳`}
                  sort={sort}
                  onSortChange={setSort}
                  sortOptions={[{ id: "distance", label: "거리순" }, { id: "popular", label: "인기순" }]}
                  aside={<OnnuriChip checked={onnuriOnly} onChange={setOnnuriOnly} />} />
                <div style={{ padding: "var(--space-2) var(--gutter-screen) 0" }}>
                  {rows.length === 0 ? (
                    <Notice tone="danger" size="sm">
                      <span style={{ color: "var(--yong-red-800)", fontWeight: "var(--fw-semibold)" }}>조건에 맞는 매장이 없습니다.</span>
                    </Notice>
                  ) : (
                    <div role="list">
                      {shown.map((s, i) => (
                        <StoreRow key={s.id} store={s} selected={s.id === activeId}
                          divider={i < shown.length - 1} onClick={() => pick(s)} />
                      ))}
                    </div>
                  )}
                  {rows.length > 0 ? (
                    <div style={{ padding: "var(--space-4) 0 var(--space-2)" }}>
                      <p style={{ textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
                        {rows.length}곳 중 {start + 1}–{start + shown.length}
                      </p>
                      <Pagination page={safePage} pageCount={pageCount} onChange={setPage}
                        label="가게 목록 쪽 넘기기" style={{ marginTop: "var(--space-2)" }} />
                    </div>
                  ) : null}
                  <DetailNotice emergency={false} style={{ marginTop: "var(--space-5)" }}>
                    가게 목록은 상권에서 받은 자료 기준이며, 지도의 가게 위치는 건물 주소로 찾은 대략의 위치입니다. 안내 정보는 참고용입니다.
                  </DetailNotice>
                </div>
              </div>
            </Sheet>
          </>
        ) : (
          <div style={{ position: "absolute", left: "var(--gutter-screen)", right: "var(--gutter-screen)",
            bottom: "var(--space-5)", zIndex: "var(--z-float)" }}>
            <Notice tone="info" title="가게 목록은 준비 중이에요">
              현재 상점가의 개별 가게 정보가 제공되지 않아, 지도에는 상점가 중심 위치만 표시됩니다.
            </Notice>
          </div>
        )}
      </div>
    </DetailPage>
  );
}

export default DistrictMap;
