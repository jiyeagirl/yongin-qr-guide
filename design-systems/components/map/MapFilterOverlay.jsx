import React from "react";
import { SearchField } from "../core/SearchField.jsx";
import { FilterBar } from "../core/FilterBar.jsx";

/* 상단 필터 바 — 기능명세서 5-3 레이어 표의 `z 300 | 상단 필터 바 | 스크롤해도 고정`.
 *
 * 검색과 유형 칩을 시트가 아니라 **지도 위쪽**에 고정한다.
 * 시트는 결과 목록만 담고, 필터는 시트를 어디로 끌든 항상 같은 자리에 있다.
 *
 * 두 줄로만 구성한다 (세로로 지도를 잡아먹으면 안 된다):
 *
 *     [검색창                                    ]
 *     [전체 335][음식 132][카페 18][쇼핑 53][미용 4⋮
 *      ↑ 가로 스크롤. **[전체] 칩이 맨 왼쪽에 선다** (2026-08-24 되살림 — FilterBar 머리말).
 *        빈 배열이 전체라는 규칙은 그대로고, [전체]는 그 상태를 보이게 하고 되돌려 준다.
 *        줄은 화면 끝까지 흘러 마지막 칩이 잘린 채 걸치고, 더 밀 수 있는 동안 끝이 흐려진다
 *
 * 여기에 두는 것은 **지도를 보며 범위를 좁히는 것**뿐이다.
 * 온누리 칩과 정렬은 목록 위(`ListControls`)로 내렸다 — 목록을 보며 바꾸는 조건이고,
 * 네 개를 전부 지도 위에 고정하면 지도가 그만큼 영구히 가려진다.
 *
 * 배경 패널을 깔지 않는다. 흰 알약만 그림자와 함께 떠 있어 사이사이로 지도가 보인다.
 *
 * 세 탭이 같은 바를 쓴다. 축만 다르다:
 *   상점가 탭   검색 + 업종 칩 7종     (U-ST-10, U-ST-12)
 *   공공시설 탭 시설 유형 칩 4종만      (U-FC-01) — showSearch={false}.
 *               시설은 이름을 알고 찾는 대상이 아니라 유형으로 고르는 대상이라
 *               검색창을 두면 쓰지 않는 입력이 지도를 한 줄 더 가린다
 *
 * `cat` 에 배열을 넘기면 여럿 고르기가 된다 (FilterBar 가 그대로 받는다). 두 탭 다 배열이다 —
 * 축은 달라도 "여럿 고를 수 있다"는 성질이 탭마다 다르면 같은 줄을 두 가지로 배워야 한다.
 *
 * ── 시트가 이 바를 덮지 않게 하는 것은 시트 쪽 책임이다 ──────────────────────
 * 시트는 z 500 이고 이 바는 z 300 이라, 시트를 끌어올리면 그냥 덮어버린다.
 * `Sheet` 의 `topInset` 에 이 바의 실측 높이를 넘겨 시트가 여기까지 올라오지 못하게 막는다.
 * 전에는 시트가 전체 스냅일 때 이 컴포넌트를 시트 헤더 안으로 옮겨 붙이는 `inline` 모드가
 * 있었는데, 드래그 도중에는 여전히 잘렸고 필터가 화면 위아래로 순간이동해 자리를 잃었다.
 * 시트를 막는 쪽이 규칙도 단순하고(z 순서 그대로) 필터의 물리적 위치도 늘 같다.
 *
 * onHeightChange 는 실측 높이를 알린다. 두 곳이 이 값을 쓴다 —
 * 지도의 `topPad`(마커를 탭했을 때 위쪽 가림 높이)와 시트의 `topInset`.
 * 검색창 유무로 높이가 달라지므로 이 값은 반드시 measure 여야 한다 (상수로 박으면 어긋난다).
 *
 * ── `trailing` — 칩 줄 **아래 오른쪽**에 서는 것 (2026-08-26, 사용자 요청) ────────
 * 공공시설 탭의 안내 반경 고르개가 첫 손님이다 (U-FC-08). 처음에는 지도 오른쪽에 세로로
 * 세웠는데(`RadiusSlider`) **지도의 한쪽을 통째로 차지했다** — 2·3·4km 세 칸이 각각
 * 손가락 자리를 가지려니 200px 짜리 기둥이 됐고, 그 기둥이 서 있는 내내 지도의 오른쪽
 * 3분의 1이 가려졌다. 고를 것이 셋뿐이면 **접어 두는 편**이 맞다: 평소에는 지금 값 한
 * 마디만 서 있고 누를 때만 펼쳐진다 (`InlineSelect`).
 *
 * 칩과 **같은 줄에 두지 않는다.** 칩 줄은 화면 끝까지 흘러 마지막 칩이 잘린 채 걸치는
 * 것으로 「더 있다」를 말하는데(v1.4), 오른쪽 끝에 무언가를 고정하면 그 신호가 사라진다.
 * 제 줄을 갖되 오른쪽 끝에 붙어, 그 줄의 나머지로는 지도가 그대로 보인다.
 */
export function MapFilterOverlay({
  showSearch = true,
  q, onQueryChange, onQueryClear,
  chips = [], cat, onCatChange, renderIcon, filterLabel,
  trailing,
  onHeightChange,
  style, ...rest
}) {
  const el = React.useRef(null);
  const report = React.useRef(onHeightChange);
  report.current = onHeightChange;

  React.useEffect(() => {
    const node = el.current;
    if (!node) return;
    const send = () => report.current && report.current(node.getBoundingClientRect().height);
    send();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(send) : null;
    if (ro) ro.observe(node);
    return () => { if (ro) ro.disconnect(); };
    /* `trailing` 도 의존성이다 — 그 줄이 생기고 없어지면 바의 높이가 달라지는데, 그 값을
       지도 패딩과 시트 상한이 함께 본다. ResizeObserver 가 어차피 잡지만 탭을 옮긴 첫
       프레임에는 옛 높이가 나가 카메라가 한 번 어긋난 자리를 잡는다 */
  }, [showSearch, !!trailing]);

  return (
    <div ref={el}
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: "var(--z-filter)",
        padding: "var(--space-3) 0 var(--space-2)", pointerEvents: "none", ...style }}
      {...rest}>

      {showSearch ? (
        <div style={{ pointerEvents: "auto", padding: `0 var(--gutter-screen)`, marginBottom: "var(--space-2)" }}>
          <SearchField value={q} onChange={onQueryChange} onClear={onQueryClear} elevated />
        </div>
      ) : null}

      <div style={{ pointerEvents: "auto" }}>
        <FilterBar floating sticky={false} chips={chips} value={cat} onChange={onCatChange}
          renderIcon={renderIcon} label={filterLabel} />
      </div>

      {/* 오른쪽 끝은 위 검색창·칩 줄과 **같은 세로선**이다 (`--gutter-screen`).
          왼쪽은 비워 둔다 — 이 줄에서 지도가 보이는 자리다 */}
      {trailing ? (
        <div style={{ display: "flex", justifyContent: "flex-end",
          padding: `0 var(--gutter-screen)`, marginTop: "var(--space-1)" }}>
          <div style={{ pointerEvents: "auto" }}>{trailing}</div>
        </div>
      ) : null}
    </div>
  );
}
