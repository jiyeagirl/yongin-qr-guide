import React from "react";
import {
  SectionHeader, Button, ListRow, FacilityIcon, ListControls, OnnuriToggle,
  Notice, StoreRow, FestivalBanner, CATEGORY_LABELS,
} from "../../design-systems/index.js";
import { PAGE_SIZE } from "./config.js";

/* S03 상점가 탭 바텀시트 내용.
 *
 * 시트는 **결과와 콘텐츠만** 담는다. 검색과 업종 칩은 지도 위 상단 필터 바가 갖고 있다.
 *
 *   [시트 헤더]     상점가명 · 소재지 · 335곳 · 온누리 139곳   ← 항상 보임 (스크롤 영역 밖)
 *   ─────────────────────────────────────────────
 *   우리 상점가 축제 배너 (U-FT-03)                           ← 스크롤로 올라간다
 *   ─────────────────────────────────────────────
 *   전체 335곳                    [거리순|인기순]             ← 여기부터 sticky
 *   🎫 온누리 가맹점만 139곳                    ●—            │  (ListControls)
 *   ─────────────────────────────────────────────
 *   점포 목록 · 무한 스크롤 (20곳씩)
 *   인근 편의시설 / 기준일자·고지
 *
 * 정렬과 온누리가 여기 있는 이유(5-3 #4): 둘 다 "목록에 적용되는 조건"이라
 * 지도가 아니라 목록에 붙어야 성격이 분명해진다. 지도 위도 한 줄 아낀다.
 *
 * 여기서 빠진 것 (기능명세서 v1.0):
 *   신규 및 인기 매장  → 둘러보기 탭 S04 (U-DC-02). 여기서는 정렬 토글이 그 역할을 한다
 *   다른 상점가 목록   → 둘러보기 탭 S04 최하단 (U-ST-14 → U-DC-04)
 */
export function DistrictSheet({
  data, rows, cat, onnuriOnly, setOnnuriOnly, sort, setSort, q,
  selectedId, onPickStore, onPickFacility, onOpenFestival,
}) {
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const sentinel = React.useRef(null);

  /* rows(필터 결과)는 App 이 계산해 내려준다 — 목록과 지도 마커가 같은 배열을 봐야
     "12곳"이라 적힌 목록과 지도에 찍힌 마커 수가 어긋나지 않는다. */

  /* 필터나 정렬이 바뀌면 목록을 처음부터 다시 쌓는다 */
  React.useEffect(() => { setLimit(PAGE_SIZE); }, [cat, onnuriOnly, q, sort]);

  /* 무한 스크롤 (U-ST-04). 시트 스크롤 컨테이너 안의 sentinel 이 보이면 다음 장을 붙인다. */
  React.useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setLimit(n => Math.min(n + PAGE_SIZE, rows.length));
    }, { rootMargin: "240px" });
    io.observe(node);
    return () => io.disconnect();
  }, [rows.length]);

  const shown = rows.slice(0, limit);
  const rest = rows.length - shown.length;

  /* "적용 중" 필터 pill 은 없앴다 — 검색·온누리가 스크롤로 사라질 때만 필요했는데
     이제 상단 필터 바에 항상 떠 있어 켜진 상태가 그 자리에서 그대로 보인다 */

  return (
    <div style={{ paddingBottom: "var(--space-9)" }}>
      {/* ── 우리 상점가 축제 배너 (U-FT-03) — 현재 상점가 1건.
             둘러보기 탭의 32개소 전체 축제 목록과 범위가 다르므로 중복이 아니다 ── */}
      <div style={{ padding: "0 var(--gutter-screen) var(--space-3)" }}>
        <FestivalBanner festival={data.festival} onClick={onOpenFestival} />
      </div>

      {/* ── 목록 제어 (sticky) — 결과 수 · 정렬(U-ST-15) · 온누리(U-ST-11) ── */}
      <ListControls
        title={`${CATEGORY_LABELS[cat] || "전체"} ${rows.length}곳`}
        sort={sort}
        onSortChange={setSort}
        sortOptions={[{ id: "distance", label: "거리순" }, { id: "popular", label: "인기순" }]}>
        <OnnuriToggle checked={onnuriOnly} onChange={setOnnuriOnly} count={data.district.onnuri} />
      </ListControls>

      {/* ── 점포 목록 ─────────────────────────────────────────── */}
      <div style={{ padding: "var(--space-2) var(--gutter-screen) 0" }}>
        {rows.length === 0 ? (
          <Notice tone="info" title="조건에 맞는 매장이 없습니다">
            업종 칩을 전체로 바꾸거나 온누리 조건을 꺼보세요. 둔전 상점가에는 모두 {data.district.stores}곳이 있습니다.
          </Notice>
        ) : (
          <div role="list">
            {shown.map((s, i) => (
              <StoreRow key={s.id} store={s} selected={s.id === selectedId}
                divider={i < shown.length - 1} onClick={() => onPickStore(s)} />
            ))}
          </div>
        )}

        {rest > 0 ? (
          <div ref={sentinel} style={{ display: "flex", justifyContent: "center", padding: "var(--space-4) 0" }}>
            {/* IntersectionObserver 가 없는 환경을 위한 수동 진행 수단도 남긴다 */}
            <Button variant="outline" icon="chevron-down" onClick={() => setLimit(n => n + PAGE_SIZE)}>
              {rest}곳 더 보기
            </Button>
          </div>
        ) : rows.length > 0 ? (
          <p style={{ padding: "var(--space-4) 0", textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
            {rows.length}곳을 모두 불러왔습니다
          </p>
        ) : null}
      </div>

      {/* ── 인근 편의시설 (U-ST-07) ───────────────────────────── */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <SectionHeader title="인근 편의시설" />
        <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
          borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)" }}>
          {data.nearby.map((n, i) => (
            <ListRow key={n.id} icon={<FacilityIcon type={n.type} size={22} />} title={n.name} meta={n.detail}
              divider={i < data.nearby.length - 1} onClick={() => onPickFacility(n)} />
          ))}
        </div>
      </div>

      {/* ── 고지 ──────────────────────────────────────────────
             "다른 상점가 목록"은 둘러보기 탭 최하단으로 이동했다 (U-ST-14 → U-DC-04) ── */}
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {/* U-CM-07 정보 기준일자 · U-CM-08 참고용 고지와 119.
            오류 신고(U-CM-10)는 여기 두지 않는다 — 신고 대상이 특정되는 상세 화면에서 진입한다 */}
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          점포 정보 {data.district.asOf} · 온누리 가맹 정보 2025.07 기준<br />
          안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

export default DistrictSheet;
