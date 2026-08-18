import React from "react";
import {
  AppBar, ContextBar, KakaoMap, MapPreviewCard, MapFilterOverlay, Sheet, Toast, TabBar,
  DistrictSummary, FacilitySummary, FacilityIcon, FACILITY_LABELS, FACILITY_TYPES, SAFETY,
  Icon, Mascot, token,
} from "../../design-systems/index.js";
import { DUNJEON } from "./data/dunjeon.js";
import { FACILITIES, NEARBY, NEAR_LIMIT, NEAR_ENOUGH } from "./data/facilities.js";
import { DISTRICTS, OTHER_DISTRICTS, FESTIVALS, HAS_LIVE_FESTIVAL, CURRENT_FESTIVAL, CURRENT_DISTRICT_ID } from "./data/districts.js";
import { DistrictSheet } from "./DistrictSheet.jsx";
import { FacilitySheet } from "./FacilitySheet.jsx";
import { DiscoverPanel } from "./DiscoverPanel.jsx";
import { FacilityDetail } from "../detail/FacilityDetail.jsx";
import { StoreDetail } from "../detail/StoreDetail.jsx";
import { CourseDetail } from "../detail/CourseDetail.jsx";
import { FestivalDetail } from "../detail/FestivalDetail.jsx";
import { useHashRoute, go, back } from "./router.js";
import { KAKAO_APP_KEY, MAP_LEVEL, TAB_MAP_LEVEL, FACILITY_AS_OF, FESTIVAL_AS_OF } from "./config.js";

/* 시민용 모바일 웹의 본 화면 — 지도 1개 + 하단 탭 3개 (기능명세서 v1.0 확정 결정사항 11).
 *
 *   S02 공공시설 탭   AED · 화장실 · 쉼터 · 대피소   (U-FC-01~04, 06, 08, 09)   지도 + 시트
 *   S03 상점가 탭     현재 상점가의 점포 목록         (U-ST-02~06, 10~13, 15, U-FT-03)  지도 + 시트
 *   S04 둘러보기 탭   축제 · 신규/인기 · 코스 · 상점가 (U-DC-01~06)              **정보 화면만**
 *
 * 셋은 별도 페이지가 아니라 **같은 화면의 탭 상태**다 (4장). 페이지를 나누면 탭을 바꿀 때마다
 * 지도가 다시 뜨는데, 그것을 U-CM-16 이 금지한다. 그래서 폴더도 S02/S03 이 아니라 `main` 이다.
 *
 * ── 이 화면이 확정한 것 (기능명세서 5-3, 전문은 docs/S03_map_overlay_rules.md) ──
 *
 *  1. 바텀시트 3단 스냅 — 지도 영역 기준 접힘 18% / 절반 37% / 전체 100%
 *     → 지도 노출 82% / 63% / 0%. 값은 tokens/layers.css 가 단일 출처다 (여기에 옮겨 적지 않는다).
 *     **세 탭이 같은 값을 쓴다** — 탭마다 시트 높이가 다르면 탭 전환이 화면이 통째로 바뀌는 것처럼 보인다.
 *
 *  2. 지도 패딩 — 위(상단 필터 바) · 아래(시트 + 미리보기 카드)를 measure 해 px 로 넘긴다.
 *     공공시설 탭은 검색창이 없어 필터 바가 한 줄 낮다. 그래서 상수가 아니라 measure 여야 한다.
 *
 *  3. 플로팅 컨트롤 — 앵커링 규칙은 확정했으나 두 탭 모두 대상이 없다 (지도 위에 버튼을 두지 않는다).
 *     U-FC-03 의 "목록과 지도 토글"은 별도 버튼이 아니라 **시트 스냅 자체**가 맡는다.
 *     시트를 끌어올리면 목록, 내리면 지도다. 같은 일을 하는 버튼을 하나 더 두면
 *     시트 상태와 버튼 상태가 어긋나는 경우가 생긴다 (S03 에서 이미 제거한 버튼이다).
 *
 *  4. 필터 고정 범위 — 지도 위 z 300 에는 "지도를 보며 범위를 좁히는 것"만 둔다.
 *       공공시설 탭   시설 유형 칩 5종           (검색·정렬 없음)
 *       상점가 탭     검색 + 업종 칩 7종         (온누리·정렬은 목록 위 sticky)
 *
 *  5. 탭바와 시트의 공존 — 탭바는 시트의 형제 요소이며 항상 보인다 (TabBar 주석 참조).
 *  6. 탭 전환 시 지도 — 재로딩하지 않고(U-CM-16) 카메라만 QR 지점 + 탭 기본 줌으로 되돌린다.
 *
 * ── 둘러보기 탭에는 지도가 없다 (2026-08-18 변경) ────────────────────────
 * 32개소를 한 화면에 담으려면 시 전역(약 25km)까지 줌아웃해야 하는데, 그 축척에서는
 * 핀이 어디에 있든 "용인시 어딘가"로만 읽혀 아무 것도 알려주지 못했다. 이 탭의 주인공인
 * 축제·신규매장·코스도 지도 위의 점이 아니라 읽을거리다. 그래서 앱바 아래 전체를 정보 화면으로 쓴다.
 *
 * **지도는 언마운트하지 않고 display:none 으로 감추기만 한다.** 지우면 탭을 되돌아올 때
 * 지도가 다시 뜨는데 U-CM-16 이 금지하는 것이 바로 그것이다. 금지 대상은 "재로딩"이지
 * "안 보이는 것"이 아니다. 다시 보일 때는 KakaoMap 안의 ResizeObserver 가 relayout 을
 * 호출하므로(0 → 실제 크기) 따로 손댈 것이 없다.
 *
 * ── 상세 화면은 이 셸 위에 덮인다 (2026-08-18) ──────────────────────────
 * S05 시설 상세와 S06 점포 상세는 별도 페이지가 아니라 해시 라우터가 띄우는 전체화면
 * 오버레이다 (router.js). 페이지를 나누면 지도가 재생성될 뿐 아니라 이 셸이 들고 있는
 * 필터 상태(cat / onnuriOnly / q / sort / snap)가 통째로 초기화된다 — 335곳에서 조건을
 * 좁혀놓고 한 곳 눌러본 뒤 돌아오면 처음부터 다시 걸어야 한다.
 * 오버레이는 이 컴포넌트를 언마운트하지 않으므로 뒤로가기가 즉시이고 상태가 그대로 남는다.
 */

const SNAP_LABEL = { collapsed: "접힘", half: "절반", full: "전체" };

/* 하단 탭 3개 (U-CM-03). 아이콘은 기능명세서 5-2 확정값.
   진행 중 축제가 있으면 둘러보기에 점을 찍는다 (U-CM-18).

   공공시설 탭은 `shield-plus` 와 `life-buoy` 중 택일이 남아 있었다 (6장 남은 확인사항 #6).
   **`life-buoy` 로 확정한다** — 대피소가 이미 `shield` 를 쓰고 있어, 방패 계열을 탭에도 쓰면
   탭바의 방패와 지도·목록의 방패가 서로 다른 것을 가리키게 된다.
   탭 아이콘은 4종을 묶는 상위 개념이어야 하는데 그중 하나와 같은 형태를 쓰면 위계가 무너진다. */
const TABS = [
  { id: "facility", label: "공공시설", icon: "life-buoy" },
  { id: "district", label: "상점가", icon: "store" },
  { id: "discover", label: "둘러보기", icon: "compass" },
];
const tabOf = id => TABS.find(t => t.id === id);

/* 거리 문구 — 1km 를 넘으면 km 로 적는다 ("약 1400m"는 크기 감이 안 온다) */
const km = m => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`);

export function MainApp() {
  /* 인근 편의시설(U-ST-07)은 공공시설 탭과 같은 데이터에서 뽑는다 — 두 탭이 같은 시설을
     다른 거리로 말하지 않게 한다. 합치는 일은 데이터 파일이 아니라 화면이 한다 (순환 참조 방지) */
  const d = React.useMemo(() => ({ ...DUNJEON, nearby: NEARBY, festival: CURRENT_FESTIVAL }), []);

  const [tab, setTab] = React.useState("facility");   /* QR 스캔 시 공공시설 탭으로 진입 (U-CM-03) */
  const [snap, setSnap] = React.useState("half");
  const [selected, setSelected] = React.useState(null);   /* 지도에서 탭한 대상 */

  /* 상세 오버레이 (S05 / S06). 아래 상태들과 **별개**로 움직인다 — 오버레이가 열리고 닫혀도
     탭·시트 스냅·필터는 건드리지 않는다. 그게 페이지를 나누지 않은 이유 그 자체다. */
  const route = useHashRoute();

  /* 상점가 탭 필터 (U-ST-10 / 11 / 12 / 15) */
  const [cat, setCat] = React.useState("all");
  const [onnuriOnly, setOnnuriOnly] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("distance");

  /* 공공시설 탭 필터 (U-FC-01) — 상점가의 업종 칩과 별개의 상태다.
     하나로 합치면 탭을 오갈 때 "음식"이 "AED"로 둔갑한다 */
  const [fcType, setFcType] = React.useState("all");

  const [sheetH, setSheetH] = React.useState(0);          /* 시트 실측 높이(px) */
  const [previewH, setPreviewH] = React.useState(0);      /* 미리보기 카드 실측 높이(px) */
  const [filterH, setFilterH] = React.useState(0);        /* 상단 필터 바 실측 높이(px) */
  const [toast, setToast] = React.useState(null);
  const mapApi = React.useRef(null);
  const toastTimer = React.useRef(null);

  const say = React.useCallback(msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  React.useEffect(() => () => clearTimeout(toastTimer.current), []);

  const isFacility = tab === "facility";
  const isDistrict = tab === "district";
  const isDiscover = tab === "discover";

  /* 현재 상점가 (U-ST-01). null 이면 둘러보기 탭이 축소 모드로 간다 (U-DC-06).
     지금은 QR 지점이 둔전 구역 안이라 항상 있다 — S03-E 착수 시 여기가 분기점이 된다. */
  const currentDistrict = React.useMemo(
    () => DISTRICTS.find(x => x.id === CURRENT_DISTRICT_ID) || null, []);

  /* ── S03 상점가: 필터 + 정렬 ──────────────────────────────────────────
     목록과 지도 마커가 같은 배열을 본다 (U-ST-10/11/12/15 → U-ST-13).
     정렬은 칩·온누리·검색과 독립된 축이라 조합이 가능하다 (예: 음식 칩 + 인기순) */
  const storeRows = React.useMemo(() => {
    const needle = q.trim();
    const filtered = d.stores.filter(s =>
      (cat === "all" || s.cat === cat) &&
      (!onnuriOnly || s.onnuri) &&
      (!needle || s.name.includes(needle) || s.biz.includes(needle)));
    return sort === "popular"
      ? [...filtered].sort((a, b) => b.views - a.views || a.dist - b.dist)
      : [...filtered].sort((a, b) => a.dist - b.dist);
  }, [d.stores, cat, onnuriOnly, q, sort]);

  /* ── S02 공공시설: 유형별 내부 상한 (U-FC-08) ──────────────────────────
     AED·대피소는 상한이 없다 — 멀어도 최근접을 반드시 제시해야 하는 유형이다.
     화장실·쉼터는 1km. 상한은 **사용자에게 노출하지 않는다** (화면 어디에도 "1km"라고 적지 않는다).

     상한 안에 하나도 없으면 상한을 무시하고 최근접 2건까지 되살린다 (U-FC-09).
     빈 결과 화면을 만들지 않는 것이 이 규칙의 핵심이다. */
  const facilityByType = React.useMemo(() => {
    const out = {};
    for (const t of FACILITY_TYPES) {
      const all = FACILITIES.filter(f => f.type === t);                 /* 이미 거리순 */
      const within = all.filter(f => f.dist <= (NEAR_LIMIT[t] ?? Infinity));
      out[t] = within.length ? within : all.slice(0, 2);                /* U-FC-09 폴백 */
    }
    return out;
  }, []);

  /* 칩 개수는 상한을 적용한 뒤의 개수다 — 칩에 6이라 적고 목록에 5줄이 나오면
     사용자는 한 곳이 사라졌다고 읽는다. 0건인 유형은 FilterBar 가 칩째로 숨긴다 (U-ST-10 과 같은 규칙) */
  const facilityChips = React.useMemo(() => {
    const chips = FACILITY_TYPES.map(t => ({ id: t, label: FACILITY_LABELS[t], count: facilityByType[t].length }));
    return [{ id: "all", label: "전체", count: chips.reduce((n, c) => n + c.count, 0) }, ...chips];
  }, [facilityByType]);

  const facilityRows = React.useMemo(() => {
    const pick = fcType === "all" ? FACILITY_TYPES : [fcType];
    return pick.flatMap(t => facilityByType[t]).sort((a, b) => a.dist - b.dist);
  }, [facilityByType, fcType]);

  /* U-FC-09 원거리 안내 배너.
     "가깝다"의 선(NEAR_ENOUGH)을 넘는 최근접만 대상이다. 전체 보기에서는 안전시설(AED·대피소·쉼터)만 본다 —
     화장실이 멀다는 것은 배너를 쓸 만큼 급하지 않고, 4종마다 배너가 뜨면 목록보다 배너가 길어진다.
     유형을 하나 고른 상태에서는 그 유형만 본다 (화장실을 골랐으면 화장실이 먼 것도 알려야 한다). */
  const facilityNotices = React.useMemo(() => {
    const watch = fcType === "all" ? SAFETY : [fcType];
    return watch
      .map(t => facilityByType[t][0])
      .filter(f => f && f.dist > NEAR_ENOUGH)
      .map(f => ({ type: f.type, text: km(f.dist) }));
  }, [facilityByType, fcType]);

  /* ── 결정 2: 지도 가림 높이 ────────────────────────────────────
     위는 상단 필터 바, 아래는 시트(+미리보기 카드)가 가린다. 마커는 그 사이 띠의 중앙으로 온다 */
  const gap = React.useMemo(() => parseFloat(token("--map-pad-gap", "24px")) || 24, []);
  /* 둘러보기에는 지도가 없으므로 미리보기 카드도 없다 — 가리킬 마커가 없다 */
  const showPreview = Boolean(selected) && snap !== "full" && !isDiscover;
  const mapPadBottom = sheetH + (showPreview ? previewH + gap : 0) + gap;

  /* 둘러보기 탭에는 필터 바가 없다 (고르는 화면이 아니라 훑는 화면이다).
     그때 마지막으로 잰 높이를 그대로 쓰면 있지도 않은 바만큼 위를 비워두게 되므로 0 으로 되돌린다. */
  const hasFilterBar = !isDiscover;
  const barH = hasFilterBar ? filterH : 0;
  const mapPadTop = barH + gap;

  /* 시트는 상단 필터 바 아래까지만 올라온다. 시트가 z 500 이고 필터 바가 z 300 이라
     막아두지 않으면 시트를 끌어올릴 때 검색창과 칩이 위에서부터 잘려 나간다.
     전체 스냅도 "지도 영역 전부"가 아니라 "필터 바 아래 전부"가 된다 —
     목록만 보는 상태에서도 필터는 늘 같은 자리에 있어야 한다. */
  const sheetTopInset = barH;

  /* 지도 위에 두는 것은 "지도를 보며 범위를 좁히는 것"뿐이다 (결정 4).
     두 탭이 같은 MapFilterOverlay 를 쓰고 축만 갈아끼운다 — 필터 바의 위치·z·measure 규칙이
     탭마다 달라지면 지도 패딩 계산이 탭별로 따로 놀게 된다. */
  const filterProps = isFacility
    ? { showSearch: false, chips: facilityChips, cat: fcType, onCatChange: setFcType,
        filterLabel: "시설 유형 필터",
        /* 칩에서는 색이 선택 상태를 뜻하므로 안전시설 적색 강조를 끈다 (emphasis={false}).
           아이콘 표는 FacilityIcon 한 곳에만 있다 (U-CM-05) */
        renderIcon: c => <FacilityIcon type={c.id} size={15} emphasis={false} /> }
    : { q, onQueryChange: e => setQ(e.target.value), onQueryClear: () => setQ(""),
        chips: d.chips, cat, onCatChange: setCat };

  const focus = React.useCallback((lat, lng) => {
    if (mapApi.current) mapApi.current.focus(lat, lng);
  }, []);

  /* 마커 탭 — 카드를 띄우고 그 마커를 "보이는 지도 영역"의 중앙으로 올린다.
     패딩 계산에는 방금 뜬 카드 높이도 들어가야 하므로 다음 프레임에 focus 한다. */
  const pickOnMap = React.useCallback(item => {
    setSelected(item);
    if (snap === "full") setSnap("half");
    requestAnimationFrame(() => requestAnimationFrame(() => focus(item.lat, item.lng)));
  }, [snap, focus]);

  /* 시트 높이가 바뀌면 선택된 마커를 다시 시야로 끌어올린다 (스냅 이동 후에도 안 가려지게) */
  React.useEffect(() => {
    if (!selected || snap === "full") return;
    const t = setTimeout(() => focus(selected.lat, selected.lng), 340); /* --dur-slow 이후 */
    return () => clearTimeout(t);
  }, [snap, selected, focus]);

  const backToAnchor = () => {
    setSelected(null);
    setSnap("collapsed");
    if (mapApi.current) mapApi.current.reset();
    say("QR 스캔 지점으로 돌아왔습니다");
  };

  /* 탭 전환 (5-3 #6) — 지도는 재로딩하지 않고(U-CM-16) 카메라만 QR 지점 + 탭 기본 줌으로 되돌린다.
     마커 레이어도 함께 갈아끼운다 (U-CM-17: 한 번에 한 레이어만).
     각 탭의 필터 상태는 지우지 않는다 — 상점가에서 "음식 + 온누리"를 걸어두고 공공시설을 잠깐 본 뒤
     돌아왔을 때 조건이 풀려 있으면 다시 걸어야 한다. 지우는 것은 선택과 스냅뿐이다. */
  const changeTab = id => {
    if (id === tab) return;
    setTab(id);
    setSelected(null);
    setSnap("half");
    if (!mapApi.current) return;
    /* 둘러보기는 지도를 쓰지 않으므로 카메라를 건드리지 않는다. 지도는 감춰진 채
       공공시설·상점가가 마지막으로 두고 간 자리를 그대로 유지하고, 그 탭으로 돌아올 때
       아래 줄이 다시 QR 지점으로 맞춘다. */
    if (id !== "discover") mapApi.current.setView(d.anchor.lat, d.anchor.lng, TAB_MAP_LEVEL[id]);
  };

  /* U-CM-17 — 시설 마커와 점포 마커를 동시에 노출하지 않는다. 탭이 소유한 레이어만 그린다.
     상점가 탭의 "인근 편의시설"은 목록으로만 제공하고 지도에는 찍지 않는다.

     상점가 지점 레이어는 없앴다 — 둘러보기가 지도를 쓰지 않게 되면서 그릴 곳이 사라졌다.
     KakaoMap 의 districts prop 자체는 남겨둔다 (S03-E 의 "근처 가볼만한 상점가"가 쓸 자리다). */
  const storeMarkers = isDistrict ? storeRows : [];
  const facilityMarkers = isFacility ? facilityRows : [];

  /* ── 상세 오버레이 (S05 / S06) ────────────────────────────────────────
     route 는 URL 이 진실이다. 여기서 id 로 대상을 찾고, 없으면 셸로 되돌린다 —
     딥링크 오타나 데이터 교체로 빈 화면이 뜨는 상태를 만들지 않는다 (S11 의 축소판). */
  const target = React.useMemo(() => {
    if (route.name === "facility") return FACILITIES.find(x => x.id === route.id) || null;
    if (route.name === "store") return d.stores.find(x => x.id === route.id) || null;
    if (route.name === "course") return d.courses.find(x => x.id === route.id) || null;
    if (route.name === "festival") return FESTIVALS.find(x => x.id === route.id) || null;
    return null;
  }, [route, d.stores, d.courses]);

  React.useEffect(() => {
    if (route.name !== "main" && !target) {
      say("정보를 찾을 수 없습니다");
      back();
    }
  }, [route, target, say]);

  /* 상세에서 지도로 돌아가는 길은 **뒤로가기 하나로 통일한다.**
     [지도에서 보기] 버튼을 뒀다가 뺐다 — 상단에 뒤로가기, 하단에 길찾기가 이미 있어
     지도로 가는 길이 셋이 됐다. 게다가 그 버튼은 탭을 옮기고 필터까지 풀어야 마커가
     보이는 동작이라, 사용자가 걸어둔 조건을 상세 화면이 조용히 건드리는 셈이었다.
     뒤로가기는 떠날 때 모습 그대로 돌아온다 — 그게 오버레이 구조를 택한 이유다. */
  const report = () => say("정보 오류 신고 (S10 오류신고 및 문의)");
  const copied = ok => say(ok ? "주소를 복사했습니다" : "복사에 실패했습니다. 주소를 길게 눌러 선택해 주세요");

  const detail = !target ? null
    : route.name === "course" ? (
      <CourseDetail
        course={target}
        anchor={d.anchor}
        asOf={d.district.asOf}
        onBack={back}
        /* 코스 안의 가게에서 점포 상세로 — history 를 한 칸 더 쌓는다.
           뒤로가기를 누르면 코스로 돌아오고, 그때 보고 있던 순번도 그대로다
           (오버레이가 언마운트되지 않으므로 activeId 가 살아 있다) */
        onPickStore={s => go(`#/store/${s.id}`)}
        onReport={report} />
    ) : route.name === "festival" ? (
      <FestivalDetail
        festival={target}
        asOf={FESTIVAL_AS_OF}
        onBack={back}
        /* 축제는 점이 아니라 구역에서 열린다 (확정 결정사항 6). 도착지 좌표 하나로 좁힐 수
           없으므로 길찾기가 아니라 그 상점가로 보낸다. 지금 상점가 탭은 현재 상점가 한 곳만
           다루므로(U-ST-01), 다른 상점가면 아직 갈 곳이 없어 안내만 한다. */
        onOpenDistrict={x => x.districtId === CURRENT_DISTRICT_ID
          ? (back(), changeTab("district"))
          : say(`${x.districtName}으로 이동 (상점가 전환은 후속 과제)`)}
        onReport={report} />
    ) : route.name === "facility" ? (
      <FacilityDetail
        facility={target}
        onBack={back}
        onRoute={() => say(`${target.name}까지 도보 길찾기 (S07 길찾기)`)}
        onReport={report}
        onCopied={copied} />
    ) : (
      <StoreDetail
        store={target}
        district={d.district}
        nearby={d.nearby}
        onBack={back}
        onRoute={() => say(`${target.name}까지 도보 길찾기 (S07 길찾기)`)}
        onReport={report}
        /* 인근 편의시설에서 시설 상세로 — 오버레이 위에 오버레이가 아니라 history 를 한 칸 더
           쌓는다. 뒤로가기를 누르면 점포 상세로 돌아온다 (온 길을 되짚는 것이 자연스럽다) */
        onPickFacility={f => go(`#/facility/${f.id}`)}
        onCopied={copied} />
    );

  /* 시트 제목 — 탭마다 다르다. 상점가는 상점가명이 곧 제목이고(U-ST-03), 공공시설은 대상이 여럿이라
     유형을 고른 상태를 제목에 담는다 ("주변 AED"). 지금 무엇을 보고 있는지가 제목에서 읽혀야 한다. */
  const sheetTitle = isFacility
    ? (fcType === "all" ? "주변 공공시설" : `주변 ${FACILITY_LABELS[fcType]}`)
    : isDistrict ? d.district.name : "둘러보기";

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-page)", display: "flex", flexDirection: "column" }}>

      {/* 상단 — z 300. 2차의 언어·음성·글자 크기 버튼 자리는 코드에서만 비워둔다 (화면에 노출하지 않는다).
          오류 신고는 이 화면에 두지 않는다 — 신고 대상이 특정되는 상세 화면(S05 시설, S06 점포)에서 진입한다 */}
      <div style={{ position: "relative", zIndex: "var(--z-filter)", flex: "0 0 auto" }}>
        <AppBar title={isDistrict ? d.district.name : isDiscover ? "둘러보기" : "용인시 위치안내"} />
        {/* U-CM-04 — 사용자가 이동해도 갱신되지 않는 기준점이므로 항상 보이게 둔다.
            탭을 바꿔도 이 줄은 그대로다. 세 탭이 모두 같은 QR 지점을 기준으로 삼기 때문이다.
            조아용은 이 줄에만 등장한다 (기능명세서 5-1 개정).

            둘러보기 탭에서는 [QR 지점으로] 버튼을 내린다 — 그 버튼이 하는 일은 지도 카메라를
            되돌리는 것인데 이 탭에는 지도가 없다. 기준점 표기는 그대로 남는다.
            축제와 상점가의 "12km"가 어디서 잰 거리인지가 여기서만 읽히기 때문이다. */}
        <ContextBar place={d.anchor.name} onReset={isDiscover ? undefined : backToAnchor}
          leading={<Mascot pose="hello" size={38} base="../../design-systems/" alt="" />} />
      </div>

      {/* 지도 영역 — 시트·플로팅·미리보기 카드의 좌표 기준이 되는 컨테이너.
          시트 스냅 %도, 지도 패딩 %도 모두 이 높이 기준이다. 탭이 바뀌어도 이 컨테이너는 그대로다.
          둘러보기 탭에서는 이 안에 지도 대신 정보 패널이 들어간다 (display 로 갈아끼운다). */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

        {/* 지도 인스턴스는 하나뿐이고 탭이 바뀌어도 다시 만들지 않는다 (U-CM-16).
            바뀌는 것은 stores / facilities 배열뿐이다.
            둘러보기에서는 display:none 으로 **감추기만** 한다 — 언마운트하면 되돌아올 때
            지도가 새로 뜨고, 그것이 U-CM-16 이 금지하는 재로딩이다. */}
        <KakaoMap
          style={isDiscover ? { display: "none" } : undefined}
          appKey={KAKAO_APP_KEY}
          center={d.anchor}
          anchorLabel={d.anchor.name}
          level={MAP_LEVEL}
          stores={storeMarkers}
          facilities={facilityMarkers}
          districts={[]}
          selectedId={selected ? selected.id : null}
          topPad={mapPadTop}
          bottomPad={mapPadBottom}
          mapRef={mapApi}
          onSelectStore={pickOnMap}
          /* 편의시설도 같은 미리보기 카드를 쓰되 아이콘 체계는 시설 4종 쪽을 따른다 (5-2).
             biz 자리에 유형 이름을, addr 자리에 상세 위치를 넣는다 — 거리는 카드가 따로 표기한다 */
          onSelectFacility={f => pickOnMap({
            ...f, kind: "facility", biz: FACILITY_LABELS[f.type] || "공공시설", addr: f.detail,
          })}
          /* 상점가 마커도 같은 미리보기 카드를 쓴다. 다만 "길찾기"가 아니라 "이 상점가 보기"다 —
             상점가는 점이 아니라 구역이라 도보 경로의 도착지가 될 수 없다 (확정 결정사항 6). */
          onSelectDistrict={x => pickOnMap({
            ...x, biz: x.festival ? `${x.gu} · ${x.festival.name}` : x.gu,
            addr: `${x.area} · 점포 ${x.stores}곳, 온누리 ${x.onnuri}곳`,
          })}
        />

        {/* 결정 4 — 상단 필터 바 (z 300). 두 탭 모두 여기에 필터를 둔다. 시트가 어디에 있든
            자리가 바뀌지 않는다 (시트가 여기까지 올라오지 못하게 topInset 으로 막는다).
            둘러보기 탭은 필터 축이 없다 (섹션 스크롤 화면이라 지도 위에 아무것도 두지 않는다) */}
        {hasFilterBar ? <MapFilterOverlay onHeightChange={setFilterH} {...filterProps} /> : null}

        {/* 결정 2의 나머지 절반 — 탭한 마커가 무엇이었는지 그 자리에서 읽힌다 */}
        {showPreview ? (
          <MapPreviewCard
            item={selected}
            icon={selected.kind === "facility" ? <FacilityIcon type={selected.type} size={22} />
              : selected.kind === "district" ? <Icon name="store" size={22} /> : undefined}
            bottom={sheetH}
            onHeightChange={setPreviewH}
            onClose={() => { setSelected(null); setPreviewH(0); }}
            routeLabel={selected.kind === "district" ? "상점가 보기" : "길찾기"}
            detailLabel={selected.kind === "district" && selected.festival ? "축제 보기" : "상세 보기"}
            /* 상점가 마커 자체는 갈 곳이 없다 — 상점가는 점이 아니라 구역이라 상세 페이지가
               아니라 탭 전환의 대상이다 (확정 결정사항 6). 다만 축제가 걸려 있으면 S09 로 간다. */
            onDetail={() => selected.kind === "facility" ? go(`#/facility/${selected.id}`)
              : selected.kind === "district"
                ? (selected.festival ? go(`#/festival/${selected.festival.id}`) : say(`${selected.name} 정보 (S03 상점가 탭)`))
                : go(`#/store/${selected.id}`)}
            onRoute={() => say(selected.kind === "district"
              ? `${selected.name}으로 이동 (상점가 탭 전환)`
              : `${selected.name}까지 도보 길찾기 (S07 길찾기)`)} />
        ) : null}

        {/* ── 둘러보기 탭 (S04) — 시트가 아니라 화면 전체를 쓰는 정보 패널 ────────
               고르는 화면이 아니라 훑는 화면이라 시트에 담을 이유가 없다. 시트로 두면
               섹션 네 개를 읽는 내내 화면의 3분의 1이 안 보이는 지도에 묶인다. */}
        {isDiscover ? (
          <DiscoverPanel
            festivals={FESTIVALS}
            newStores={d.newStores}
            popular={d.popular}
            courses={d.courses}
            districts={OTHER_DISTRICTS}
            currentDistrict={currentDistrict}
            onOpenFestival={f => go(`#/festival/${f.id}`)}
            onOpenStore={s => go(`#/store/${s.id}`)}
            onOpenCourse={c => go(`#/course/${c.id}`)}
            onOpenDistrict={x => say(`${x.name}으로 이동 (상점가 탭 전환)`)} />
        ) : null}

        {/* 결정 1 — 3단 스냅. 실측 높이를 위로 올려보내 지도 패딩과 미리보기 카드 앵커가 따라온다.
            U-FC-03 의 "목록과 지도 토글"이 이것이다 — 별도 버튼을 두지 않는다.
            둘러보기 탭에는 시트 자체가 없다. */}
        {isDiscover ? null : <Sheet
          title={sheetTitle}
          snap={snap}
          onSnapChange={setSnap}
          onHeightChange={setSheetH}
          /* 전체 스냅에서는 지도가 완전히 가려지므로 돌아갈 길을 헤더에 명시한다.
             핸들을 아래로 끄는 방법만 남기면 지도로 못 돌아가는 사용자가 생긴다 */
          onClose={snap === "full" ? () => setSnap("half") : undefined}
          closeIcon="map"
          closeLabel="지도"
          topInset={sheetTopInset}
          headerExtra={isFacility
            /* U-FC-02 기준 + U-FC-04 안전시설 개수 — 접힘 상태에서도 보여야 하므로 스크롤 영역 밖 */
            ? <FacilitySummary
                counts={FACILITY_TYPES.reduce((o, t) => ({ ...o, [t]: facilityByType[t].length }), {})}
                style={{ marginTop: "var(--space-1)" }} />
            /* U-ST-02 구역 안내 + U-ST-03 헤더 수치 */
            : isDistrict ? <DistrictSummary district={d.district} style={{ marginTop: "var(--space-1)" }} /> : null}>

          {isFacility ? (
            <FacilitySheet
              rows={facilityRows}
              notices={facilityNotices}
              cat={fcType}
              selectedId={selected ? selected.id : null}
              asOf={FACILITY_AS_OF}
              onPick={f => go(`#/facility/${f.id}`)} />
          ) : isDistrict ? (
            <DistrictSheet
              data={d}
              rows={storeRows}
              cat={cat}
              onnuriOnly={onnuriOnly} setOnnuriOnly={setOnnuriOnly}
              sort={sort} setSort={setSort}
              q={q}
              selectedId={selected ? selected.id : null}
              onPickStore={s => go(`#/store/${s.id}`)}
              onPickFacility={f => go(`#/facility/${f.id}`)}
              onOpenFestival={() => go(`#/festival/${d.festival.id}`)} />
          ) : null}
        </Sheet>}

        {/* 스크린리더용 상태 안내 — 탭과 시트 단계는 시각적으로만 전달되면 안 된다.
            둘러보기에는 시트가 없으므로 단계를 읽지 않는다 (없는 조작을 안내하게 된다) */}
        <span aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {tabOf(tab).label} 탭
          {isFacility ? ` · 목록 시트 ${SNAP_LABEL[snap]} · ${facilityRows.length}곳`
            : isDistrict ? ` · 목록 시트 ${SNAP_LABEL[snap]} · ${storeRows.length}곳`
              : ` · 축제 ${FESTIVALS.length}건, 다른 상점가 ${OTHER_DISTRICTS.length}곳`}
        </span>
      </div>

      {/* 하단 탭바 (U-CM-03) — 지도 영역의 **형제**다. 시트 안이나 위가 아니라 밖에 있으므로
          전체 스냅(100%)에서도 덮이지 않는다. 기능명세서 5-3 #5 의 답.
          U-CM-18 — 진행 중 축제가 있으면 둘러보기 탭에 점을 찍는다 */}
      <TabBar
        items={TABS.map(t => (t.id === "discover" && HAS_LIVE_FESTIVAL ? { ...t, badge: true } : t))}
        value={tab}
        onChange={changeTab} />

      {/* ── 상세 오버레이 (S05 / S06) — z-modal 600 ──────────────────────────
             지도 영역이 아니라 **루트의 자식**이다. 지도 영역 안에 두면 탭바(형제, z 450)를
             덮지 못해 상세 화면 아래에 탭바가 남는다. 상세는 페이지이지 시트가 아니다. */}
      {detail}

      {/* ── 토스트 — 항상 최상단 (z 700) ────────────────────────────────────
             오버레이(z 600)보다 위에 있어야 상세 화면의 "주소를 복사했습니다"가 보인다.
             그래서 지도 영역 안이 아니라 여기, 오버레이 뒤에 둔다 — 지도 영역 안에 있으면
             그 컨테이너가 통째로 오버레이에 덮여 z 700 이 아무 소용이 없다. */}
      {toast ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(var(--tabbar-h) + var(--space-4))",
          zIndex: "var(--z-toast)", display: "flex", justifyContent: "center",
          padding: "0 var(--gutter-screen)", pointerEvents: "none" }}>
          <Toast icon="info">{toast}</Toast>
        </div>
      ) : null}
    </div>
  );
}

export default MainApp;
