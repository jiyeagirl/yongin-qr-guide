import React from "react";
import {
  ContextBar, KakaoMap, MapPreviewCard, MapFilterOverlay, InlineSelect, Sheet, Toast, TabBar, FloatingControls,
  DistrictSummary, FacilitySummary, FacilityIcon, FACILITY_LABELS, FACILITY_TYPES, SAFETY,
  Icon, Mascot, token, VisuallyHidden,
} from "../../design-systems/index.js";
import { DUNJEON } from "./data/dunjeon.js";
import { FACILITIES, RADIUS_STEPS, RADIUS_DEFAULT, NEAR_ENOUGH } from "./data/facilities.js";
import { DISTRICTS, OTHER_DISTRICTS, FESTIVALS, FESTIVALS_OPEN, byFestivalNear,
  CURRENT_FESTIVAL, CURRENT_DISTRICT_ID, DISTRICT_COUNT,
  byDistrictNear, GU_ORDER } from "./data/districts.js";
import { DistrictSheet } from "./DistrictSheet.jsx";
import { FacilitySheet } from "./FacilitySheet.jsx";
import { DiscoverPanel } from "./DiscoverPanel.jsx";
import { DistrictEmpty, NEARBY_DISTRICT_COUNT } from "./DistrictEmpty.jsx";
import { ReportForm } from "../detail/ReportForm.jsx";
import { FacilityDetail } from "../detail/FacilityDetail.jsx";
import { StoreDetail } from "../detail/StoreDetail.jsx";
import { CourseDetail } from "../detail/CourseDetail.jsx";
import { FestivalDetail } from "../detail/FestivalDetail.jsx";
import { FestivalList } from "../detail/FestivalList.jsx";
import { DistrictList } from "../detail/DistrictList.jsx";
import { DistrictSoon } from "../detail/DistrictSoon.jsx";
import { RouteView } from "../detail/RouteView.jsx";
import { useHashRoute, go, replace, back, closeAll } from "./router.js";
import { KAKAO_APP_KEY, MAP_LEVEL, TAB_MAP_LEVEL, FACILITY_AS_OF, STORE_AS_OF,
  DISTRICT_LIST_PAGE_SIZE } from "./config.js";

/* 시민용 모바일 웹의 본 화면 — 지도 1개 + 하단 탭 3개 (기능명세서 v1.1 확정 결정사항 11).
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
 *  3. 플로팅 컨트롤 — 지도 위 버튼은 **[QR 지점으로] 하나뿐**이다 (2026-08-18 개정).
 *     상단 띠에 있던 [지점으로 이동]이 그 띠가 한 줄로 줄면서 여기로 내려왔다.
 *     U-FC-03 의 "목록과 지도 토글"은 여전히 버튼이 아니라 **시트 스냅 자체**가 맡는다.
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

   **둘러보기 탭의 빨간 점을 뺐다** (2026-08-20. 종전 U-CM-18 — 진행 중 축제가 있으면
   아이콘 오른쪽 위에 점을 찍었다). 알림 점은 "네가 아직 안 본 것이 있다"는 신호인데,
   이 서비스에는 본 것과 안 본 것을 가릴 수단이 없다 — 로그인도 저장소도 없어서 둘러보기를
   열어 축제를 다 읽고 나와도 점은 그대로 켜져 있고, 축제 기간 내내 모든 방문자에게 같은
   점이 뜬다. 끌 수 없는 알림은 신호가 아니라 장식이고, 빨간색은 이 화면에서 AED·대피소가
   쓰는 색이라 급하지 않은 것에 쓸 자리가 아니다. 진행 중 축제는 상점가 탭 배너(U-FT-03)와
   둘러보기 탭 첫 섹션이 이미 말한다.

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

/* 시트 스냅 트랜지션(--dur-slow 320ms)이 끝나 시트가 멈출 때까지 — 한 프레임 여유를 둔다.
   시트가 멈춘 **뒤에** 해야 하는 일이 둘이다: 미리보기 카드를 띄우는 것(pickOnMap)과
   가려졌던 마커를 다시 시야로 끌어올리는 것(아래 useEffect). 두 곳이 서로 다른 값을 쓰면
   한쪽은 아직 움직이는 시트를 기준으로 계산하게 되므로 값을 여기 한 곳에 둔다. */
const SHEET_SETTLE = 340;

/* 접수번호 — 서버가 없으므로 여기서 만든다. 실연동 때 서버가 돌려주는 값으로 바뀐다.
   날짜를 넣는 이유: 사용자가 나중에 문의할 때 "언제 신고한 것"인지가 번호만으로 읽혀야 한다. */
function receiptNo(now = new Date()) {
  const p2 = n => String(n).padStart(2, "0");
  const day = `${String(now.getFullYear()).slice(2)}${p2(now.getMonth() + 1)}${p2(now.getDate())}`;
  return `YG-${day}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
}

export function MainApp({ qr = null, noDistrict = false }) {
  /* `nearby`(U-ST-07 주변 공공시설 4줄)가 여기서 합쳐졌다 — 읽는 화면이 없어져 함께
     걷어냈다 (2026-08-24. DistrictSheet 의 해당 자리 주석 · facilities.js 의 U-ST-07 항목).
     축제는 그대로다: 6건이 32개소에 흩어져 있어 `districts.js` 가 소유하고, 여기서
     지금 상점가의 것 하나를 얹는다 (순환 참조를 피하려고 데이터 파일이 아니라 화면이 합친다). */
  const d = React.useMemo(() => ({ ...DUNJEON, festival: CURRENT_FESTIVAL }), []);

  const [tab, setTab] = React.useState("facility");   /* QR 스캔 시 공공시설 탭으로 진입 (U-CM-03) */
  const [snap, setSnap] = React.useState("half");
  const [selected, setSelected] = React.useState(null);   /* 지도에서 탭한 대상 */

  /* 상세 오버레이 (S05 / S06). 아래 상태들과 **별개**로 움직인다 — 오버레이가 열리고 닫혀도
     탭·시트 스냅·필터는 건드리지 않는다. 그게 페이지를 나누지 않은 이유 그 자체다. */
  const route = useHashRoute();

  /* 상점가 탭 필터 (U-ST-10 / 11 / 12 / 15)
     업종 칩은 **여럿 고를 수 있고 빈 배열이 전체**다 (2026-08-20. FilterBar 머리말 참조).
     초기값이 [] 인 것이 곧 "처음에는 전체"다. 2026-08-24 에 [전체] 칩이 돌아왔지만 이 값에
     새 상태를 더하지 않는다 — 그 칩은 이 빈 배열을 보여주고 되돌려 줄 뿐이다. */
  const [cats, setCats] = React.useState([]);
  const [onnuriOnly, setOnnuriOnly] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("distance");

  /* 점포 목록의 쪽 번호 (U-ST-04). **시트가 아니라 셸이 들고 있다** — 쪽을 넘기면 목록을
     맨 위로 되돌려야 하는데 그 스크롤 컨테이너는 Sheet 이고, Sheet 는 scrollKey 로만
     되돌린다. 필터와 쪽을 한 문자열로 묶으려면 둘 다 여기 있어야 한다. */
  const [page, setPage] = React.useState(1);
  /* 조건이 바뀌면 1쪽으로. 12곳짜리 결과에서 3쪽을 보고 있으면 빈 화면이 열린다 */
  React.useEffect(() => { setPage(1); }, [cats, onnuriOnly, q, sort]);

  /* 공공시설 탭 필터 (U-FC-01) — 상점가의 업종 칩과 별개의 상태다.
     하나로 합치면 탭을 오갈 때 "음식"이 "AED"로 둔갑한다.
     여기도 여럿 고르기이고 빈 배열이 전체다 (위 cats 와 같은 규칙) */
  const [fcTypes, setFcTypes] = React.useState([]);

  /* 공공시설 목록의 쪽 번호 (2026-08-20). 점포 쪽 `page` 와 **따로 둔다** — 하나로 합치면
     상점가에서 3쪽을 보다가 공공시설 탭으로 옮겼을 때 있지도 않은 3쪽이 열린다.
     셸이 드는 이유는 점포와 같다 (위 page 주석). */
  const [fcPage, setFcPage] = React.useState(1);

  /* 안내 반경 (U-FC-08). **고정 2km 였던 것을 사용자가 고른다** (2026-08-26, 사용자 요청).
     지도 우측의 세로 고르개가 2 · 3 · 4km 중 하나를 준다 (facilities.js 의 RADIUS_STEPS).
     셸이 드는 이유는 위 둘과 같다 — 목록(시트) · 마커(지도) · 원(지도) 셋이 같은 수를
     봐야 하는데 그 셋의 공통 조상이 여기다. 탭을 옮겨도 고른 값은 남는다: 상점가를
     들렀다 돌아왔다고 4km 가 2km 로 되돌아가면 고른 사람이 그것을 알 방법이 없다. */
  const [radius, setRadius] = React.useState(RADIUS_DEFAULT);

  /* 조건이 바뀌면 1쪽으로. 반경도 같다 — 4km 에서 3쪽을 보다 2km 로 좁히면 그 쪽이 빈다 */
  React.useEffect(() => { setFcPage(1); }, [fcTypes, radius]);

  /* U-FC-09 원거리 안내 말풍선을 닫았는지. **셸이 들고 있어야 한다** —
     그 말풍선을 그리는 FacilitySummary 는 공공시설 탭일 때만 존재해서, 탭을 옮기면
     언마운트되며 닫은 기억이 사라진다. 값은 경고 묶음을 나타내는 문자열이고, 경고가
     달라지면 저절로 다시 열린다 (FacilitySummary 머리말). */
  const [warnDismissed, setWarnDismissed] = React.useState(null);

  /* 상점가 탭 축제 배너(U-FT-03)를 닫았는지. 같은 이유로 셸이 들고 있다 — DistrictSheet 는
     상점가 탭일 때만 존재한다. 값은 닫은 **축제의 id** 다: 축제가 다음 것으로 넘어가면
     다시 보여야 하므로, 기억할 것은 "한 번 닫았다"가 아니라 "이 축제를 닫았다"이다. */
  const [festivalDismissed, setFestivalDismissed] = React.useState(null);

  const [sheetH, setSheetH] = React.useState(0);          /* 시트 실측 높이(px) */
  const [previewH, setPreviewH] = React.useState(0);      /* 미리보기 카드 실측 높이(px) */
  /* [스캔 위치로] 단추의 실측 폭(px). 반경 고르개가 이 값을 제 최소 폭으로 삼아 **두
     알약의 덩어리 크기가 같아진다** — 둘은 화면의 반대쪽 끝(위 필터 바 · 아래 지도)에
     떨어져 서므로 자리로는 묶이지 않고 크기로만 묶인다.
     한쪽만 재면 되는 이유는 **글자가 긴 [스캔 위치로]가 늘 넓기** 때문이다. */
  const [pillW, setPillW] = React.useState(0);
  /* QR 지점 앵커가 지도 칸 밖으로 나갔는가 (`KakaoMap` 의 `onAnchorOffscreen`).
     [스캔 위치로] 단추가 이 값일 때만 뜬다 — 아래 그 단추 주석. */
  const [anchorOff, setAnchorOff] = React.useState(false);
  const [filterH, setFilterH] = React.useState(0);        /* 상단 필터 바 실측 높이(px) */
  const [toast, setToast] = React.useState(null);
  const mapApi = React.useRef(null);
  const toastTimer = React.useRef(null);
  const holdTimer = React.useRef(null);   /* 시트가 내려오기를 기다리는 중인 선택 (pickOnMap) */

  const say = React.useCallback(msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  React.useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(holdTimer.current);
  }, []);

  const isFacility = tab === "facility";
  const isDistrict = tab === "district";
  const isDiscover = tab === "discover";

  /* 현재 상점가 (U-ST-01). null 이면 **두 탭이 함께** 모습을 바꾼다 —
     상점가 탭은 S03-E 안내 상태로(U-ST-16), 둘러보기 탭은 축소 모드로(U-DC-06).
     둘을 따로 판정하지 않는 이유: 같은 사실("가까운 상점가가 없다")에 대한 두 탭의 반응이라
     기준이 갈라지면 한 탭에는 점포가 있고 다른 탭에는 없는 상태가 나온다.

     판정은 화면이 하지 않는다. QR 지점 등록 때 관리자가 지정한 값이고(U-ST-01: "앱에서
     계산하지 않는다"), 여기서는 그 결과를 받기만 한다 — 지금은 진입 게이트(App.jsx)가 넘긴다. */
  const currentDistrict = React.useMemo(
    () => (noDistrict ? null : DISTRICTS.find(x => x.id === CURRENT_DISTRICT_ID) || null), [noDistrict]);
  const hasDistrict = Boolean(currentDistrict);

  /* ── S03 상점가: 필터 + 정렬 ──────────────────────────────────────────
     목록과 지도 마커가 같은 배열을 본다 (U-ST-10/11/12/15 → U-ST-13).
     정렬은 칩·온누리·검색과 독립된 축이라 조합이 가능하다 (예: 음식 칩 + 인기순) */
  const storeRows = React.useMemo(() => {
    const needle = q.trim();
    /* 고른 업종이 없으면 거르지 않는다 = 전체. 여럿 고르면 그중 아무 것에나 걸리면 남는다
       (칩끼리는 OR 다 — 음식과 카페를 함께 고른 사람이 원하는 것은 "둘 다 아닌 곳"이 아니라
       "둘 중 하나인 곳"이다). 온누리·검색은 그대로 AND 로 겹친다. */
    const filtered = d.stores.filter(s =>
      (cats.length === 0 || cats.includes(s.cat)) &&
      (!onnuriOnly || s.onnuri) &&
      (!needle || s.name.includes(needle) || s.biz.includes(needle)));
    return sort === "popular"
      ? [...filtered].sort((a, b) => b.views - a.views || a.dist - b.dist)
      : [...filtered].sort((a, b) => a.dist - b.dist);
  }, [d.stores, cats, onnuriOnly, q, sort]);

  /* ── S02 공공시설: 안내 반경 (U-FC-08) ─────────────────────────────────
     4종이 같은 선을 쓴다 (2026-08-19 통일. 근거는 facilities.js 의 머리말).
     그 선은 이제 **사용자가 고른 값**이다 (2026-08-26) — 고정 2km 이던 시절에는 화면
     어디에도 적지 않는 값이었지만, 고를 수 있게 되면 고르개가 그 수를 적는다.

     반경 안에 하나도 없으면 반경을 무시하고 최근접 2건까지 되살린다 (U-FC-09).
     빈 결과 화면을 만들지 않는 것이 이 규칙의 핵심이고, AED·대피소에 상한을 두지 않던
     이유도 그것이었다 — 보장이 이 한 줄에 있으므로 무제한까지는 필요하지 않다.
     고르개의 하한이 2km 인 것도 이 폴백 때문이다: 더 좁게 열어주면 고른 값과 어긋나는
     목록(반경 밖의 최근접 2건)이 일상이 된다 (facilities.js 의 RADIUS_STEPS 머리말). */
  const facilityByType = React.useMemo(() => {
    const out = {};
    for (const t of FACILITY_TYPES) {
      const all = FACILITIES.filter(f => f.type === t);                 /* 이미 거리순 */
      const within = all.filter(f => f.dist <= radius);
      out[t] = within.length ? within : all.slice(0, 2);                /* U-FC-09 폴백 */
    }
    return out;
  }, [radius]);

  /* 칩 개수는 상한을 적용한 뒤의 개수다 — 칩에 6이라 적고 목록에 5줄이 나오면
     사용자는 한 곳이 사라졌다고 읽는다. 0건인 유형은 FilterBar 가 칩째로 숨긴다 (U-ST-10 과 같은 규칙) */
  /* 여기에 [전체]를 넣지 않는다 — **FilterBar 가 맨 앞에 세운다** (2026-08-24 되살림).
     2026-08-20 에 뺐던 이유는 다섯 알약이 되면 좁은 화면에서 [화장실]이 밀려나는데 밀 수
     있다는 것 자체가 보이지 않는다는 것이었다. 그건 칩 수가 아니라 칩 줄이 끝을 감추는
     방식의 문제였고 거기서 고쳤다 (FilterBar 머리말 ⑴ — 화면 끝까지 흘리고 끝을 흐린다).
     개수도 FilterBar 가 보이는 칩들의 합으로 잰다 — 여기서 총계를 따로 넘기면 0건이라
     숨긴 칩이 총계에만 남아 칩 줄의 합과 어긋난다 */
  const facilityChips = React.useMemo(() =>
    FACILITY_TYPES.map(t => ({ id: t, label: FACILITY_LABELS[t], count: facilityByType[t].length })),
    [facilityByType]);

  const facilityRows = React.useMemo(() => {
    const pick = fcTypes.length ? fcTypes : FACILITY_TYPES;
    return pick.flatMap(t => facilityByType[t]).sort((a, b) => a.dist - b.dist);
  }, [facilityByType, fcTypes]);

  /* U-FC-09 원거리 안내 배너.
     "가깝다"의 선(NEAR_ENOUGH)을 넘는 최근접만 대상이다. 전체 보기에서는 안전시설(AED·대피소·쉼터)만 본다 —
     화장실이 멀다는 것은 배너를 쓸 만큼 급하지 않고, 4종마다 배너가 뜨면 목록보다 배너가 길어진다.
     유형을 하나 고른 상태에서는 그 유형만 본다 (화장실을 골랐으면 화장실이 먼 것도 알려야 한다). */
  const facilityNotices = React.useMemo(() => {
    const watch = fcTypes.length ? fcTypes : SAFETY;
    return watch
      .map(t => facilityByType[t][0])
      .filter(f => f && f.dist > NEAR_ENOUGH)
      .map(f => ({ type: f.type, text: km(f.dist) }));
  }, [facilityByType, fcTypes]);

  /* ── 결정 2: 지도 가림 높이 ────────────────────────────────────
     위는 상단 필터 바, 아래는 시트(+미리보기 카드)가 가린다. 마커는 그 사이 띠의 중앙으로 온다 */
  const gap = React.useMemo(() => parseFloat(token("--map-pad-gap", "24px")) || 24, []);
  /* 둘러보기에는 지도가 없으므로 미리보기 카드도 없다 — 가리킬 마커가 없다.
     `snap !== "full"` 은 이제 뒷받침일 뿐이다: 전체로 올라가는 순간 selected 자체가
     끊기므로(changeSnap) 전체 스냅에서 selected 가 남아 있는 상태는 오지 않는다.
     그래도 남겨둔다 — 스냅과 선택을 잇는 길이 앞으로 하나 더 생겨도 카드가 지도를
     다 덮은 시트 위로 새어나오지는 않게. */
  const showPreview = Boolean(selected) && snap !== "full" && !isDiscover;
  const mapPadBottom = sheetH + (showPreview ? previewH + gap : 0) + gap;

  /* 둘러보기 탭에는 필터 바가 없다 (고르는 화면이 아니라 훑는 화면이다).
     그때 마지막으로 잰 높이를 그대로 쓰면 있지도 않은 바만큼 위를 비워두게 되므로 0 으로 되돌린다. */
  /* 둘러보기(정보 화면)와 S03-E(안내 상태)에는 필터 바가 없다. 걸러낼 목록이 없는 자리에
     검색창과 업종 칩을 남겨두면 "여기서 뭔가 찾을 수 있다"는 신호만 남는다. */
  const hasFilterBar = !isDiscover && !(isDistrict && !hasDistrict);
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
    ? { showSearch: false, chips: facilityChips, cat: fcTypes, onCatChange: setFcTypes,
        filterLabel: "시설 유형 필터",
        /* 칩에서는 색이 선택 상태를 뜻하므로 안전시설 적색 강조를 끈다 (emphasis={false}).
           아이콘 표는 FacilityIcon 한 곳에만 있다 (U-CM-05) */
        renderIcon: c => <FacilityIcon type={c.id} size={15} emphasis={false} />,
        /* ── 안내 반경 고르개 (U-FC-08) ─────────────────────────────────────
              2026-08-26 아침에 **지도 오른쪽 세로 고르개**로 먼저 만들었다가 같은 날
              여기로 내려왔다 (사용자 요청). 세 칸이 각각 손가락 자리를 가지려니 200px
              짜리 기둥이 됐고, 그것이 서 있는 내내 지도 오른쪽이 가려졌다 — **고를 것이
              셋뿐이면 접어 두는 편**이 맞다: 평소에는 지금 값 한 마디만 서 있다.

              **아이콘이 없다** (2026-08-26 오후, 사용자 요청). `circle-dot` 이 서 있었다 —
              가운데 점이 스캔 위치, 두른 원이 반경이라는 그림인데, 그 원이 지도에서
              없어지면서(아래) 가리킬 것이 사라졌고 단추 글자가 이미 「반경」이라고 적는다.

              **고르면 값만 바뀐다 — 카메라는 그 자리에 그대로다** (2026-08-26 오후,
              사용자 요청). 여기서 `fitRadius` 로 축척을 원에 맞췄었다. 근거는 「4km 를
              고른 사람이 반경 500m 짜리 화면을 보고 있으면 곤란하다」였는데, 실제로
              일어난 일은 그 반대였다: **보고 있던 자리가 통째로 작아진다.** 넓히려고
              누른 것이지 멀어지려고 누른 것이 아니라, 사람들은 곧바로 지도를 다시
              확대했다 — 한 번 누를 때마다 두 손동작이 딸려온다.

              넓어졌다는 것은 **목록이 말한다** — 곳수가 늘고 새 마커가 화면 가장자리에
              나타난다. 그것을 보고 더 멀리 보고 싶으면 지도를 줄이면 된다. 화면을
              움직이는 쪽은 사람이다. */
        trailing: (
          <InlineSelect floating icon={null} label="안내 반경"
            /* 아래 [스캔 위치로]의 실측 폭. 둘이 같은 덩어리로 보이게 하는 값이고,
               상수로 박았다가 어긋나 실측으로 바꾼 자리다 (`InlineSelect` 의 그 prop 주석) */
            faceMinWidth={pillW}
            /* `km()` 를 쓰지 않는다 — 그쪽은 「2.0km」로 소수 한 자리를 적는다. 거리를
               **재서 알려주는** 자리라 그 자리가 필요하지만(「1.4km 떨어져 있습니다」),
               여기 셋은 재는 값이 아니라 **고르는 눈금**이라 「2km」가 맞다 */
            value={radius} options={RADIUS_STEPS.map(m => ({ id: m, label: `${m / 1000}km` }))}
            buttonLabel={`반경 ${radius / 1000}km`} menuMinWidth={96}
            onChange={setRadius} />
        ) }
    : { q, onQueryChange: e => setQ(e.target.value), onQueryClear: () => setQ(""),
        chips: d.chips, cat: cats, onCatChange: setCats };

  const focus = React.useCallback((lat, lng) => {
    if (mapApi.current) mapApi.current.focus(lat, lng);
  }, []);

  /* ── 전체 스냅으로 올리면 미리보기 카드를 **감추는 게 아니라 버린다** (2026-08-24) ────
     전에는 showPreview 의 `snap !== "full"` 만으로 감췄다. 그러면 selected 가 그대로 남아,
     전체에서 다시 내려올 때 카드가 되살아난다 — 그 되살아남이 불안정했다:
     카드는 `bottom={sheetH}` 로 시트에 얹혀 있는데, 내려오는 동안 sheetH 는 트랜지션을
     프레임마다 따라 읽는 값이라(Sheet 의 report_ 루프) 카드가 그 뒤를 쫓아 흔들리고,
     동시에 방금 다시 마운트된 카드가 제 높이를 재서 previewH 를 0 → 실측으로 올리면
     지도 패딩까지 한 박자 늦게 따라와 카메라가 한 번 더 움직인다.

     그래서 전체로 올린 시점에 선택을 끊는다. 전체 스냅은 "목록이 화면을 소유하는 상태"이고
     (플로팅 컨트롤도 같은 이유로 그때 사라진다), 지도를 덮어버린 뒤의 선택은 가리킬 마커가
     없는 선택이다. 다시 보고 싶으면 목록 행을 누르면 된다 — 그 행이 곧 마커다(pickOnMap).

     previewH 도 함께 0 으로 되돌린다. 카드를 [x] 로 닫을 때와 같은 처리다 —
     카드가 없는데 그 높이가 남아 있으면 다음 계산의 씨앗이 된다. */
  /* ── 카드를 닫으면 시트가 있던 자리로 돌아간다 (2026-08-26, 사용자 요청) ────────
     카드가 뜰 때 시트를 접힘으로 내리므로(pickOnMap), 내리기 직전의 스냅을 여기 적어
     둔다. 카드의 [x] 를 눌렀을 때만 읽는다 — 목록에서 한 곳을 눌러 본 사람은 **보던
     목록으로 돌아가려는 것**이지 접힌 시트를 원한 것이 아니다.

     담당자가 그 사이에 시트를 직접 끌었으면 지운다 (아래 changeSnap). 그때는 시트의
     자리를 사람이 새로 정한 것이라, 카드를 닫으며 되돌리면 방금 한 일을 취소하는 셈이다. */
  const restoreSnap = React.useRef(null);

  const changeSnap = React.useCallback(next => {
    setSnap(next);
    restoreSnap.current = null;
    /* 기다리는 중인 선택도 함께 버린다 (pickOnMap 의 대기). 그대로 두면 시트를 도로
       올린 뒤에 타이머가 깨어나 전체 스냅에서 selected 가 되살아난다 */
    if (next === "full") { clearTimeout(holdTimer.current); setSelected(null); setPreviewH(0); }
  }, []);

  /* 마커 탭 — 카드를 띄우고 그 마커를 "보이는 지도 영역"의 중앙으로 올린다.
     패딩 계산에는 방금 뜬 카드 높이도 들어가야 하므로 다음 프레임에 focus 한다.

     ── 시트가 내려와야 하면 **내려온 다음에** 띄운다 (2026-08-25, 사용자 요청) ────────
     전체 스냅에서 목록 행을 누르면 시트가 절반으로 내려가는데, 종전에는 그 전에 카드를
     띄웠다. 그래서 카드가 **화면 맨 위에서 나타나 지도를 가로질러 흘러내렸다**:
     카드는 `bottom={sheetH}` 로 시트 위 모서리에 얹혀 있고 sheetH 는 트랜지션이 도는
     동안 프레임마다 갱신되는 값이라(Sheet 의 report_ 루프), 뜨는 순간의 앵커가 "아직
     전체인 시트의 윗변" — 곧 필터 바 바로 아래였다. 카드가 제멋대로 움직인 것이 아니라
     시트를 따라 내려온 것인데, 보는 쪽에는 위에서 떨어지는 한 장으로 보인다.

     그래서 시트가 멈춘 자리에서 뜨게 한다. 늦어지는 320ms 동안 못 보는 것은 없다 —
     전체 스냅은 시트가 지도를 통째로 덮은 상태라 그동안은 카드가 설 자리도, 켜진 마커도
     화면에 없다. 시트가 이미 절반·접힘이면 기다릴 것이 없으므로 종전대로 즉시 뜬다
     (지도 마커를 직접 누르는 경우가 전부 이쪽이다).

     focus 도 함께 미룬다. 카드가 없는 사이에 마커를 잡으면 지도 가림 높이에 카드 높이가
     빠져 있어(mapPadBottom) 곧 뜰 카드 뒤로 마커가 들어간다. */
  /* ── 카드가 뜨면 시트는 **접힘**이다 (2026-08-26, 사용자 요청) ──────────────────
     전에는 전체 스냅에서만 절반으로 내렸다. 그러면 카드가 뜬 화면이 시트 37% + 카드
     + 탭바라 지도가 3분의 1도 남지 않는다 — **지금 무엇을 보고 있는가는 카드가 말하고
     있고**, 그 아래 목록은 방금 그중 하나를 고른 목록이라 지금 읽을 것이 아니다.
     접힘(18%)은 시트 헤더 딱 그만큼이라 「목록이 아래 있다」는 것만 남는다.

     내리기 전 자리를 적어 두고, 카드를 [x] 로 닫을 때 되돌린다 (restoreSnap). */
  const pickOnMap = React.useCallback(item => {
    clearTimeout(holdTimer.current);
    const show = () => {
      setSelected(item);
      requestAnimationFrame(() => requestAnimationFrame(() => focus(item.lat, item.lng)));
    };
    if (snap === "collapsed") { show(); return; }
    restoreSnap.current = snap;
    setSnap("collapsed");
    /* 전체에서 올 때만 기다린다. 카드는 `bottom={sheetH}` 로 시트 윗변에 얹혀 있고
       sheetH 는 트랜지션이 도는 동안 프레임마다 갱신되는 값이라(Sheet 의 report_ 루프),
       전체에서 뜨면 **필터 바 바로 아래에서 나타나 지도를 가로질러 흘러내린다.**
       절반에서 접힘은 그 거리가 카드 한 장 남짓이라 시트와 함께 자리를 잡는 것으로
       보인다 — 거기에 320ms 를 걸면 마커를 눌러도 한참 아무 일이 없는 화면이 된다. */
    if (snap !== "full") { show(); return; }
    holdTimer.current = setTimeout(show, SHEET_SETTLE);
  }, [snap, focus]);

  /* ── 목록 행을 눌러도 마커를 누른 것과 같다 (2026-08-18) ─────────────────────
     전에는 행을 누르면 곧장 상세(S05/S06)로 갔다. 그런데 목록과 지도는 **같은 배열**을
     보고 있고(storeMarkers === storeRows), 목록에서 고른 것이 지도의 어디인지가 목록만
     봐서는 끝내 드러나지 않았다 — 이 서비스가 답하는 질문이 "저기 어디 있나"인데,
     행을 누르면 지도를 지나쳐 상세로 건너뛰었다.

     이제 행을 누르면 그 마커가 켜지고, 지도가 그리로 움직이고, 카드가 뜬다.
     거기서 [길찾기]와 [상세 보기]로 갈라진다 — 마커를 눌렀을 때와 글자 하나까지 같다.
     상세로 가는 길이 한 번 더 눌러야 하는 길이 됐지만, 그 한 번이 **어디인지 보여주는**
     한 번이다. 시트가 전체 스냅이면 절반으로 내려 지도와 카드가 드러난다 (pickOnMap).

     아래 두 어댑터는 목록과 지도가 함께 쓴다. 한쪽에만 두면 같은 것을 눌렀는데 카드에
     적히는 말이 눌린 자리에 따라 달라진다. */
  const pickFacility = React.useCallback(f => pickOnMap({
    /* 편의시설은 미리보기 카드를 쓰되 아이콘 체계는 시설 4종 쪽을 따른다 (5-2).
       biz 자리에 유형 이름을, addr 자리에 위치 문구를 넣는다 — 거리는 카드가 따로 표기한다.
       위치 문구의 출처는 유형마다 다르다 (입력 항목 정의서 2-1~2-4): AED 는 설치 위치,
       대피소는 실제 위치(시설명)가 필수 항목이고, 화장실·쉼터는 그런 항목이 없어 주소다.
       FacilityRow · NearbyFacilities 와 같은 규칙이라 목록·카드·상세가 같은 말을 한다. */
    ...f, kind: "facility", biz: FACILITY_LABELS[f.type] || "공공시설", addr: f.place || f.addr,
  }), [pickOnMap]);

  /* 상점가 마커도 같은 카드를 쓴다. 다만 "길찾기"가 아니라 "이 상점가 보기"다 —
     상점가는 점이 아니라 구역이라 도보 경로의 도착지가 될 수 없다 (확정 결정사항 6). */
  const pickDistrict = React.useCallback(x => pickOnMap({
    /* 축제는 **짧은 이름**으로 적는다 — 카드 한 줄에 구 이름과 함께 서는 자리라
       실제 축제명(최대 24자)이 들어오면 그 줄이 두 줄이 된다 (districts.js 의 short) */
    ...x, biz: x.festival ? `${x.gu} · ${x.festival.short || x.festival.name}` : x.gu,
    addr: `${x.area} · 점포 ${x.stores}곳${x.onnuri != null ? `, 온누리 ${x.onnuri}곳` : ""}`,
  }), [pickOnMap]);

  /* 시트 높이가 바뀌면 선택된 마커를 다시 시야로 끌어올린다 (스냅 이동 후에도 안 가려지게) */
  React.useEffect(() => {
    if (!selected || snap === "full") return;
    const t = setTimeout(() => focus(selected.lat, selected.lng), SHEET_SETTLE);
    return () => clearTimeout(t);
  }, [snap, selected, focus]);

  /* 카드의 [x] — 골라 본 것을 끄고 **시트를 있던 자리로 되돌린다** (2026-08-26).
     목록에서 한 곳을 눌러 본 사람이 카드를 닫는 것은 「그 목록으로 돌아간다」는 뜻이다.
     지도 마커를 직접 누른 사람은 절반에서 왔으므로 절반으로 돌아간다. */
  const closePreview = React.useCallback(() => {
    setSelected(null);
    setPreviewH(0);
    if (restoreSnap.current) { setSnap(restoreSnap.current); restoreSnap.current = null; }
  }, []);

  const backToAnchor = () => {
    setSelected(null);
    restoreSnap.current = null;
    setSnap("collapsed");
    if (mapApi.current) mapApi.current.reset();
    say("QR스캔 위치로 이동했습니다");
  };

  /* ── `showFacilityOnMap` 이 여기 있었다 (2026-08-24 삭제, 사용자 요청) ────────
     시설 한 줄을 누르면 공공시설 탭으로 옮겨 그 마커를 켜던 함수다. 상점가 탭은 점포
     레이어를 갖고 있어 시설 마커를 그릴 수 없어서(U-CM-17: 한 번에 한 레이어), 상세로
     보내는 대신 그 시설이 실제로 그려지는 탭으로 데려가던 길이었다.

     부르는 곳이 하나씩 줄다가 없어졌다. 2026-08-20 에 점포 상세(S06)의 주변 공공시설
     블록이 빠졌고, 2026-08-24 에 상점가 탭 시트의 같은 블록이 빠졌다 (DistrictSheet).
     **시설을 고르는 일은 공공시설 탭 하나가 통째로 맡는다** — 거기에는 유형 칩도
     거리순 목록도 지도 마커도 있고, 이 함수가 하던 일도 결국 "그 탭으로 데려가기"였다.

     같은 목적지가 필요해지면 되살릴 것은 이 함수가 아니라 그 자리의 판단이다:
     탭을 바꾸고(changeTab) · 걸린 유형 칩에 그 유형을 더하고 · pickFacility 로 켜고 ·
     탭이 발밑에서 바뀌었다고 한 줄 말한다. 셋 다 지금도 그대로 있는 조각들이다. */

  /* 둘러보기(S04)의 신규·인기 매장 카드 → **상점가 탭으로 옮겨 지도에서 켠다** (2026-08-18).
     방금 없어진 `showFacilityOnMap`(위)과 같은 규칙이고 이유도 같다 — 이제 이쪽만
     남았다. 둘러보기 탭에는 지도가 없어서
     (CLAUDE.md) 여기서는 켤 마커가 없다 — 점포 마커가 실제로 그려지는 탭으로 데려간다.

     이 카드는 335곳 목록을 우회하는 지름길이다 (U-ST-09). 지름길로 고른 가게가 필터에
     걸려 지도에 없으면 지름길이 아니라 막다른 길이 되므로, **걸린 조건을 푼다.**

     **업종 칩은 더하지 않고 지운다** (2026-08-24 변경, 사용자 요청. 종전에는 그 가게의
     업종을 배열에 더했다). 더하기는 "걸어둔 조건을 아무것도 잃지 않는다"는 이유로 골랐는데,
     실제로 일어나는 일은 **고르지 않은 칩이 저 혼자 켜지는 것**이었다 — 음식만 보고 있다가
     둘러보기에서 미용실 카드를 누르면 돌아온 화면에 미용·생활 칩이 함께 켜져 있고, 목록에는
     한 번도 부른 적 없는 미용실 43곳이 섞여 든다. 조건을 지킨 것이 아니라 **묻지 않고 넓힌
     것**이다. 지우면 돌아온 자리가 늘 같다 — 전체 335곳 위에 그 가게 하나가 켜져 있고,
     조건을 다시 걸 칩 줄은 바로 위 지도에 그대로 있다.

     걸린 칩과 그 가게의 업종이 같을 때도 지운다. "지름길로 왔으면 전체에서 시작한다"가
     한 줄이면, 켜져 있던 칩이 무엇이었는지에 따라 돌아온 화면이 갈리지 않는다.

     온누리와 검색어는 종전 그대로 **걸린 것이 어긋날 때만** 끈다 — 축이 업종과 달라
     지름길과 부딪히는 경우가 아니면 그 자리에 둘 이유가 남는다. 아무것도 안 걸렸으면
     아무것도 건드리지 않는다 — 대개 이 경우다. */
  const showStoreOnMap = s => {
    /* 카드가 들고 있는 것은 note("이번 주 조회 1위")가 붙은 사본이다. 지도와 목록이 보는
       원본을 id 로 되찾는다 — 사본을 그대로 고르면 목록용 문구가 selected 에 딸려 간다 */
    const store = d.stores.find(x => x.id === s.id) || s;
    if (tab !== "district") changeTab("district");
    if (cats.length) setCats([]);
    if (onnuriOnly && !store.onnuri) setOnnuriOnly(false);
    const needle = q.trim();
    if (needle && !(store.name.includes(needle) || store.biz.includes(needle))) setQ("");
    pickOnMap(store);
    /* 점포명을 넣지 않는다. 토스트에 이름까지 넣으면 긴 상호명에서 문장이 두 줄이 되고,
       두 줄짜리 토스트는 아래 탭바까지 덮는다 (Toast 주석). 여기서 답해야 할 것은
       **어느 탭으로 옮겼는가**이고 — 그게 발밑에서 바뀐 것이다 — 무엇이 켜졌는지는
       바로 뜨는 미리보기 카드가 이름으로 말한다.

       **칩을 지웠다는 말도 넣지 않는다.** 넣어 봤더니 "업종 필터를 해제하고 상점가 탭으로
       이동했습니다"가 스물다섯 자라 좁은 화면에서 두 줄이 되는데, 두 줄짜리 토스트는 아래
       탭바를 덮는다 (Toast 머리말 — 문구를 짧게 쓰는 것이 화면 쪽 책임이다). 게다가 이건
       **말로 하지 않아도 보이는 것**이다: 도착한 화면의 지도 위에 칩 줄이 꺼진 채 서 있고,
       목록 머리가 「전체 335곳」이라고 적는다. 두 자리가 이미 말하는 것을 2.2초 뒤에
       사라지는 알림이 한 번 더 적을 이유가 없다. */
    say("상점가 탭으로 이동했습니다");
  };

  /* 탭 전환 (5-3 #6) — 지도는 재로딩하지 않고(U-CM-16) 카메라만 QR 지점 + 탭 기본 줌으로 되돌린다.
     마커 레이어도 함께 갈아끼운다 (U-CM-17: 한 번에 한 레이어만).
     각 탭의 필터 상태는 지우지 않는다 — 상점가에서 "음식 + 온누리"를 걸어두고 공공시설을 잠깐 본 뒤
     돌아왔을 때 조건이 풀려 있으면 다시 걸어야 한다. 지우는 것은 선택과 스냅뿐이다. */
  const changeTab = id => {
    if (id === tab) return;
    setTab(id);
    setSelected(null);
    /* 되돌릴 자리 기억도 함께 버린다 — 저 탭에서 접혔던 사정이 이 탭의 시트에 남으면 안 된다 */
    restoreSnap.current = null;
    setSnap("half");
    if (!mapApi.current) return;
    /* 둘러보기는 지도를 쓰지 않으므로 카메라를 건드리지 않는다. 지도는 감춰진 채
       공공시설·상점가가 마지막으로 두고 간 자리를 그대로 유지하고, 그 탭으로 돌아올 때
       아래 줄이 다시 QR 지점으로 맞춘다. */
    /* **반경은 이 셈에 들어오지 않는다** (2026-08-26 오후, 사용자 요청). 잠깐
       「반경을 넓혀둔 상태면 그 반경에 맞춘다」였다 — 4km 짜리 목록의 뒤쪽이 레벨 4
       에서는 화면 밖이라는 것이 근거였는데, 반경 고르개 자체가 축척을 건드리지 않게
       되면서(위 `trailing`) 이 줄만 남으면 **탭을 다녀오는 것이 축척을 바꾸는 길**이
       된다. 5-3 #6 이 되돌리는 것은 탭마다 정해진 한 자리다. */
    if (id !== "discover") {
      mapApi.current.setView(d.anchor.lat, d.anchor.lng, TAB_MAP_LEVEL[id]);
    }
  };

  /* U-CM-17 — 시설 마커와 점포 마커를 동시에 노출하지 않는다. 탭이 소유한 레이어만 그린다.
     상점가 탭의 "주변 공공시설"은 목록으로만 제공하고 지도에는 찍지 않는다.

     상점가 지점 레이어는 없앴다 — 둘러보기가 지도를 쓰지 않게 되면서 그릴 곳이 사라졌다.
     KakaoMap 의 districts prop 자체는 남겨둔다 (S03-E 의 "근처 가볼만한 상점가"가 쓸 자리다). */
  const storeMarkers = isDistrict && hasDistrict ? storeRows : [];

  /* S03-E 의 "가볼 만한 상점가" 는 목록과 지도가 같은 것을 가리켜야 한다 (U-ST-16).
     시설 마커와 겹치지 않는다 — 상점가 탭이 소유한 레이어이므로 U-CM-17 을 지킨다. */
  const districtMarkers = isDistrict && !hasDistrict
    ? [...OTHER_DISTRICTS].sort((a, b) => a.dist - b.dist).slice(0, NEARBY_DISTRICT_COUNT)
    : [];
  const facilityMarkers = isFacility ? facilityRows : [];

  /* ── 상세 오버레이 (S05 / S06) ────────────────────────────────────────
     route 는 URL 이 진실이다. 여기서 id 로 대상을 찾고, 없으면 셸로 되돌린다 —
     딥링크 오타나 데이터 교체로 빈 화면이 뜨는 상태를 만들지 않는다 (S11 의 축소판). */
  const target = React.useMemo(() => {
    /* 길찾기는 도착지가 시설일 수도 점포일 수도 있다 (#/route/facility/fc-001).
       종류를 URL 에 담아두므로 여기서 어느 목록을 뒤질지가 정해진다 — id 접두사로
       추측하지 않는다. 실데이터의 id 체계가 어떨지는 알 수 없다. */
    /* 오류신고도 같은 형태다 (#/report/facility/fc-001). 다만 대상 없이도 열린다 —
       그때는 id 가 없어 아래에서 null 이 되고, ReportForm 이 대상 없는 폼을 그린다. */
    const twoPart = route.name === "route" || route.name === "report";
    const kind = twoPart ? route.parts[0] : route.name;
    const id = twoPart ? route.parts[1] : route.id;
    if (!id) return null;
    if (kind === "facility") return FACILITIES.find(x => x.id === id) || null;
    if (kind === "store") return d.stores.find(x => x.id === id) || null;
    if (kind === "course") return d.courses.find(x => x.id === id) || null;
    if (kind === "festival") return FESTIVALS.find(x => x.id === id) || null;
    /* 상점가는 32곳 전부에서 찾는다 — 지금 서 있는 곳(둔전)도 S13 목록에는 들어간다 */
    if (kind === "district") return DISTRICTS.find(x => x.id === id) || null;
    return null;
  }, [route, d.stores, d.courses]);

  /* ── 길찾기의 출발지 (2026-08-18 · 08-19 고를 수 있게 바뀜) ─────────────────
     기본은 QR 스캔 지점이다 (제안서 3-1 — 화면의 "내 위치"는 언제나 그 고정 좌표다).
     골목 한바퀴에서 들어오면 코스 순서상 직전 가게가 기본값이 된다 — 코스를 도는 사람은
     이미 그 앞에 서 있고, 거기서 QR 지점으로 되돌아갔다가 다시 나오지 않는다.

     **기본값일 뿐 확정이 아니다** (2026-08-19). 사용자가 S07 에서 바꿀 수 있다.
     ②를 건너뛰고 ③ 앞에 서 있는 사람에게 "②에서 출발"이라고 말하던 자리였다.

     URL 이 진실이라는 규칙은 여기서도 같다 — 출발지 id 를 해시에 담는다
     (#/route/store/dj-042/dj-041). 화면 상태에 두면 새로고침이나 딥링크에서 사라진다.

     ── 상세 화면도 출발지를 물고 다닌다 (2026-08-24) ─────────────────────────
     코스 카드의 [상세 보기]로 들어간 점포 상세에서 [길찾기]를 누르면 QR 지점에서
     출발했다. 코스 안에서 같은 곳으로 가는 길인데 **상세를 한 번 거쳤다는 이유만으로**
     출발지가 달라진 것이다 — ① 앞에 선 사람에게 QR 지점으로 되돌아갔다 다시 나오라고
     안내하는 셈이고, 그건 [길찾기]를 바로 누를 때 이미 하지 않기로 한 안내다.

     상세는 코스를 떠나는 화면이 아니라 거쳐 가는 화면이므로, 해시에 조각 하나를 더 달아
     그대로 물려준다 (#/store/dj-042/**dj-041**). 상태로 들지 않는 이유는 위와 같다 —
     상세에서 새로고침해도, 그 주소를 그대로 열어도 출발지가 남는다. 대상을 찾는 쪽은
     첫 조각만 보므로(target) 이 조각이 늘어도 아무 화면이 달라지지 않는다.

     조각 자리가 길찾기만 하나 뒤다 — 거기만 도착지 종류가 앞에 붙기 때문이다
     (#/route/ store /dj-042/dj-041 — 가운데 한 칸이 그것이다. router 머리말). 두 자리를 여기서 함께 읽어,
     쓰는 쪽(originStop · goRoute · onOpenDest)이 경로 모양을 다시 알 필요가 없게 한다.
     오류신고(#/report/store/dj-042)는 뺀다 — 같은 자리에 도착지 id 가 들어 있어 그대로
     읽으면 자기 자신이 출발지가 된다. 신고 화면은 출발지를 쓰지도 않는다. */
  const carriedOrigin = React.useMemo(() => {
    const id = route.name === "route" ? route.parts[2]
      : (route.name === "store" || route.name === "facility") ? route.parts[1]
      : null;
    /* 출발지 후보는 언제나 코스의 가게다 (routeOrigins 주석 — 그 밖에는 이름 댈 자리가 없다).
       없는 id 면 null 이 되고, 그때 출발지는 조용히 QR 지점으로 돌아간다 */
    return id ? (d.stores.find(x => x.id === id) || null) : null;
  }, [route, d.stores]);

  const originStop = route.name === "route" ? carriedOrigin : null;

  /* 고를 수 있는 출발지 = **QR 지점 + 같은 코스의 다른 지점들.**

     후보를 코스로 좁히는 이유는 그 밖에 우리가 이름 댈 수 있는 자리가 없어서다. 주소 검색은
     이 서비스가 갖지 않기로 한 기능이고(제안서 3-1), 점포 335곳을 드롭다운에 넣으면 고르는
     일이 걷는 일보다 오래 걸린다. 코스의 네 곳은 사용자가 방금 그 목록을 보고 들어왔다는
     점에서 "지금 서 있을 법한 자리"의 근거가 있는 유일한 묶음이다.

     어느 코스인지는 **도착지로 찾고**, 도착지가 어느 코스에도 없으면(공공시설로 가는 길
     같은 경우) 지금 출발지로 한 번 더 찾는다 — 코스를 돌다 AED 를 찾는 흐름이 그렇다.
     둘 다 아니면 후보가 QR 지점 하나뿐이고, 그때 RouteView 는 드롭다운을 그리지 않는다. */
  const routeOrigins = React.useMemo(() => {
    if (route.name !== "route" || !target) return [];
    const inCourse = c => (c.stops || []).some(s => s.id === target.id);
    const hasOrigin = c => originStop && (c.stops || []).some(s => s.id === originStop.id);
    const course = (d.courses || []).find(inCourse) || (d.courses || []).find(hasOrigin);
    const stops = course ? course.stops.filter(s => s.id !== target.id) : [];
    return [d.anchor, ...stops];
  }, [route.name, target, originStop, d.courses, d.anchor]);

  /* 출발지를 바꾸면 해시의 마지막 조각만 갈아 끼운다. **history 에 쌓지 않는다** —
     쌓으면 출발지를 세 번 바꿔본 사람이 도착지 상세로 돌아가려고 뒤로가기를 세 번 눌러야
     한다. 되돌아갈 자리는 이전 출발지가 아니라 길찾기에 들어오기 전이다 (router 의 replace). */
  const setRouteOrigin = React.useCallback(id => {
    const kind = route.parts[0];
    const destId = route.parts[1];
    if (!kind || !destId) return;
    replace(`#/route/${kind}/${encodeURIComponent(destId)}${id ? `/${encodeURIComponent(id)}` : ""}`);
  }, [route.parts]);

  /* 길찾기로 보내는 길은 여기 하나다 (U-FC-07 / U-ST-05 → U-NV-01).
     시설 상세·점포 상세·지도 미리보기 카드가 모두 이 함수를 부른다 — 세 곳이 각자 해시를
     조립하면 한 곳만 형식이 어긋났을 때 그 진입점만 조용히 셸로 떨어진다. */
  /* 지금 화면이 물고 있는 출발지가 있으면 그대로 넘긴다 (2026-08-24. 위 carriedOrigin 주석).
     코스에서 상세로 들어온 점포·시설이 그 경우다 — 셸의 미리보기 카드에서 부를 때는
     해시가 `#/` 라 물고 있는 것이 없고, 지금까지처럼 QR 지점에서 출발한다. */
  const goRoute = React.useCallback(item => {
    const kind = item.type && FACILITY_LABELS[item.type] ? "facility" : "store";
    const from = carriedOrigin && carriedOrigin.id !== item.id ? carriedOrigin : null;
    go(`#/route/${kind}/${encodeURIComponent(item.id)}${from ? `/${encodeURIComponent(from.id)}` : ""}`);
  }, [carriedOrigin]);

  /* 대상 없는 오류신고(#/report)는 정상이므로 되돌리지 않는다. 대상을 달고 왔는데
     못 찾은 경우(#/report/facility/없는id)는 다른 상세와 똑같이 되돌린다 —
     엉뚱한 곳을 신고하게 두는 것이 빈 화면보다 나쁘다. */
  /* S12 축제 · S13 상점가 전체보기는 목록 화면이라 대상이 없다 — 되돌리지 않는다 */
  const needsTarget = route.name !== "main" && route.name !== "festivals" && route.name !== "districts"
    && (route.name !== "report" || route.parts.length > 0);

  React.useEffect(() => {
    if (needsTarget && !target) {
      say("정보를 찾을 수 없습니다");
      back();
    }
  }, [needsTarget, target, say]);

  /* 상세에서 지도로 돌아가는 길은 **뒤로가기 하나로 통일한다.**
     [지도에서 보기] 버튼을 뒀다가 뺐다 — 상단에 뒤로가기, 하단에 길찾기가 이미 있어
     지도로 가는 길이 셋이 됐다. 게다가 그 버튼은 탭을 옮기고 필터까지 풀어야 마커가
     보이는 동작이라, 사용자가 걸어둔 조건을 상세 화면이 조용히 건드리는 셈이었다.
     뒤로가기는 떠날 때 모습 그대로 돌아온다 — 그게 오버레이 구조를 택한 이유다. */
  /* 오류신고로 보내는 길 (U-CM-10). 대상 종류를 해시에 실어야 ReportForm 이 아이콘을
     고를 수 있고, 새로고침해도 대상이 남는다.

     **부르는 곳이 셋으로 줄었다** (2026-08-19) — 시설 상세 · 점포 상세 · 길찾기다.
     축제 상세와 코스 상세에서 뺐다. 신고할 대상을 실어 보낼 수 없어 대상 칸이 빈 폼이
     열렸는데, U-CM-10 이 받는 것은 시설과 점포의 정보다 (각 화면의 주석 참조).
     대상 없는 폼(#/report)은 그대로 둔다 — 어디에도 링크가 없지만 ReportForm 이 그
     상태를 그릴 줄 알고, 검수 경로로 README 에 적혀 있다. */
  const goReport = React.useCallback(item => {
    if (!item) { go("#/report"); return; }
    const kind = item.type && FACILITY_LABELS[item.type] ? "facility" : "store";
    go(`#/report/${kind}/${encodeURIComponent(item.id)}`);
  }, []);
  const copied = ok => say(ok ? "주소를 복사했습니다" : "복사에 실패했습니다. 주소를 길게 눌러 선택해 주세요");

  /* 접수 결과. 오버레이 안이 아니라 셸이 들고 있다 — ReportForm 이 스스로 갖고 있으면
     실연동(서버 왕복) 때 그 컴포넌트가 통신까지 맡게 된다. 지금 서버 자리를 대신하는 것은
     아래 setTimeout 하나이고, 실연동 때 바뀌는 것도 그 한 줄이다. */
  const [receipt, setReceipt] = React.useState(null);

  /* 신고 화면을 벗어나면 접수 결과를 비운다. 남겨두면 다음에 신고 화면을 열었을 때
     폼 대신 지난번 완료 화면이 뜬다. */
  React.useEffect(() => {
    if (route.name !== "report") setReceipt(null);
  }, [route.name]);

  const submitReport = React.useCallback(form => {
    setTimeout(() => setReceipt({ ...form, no: receiptNo() }), 420);
  }, []);

  const detail = route.name === "report" ? (
    <ReportForm
      target={target}
      targetKind={route.parts[0] || null}
      receipt={receipt}
      onBack={back}
      onSubmit={submitReport} />

  /* ── S12 축제 전체보기 ─────────────────────────────────────────────────
         둘러보기 탭은 진행중·예정만 보여주고, 종료를 포함한 전체는 여기서 다룬다.
         정렬 비교 함수를 데이터 쪽에서 그대로 넘긴다 — 화면이 다시 짜면 둘러보기 탭의
         기본 순서와 여기 "임박순"이 조용히 어긋난다.

         **아래 `!target` 검사보다 위에 있어야 한다.** 이 화면은 목록이라 대상이 없어서
         (`#/festivals` 에는 id 가 없다) 그 아래에 두면 항상 null 로 떨어진다. */
  ) : route.name === "festivals" ? (
    <FestivalList
      festivals={FESTIVALS}
      sortNear={byFestivalNear}
      onOpen={f => go(`#/festival/${f.id}`)}
      onBack={back} />

  /* ── S13 상점가 전체보기 ───────────────────────────────────────────────
         둘러보기 탭 최하단의 같은 목록은 8곳씩 끊어 붙이는데, 32곳을 훑으려면 그 접기가
         오히려 방해가 된다. 여기서는 전부 깔고 구(區) 칩으로 좁힌다.

         **현재 상점가를 포함한 32곳 전부**를 넘긴다. 둘러보기 탭에는 `OTHER_DISTRICTS`(32곳)를
         주지만 — 지금 서 있는 곳은 "다른 상점가"가 아니다 — 이 화면의 제목은 "용인시 골목형
         상점가 정보"이고 구 칩이 개수를 적는다. 한 곳을 빼면 세는 사람에게 수가 맞지 않는다.

         S12 와 같은 이유로 아래 `!target` 검사보다 위에 있어야 한다. */
  ) : route.name === "districts" ? (
    <DistrictList
      districts={DISTRICTS}
      guOrder={GU_ORDER}
      sortNear={byDistrictNear}
      pageSize={DISTRICT_LIST_PAGE_SIZE}
      onBack={back}
      onOpenDistrict={x => go(`#/district/${encodeURIComponent(x.id)}`)} />

  /* 여기서부터는 전부 대상 하나를 여는 화면이다 — 대상이 없으면 그릴 것이 없다.
     대상 없이 여는 화면을 새로 붙일 때는 이 줄 **위**에 둔다 (needsTarget 도 함께). */
  ) : !target ? null
    /* ── S07 길찾기 ────────────────────────────────────────────────────
           도착지 상세(S05/S06) 위에 한 칸 더 쌓인다. 뒤로가기를 누르면 그 상세로 돌아온다 —
           길을 확인하고 "여기가 어디였더라" 하며 되짚는 것이 자연스러운 순서다.
           출발지는 URL 이 정한다 — QR 지점이거나, 코스에서 들어왔다면 직전 순번의 가게다.
           그것을 **기본값으로 두고 사용자가 바꿀 수 있다** (위 routeOrigins 주석). */
    : route.name === "route" ? (
      <RouteView
        dest={target}
        origin={originStop || d.anchor}
        fromAnchor={!originStop}
        origins={routeOrigins}
        onOriginChange={setRouteOrigin}
        onBack={back}
        onClose={closeAll}
        /* 도착지 상세로 갈 때도 출발지를 물려준다 — 거기서 [길찾기]로 돌아오면
           같은 출발지여야 한다. 사용자가 여기서 바꾼 값이면 바꾼 그대로다. */
        onOpenDest={() => go(`#/${route.parts[0]}/${encodeURIComponent(target.id)}`
          + (originStop ? `/${encodeURIComponent(originStop.id)}` : ""))}
        onReport={() => goReport(target)} />
    ) : route.name === "course" ? (
      <CourseDetail
        course={target}
        anchor={d.anchor}
        /* 기준일자를 넘기지 않고 있었다 (2026-08-19 고침) — 코스 화면 맨 아래가
           "점포 정보 undefined 기준"으로 나갔다. 코스는 점포 데이터로 만들어지므로
           시트·점포 상세와 같은 값을 본다 */
        asOf={STORE_AS_OF}
        onBack={back}
        /* 코스 안의 가게에서 점포 상세·길찾기로 — history 를 한 칸 더 쌓는다.
           뒤로가기를 누르면 코스로 돌아온다. 다만 그때 고른 순번은 남지 않는다 —
           이 오버레이는 route 가 갈리면 언마운트되기 때문이다. 지도는 코스 전체로
           다시 맞춰지고, 방문 기록만 세션에 남는다 (data/courseVisits.js). */
        /* 상세로 갈 때도 출발지를 해시에 실어 보낸다 (#/store/dj-042/dj-041, 2026-08-24) —
           거기서 [길찾기]를 눌러도 코스 순서대로 안내된다 (위 carriedOrigin 주석) */
        onPickStore={(s, from) => go(`#/store/${s.id}${from ? `/${from.id}` : ""}`)}
        /* 출발지는 코스 순서상 직전 가게다. 첫 곳(from 없음)만 QR 지점에서 출발한다 */
        onRouteStore={(s, from) => go(`#/route/store/${s.id}${from ? `/${from.id}` : ""}`)} />
    ) : route.name === "festival" ? (
      <FestivalDetail
        festival={target}
        onBack={back}
        /* 「상권명」줄에 안내 주소가 없을 때만 쓰인다 (2026-08-24) */
        onOpenDistrict={f => go(`#/district/${encodeURIComponent(f.districtId)}`)} />

    /* ── S13-S 상점가 상세 안내 준비 중 ──────────────────────────────────
           상점가 줄의 [상세 페이지]는 보통 용인시 누리집으로 **나간다**. 여기로 오는
           것은 그 주소가 아직 없는 곳뿐이다 (관리자의 링크 칸이 비어 있는 경우).
           목록에서 그 줄만 갈 곳 없는 줄로 두지 않기 위한 화면이다. */
    ) : route.name === "district" ? (
      <DistrictSoon
        district={target}
        onBack={back}
        onClose={closeAll}
        /* 뒤로가 아니라 **옆으로** 나가는 길이다. 여기까지 온 사람이 보려던 것은 이
           상점가이고, 그 다음으로 볼 만한 것은 나머지 서른한 곳이다.
           `go` 가 아니라 `replace` 인 이유: 한 칸을 더 쌓으면 뒤로가기가 방금 나온
           안내를 다시 연다 — 되돌아갈 자리는 여기 들어오기 전이지 이 안내가 아니다. */
        onGoDistricts={() => replace("#/districts")} />

    ) : route.name === "facility" ? (
      <FacilityDetail
        facility={target}
        onBack={back}
        onRoute={() => goRoute(target)}
        onReport={() => goReport(target)}
        onCopied={copied} />
    ) : (
      /* 주변 공공시설을 넘기지 않는다 (2026-08-20). 점포 상세에서 그 블록을 뺐다 —
         이유는 StoreDetail 머리말. 상점가 탭 하단(DistrictSheet)에 같은 블록이
         남아 있었는데 그것도 2026-08-24 에 뺐다 — **이제 시민용 화면에서 시설을
         고르는 자리는 공공시설 탭 하나뿐이다** (U-ST-07 은 화면에서 사라졌다). */
      <StoreDetail
        store={target}
        district={d.district}
        onBack={back}
        onRoute={() => goRoute(target)}
        onReport={() => goReport(target)}
        onCopied={copied} />
    );

  /* 시트 제목 — 탭마다 다르다. 상점가는 상점가명이 곧 제목이고(U-ST-03), 공공시설은 대상이 여럿이라
     유형을 고른 상태를 제목에 담는다 ("주변 AED"). 지금 무엇을 보고 있는지가 제목에서 읽혀야 한다. */
  /* 여럿 고르기가 되면서 "고른 상태"가 한 낱말로 떨어지지 않는다 (2026-08-20).
     아무것도 안 골랐거나 네 종을 다 골랐으면 같은 목록이므로 같은 제목("주변 공공시설")이고,
     그 사이는 고른 것을 그대로 잇는다 — 유형 이름이 짧아서(AED·화장실·쉼터·대피소) 셋까지는
     제목 한 줄에 들어간다. "3종"처럼 세어 적지 않는 이유는, 무엇을 골랐는지가 지금 목록에
     무엇이 들어 있는지와 같은 말이기 때문이다.

     **가운뎃점 앞뒤를 띄운다** (2026-08-20). 붙여 쓰면("대피소·쉼터·화장실") 19px 굵은
     제목에서 세 낱말이 한 덩어리로 뭉쳐 하나의 긴 이름처럼 읽힌다. 이 화면의 다른 자리도
     전부 띄어 쓴다 — "둔전골목형상점가 · 지금 계신 곳", "10.17 (금) · 15:00~21:00". */
  const sheetTitle = isFacility
    ? (fcTypes.length === 0 || fcTypes.length === FACILITY_TYPES.length
        ? "주변 공공시설"
        : `주변 ${FACILITY_TYPES.filter(t => fcTypes.includes(t)).map(t => FACILITY_LABELS[t]).join(" · ")}`)
    : isDistrict ? (hasDistrict ? d.district.name : "상점가") : "둘러보기";

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-page)", display: "flex", flexDirection: "column" }}>

      {/* 상단 — z 300. 얇은 띠 한 줄뿐이다 (2026-08-18 개정).
          앱바("지금 계신 곳 / 둔전 시장 입구 버스정류장")를 없앴다. 앱바 62px + 띠 22px 로
          상단이 80px 을 넘게 먹고 있었는데, 그 아래가 지도라 화면에서 가장 비싼 자리다.
          지도를 화면 맨 위까지 끌어올린다.

          **지점명은 이 띠가 그대로 이어받는다** (U-CM-04 상시 노출). 화면의 모든 거리
          표기가 이 한 점에 매달려 있어, 이름이 사라지면 "320m"가 어디서 잰 값인지 알 수 없다.
          조아용도 이 줄에 남는다 (기능명세서 5-1).

          **셋째 탭에도 둔다.** 이전에는 앱바가 지점명을 맡아 여기서 뺐지만, 이제 이 줄이
          유일한 자리다 — 둘러보기의 축제·상점가 "12km"가 어디서 잰 거리인지도 여기서만 읽힌다.

          2차의 언어·음성·글자 크기 버튼 자리는 코드에서만 비워둔다 (화면에 노출하지 않는다).
          오류 신고는 이 화면에 두지 않는다 — 신고 대상이 특정되는 상세 화면에서 진입한다 */}
      <div style={{ position: "relative", zIndex: "var(--z-filter)", flex: "0 0 auto" }}>
        <ContextBar place={qr ? qr.name : d.anchor.name}
          leading={<Mascot pose="hello" size={22} base="../../design-systems/" alt="" />} />
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
          /* 안내 반경 원은 넘기지 않는다 — 그리는 쪽도 함께 없어졌다 (2026-08-26 오후,
             사용자 요청. `KakaoMap` 의 지운 자리 주석). 공공시설 탭에 점선 원을 그렸었다:
             고른 반경이 지도에서 얼마나 넓은 자리인지 보여주려던 것인데, 그 원이 화면에
             다 들어오게 하려면 축척을 원에 맞춰야 하고 그것이 「누를 때마다 지도가
             작아진다」의 원인이었다 (위 `trailing`). 축척을 그대로 두면 3·4km 짜리 원은
             대개 화면 밖이라, 원만 남기면 **가장자리에 걸친 호(弧) 한 조각**이 된다 —
             무엇의 일부인지 알 수 없는 선이다. 반경이 하는 일은 목록의 곳수를 정하는
             것이고, 그것은 목록이 적는다. */
          level={MAP_LEVEL}
          stores={storeMarkers}
          facilities={facilityMarkers}
          districts={districtMarkers}
          selectedId={selected ? selected.id : null}
          /* 앵커가 지도 칸을 벗어났는지. [스캔 위치로]가 이 값일 때만 뜬다 */
          onAnchorOffscreen={setAnchorOff}
          topPad={mapPadTop}
          bottomPad={mapPadBottom}
          mapRef={mapApi}
          /* 목록 행도 같은 셋을 부른다 (위 pickFacility·pickDistrict 주석) */
          onSelectStore={pickOnMap}
          onSelectFacility={pickFacility}
          onSelectDistrict={pickDistrict}
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
            onClose={closePreview}
            routeLabel={selected.kind === "district" ? "상점가 보기" : "길찾기"}
            detailLabel={selected.kind === "district" && selected.festival ? "축제 보기" : "상세 보기"}
            /* 상점가 마커 자체는 갈 곳이 없다 — 상점가는 점이 아니라 구역이라 상세 페이지가
               아니라 탭 전환의 대상이다 (확정 결정사항 6). 다만 축제가 걸려 있으면 S09 로 간다. */
            onDetail={() => selected.kind === "facility" ? go(`#/facility/${selected.id}`)
              : selected.kind === "district"
                /* 상점가명을 문장에 넣지 않는다 — 카드가 바로 위에서 이름을 말하고 있고,
                   "광교상현역 온누리 골목형상점가" 같은 이름이 들어가면 두 줄이 된다 */
                ? (selected.festival ? go(`#/festival/${selected.festival.id}`) : say("상점가 정보는 준비 중입니다"))
                : go(`#/store/${selected.id}`)}
            /* 상점가는 점이 아니라 구역이라 도보 경로의 도착지가 될 수 없다 (확정 결정사항 6).
               나머지 둘(점포·시설)은 미리보기 카드에서 상세를 거치지 않고 바로 길찾기로 간다 —
               지도에서 핀을 찍은 사람이 원하는 것은 대개 "저기까지 어떻게 가나"다. */
            onRoute={() => selected.kind === "district"
              ? say("상점가는 길찾기 도착지가 아닙니다")
              : goRoute(selected)} />
        ) : null}

        {/* ── QR 지점으로 되돌리는 버튼 (5-3 #3 플로팅 컨트롤) ────────────────
               상단 띠에 있던 [지점으로 이동]이 여기로 내려왔다. 지도를 끌어 움직인 뒤에
               되돌리고 싶어지는 자리는 지도 위이지 화면 맨 위가 아니다.

               시트 상단 모서리에 앵커링해 함께 움직인다 — 화면 하단에 고정하면 시트가
               올라올 때 시트 뒤로 사라진다. 미리보기 카드가 떠 있으면 그 높이까지 얹어
               카드 위로 비켜선다(카드는 전체 폭이라 나란히 설 수 없다).
               전체 스냅에서는 감춘다: 그때는 시트가 화면을 소유한다.

               버튼은 이것 하나뿐이다. U-FC-03 의 "목록과 지도 토글"은 시트 스냅 자체가 맡으므로
               같은 일을 하는 버튼을 하나 더 두지 않는다 (5-3 결정 3). */}
        {isDiscover ? null : (
          <FloatingControls
            /* ── 자리는 **지도 우측 하단**이다 (5-3 결정 3) ──────────────────────
                  「지도를 끌어 움직인 뒤에 되돌리고 싶어지는 자리는 지도 위이지 화면 맨
                  위가 아니다.」 시트 윗변에 앵커링해 함께 움직인다.

                  2026-08-26 에 이것을 **반경 고르개 바로 아래로 올렸다가 같은 날 되돌렸다**
                  (사용자 요청). 올린 근거는 「닮게 만들었으면 붙여야 한다」였는데 —
                  둘이 같은 알약이 되고 나니 멀리 떨어져 선 것이 어색해 보였다 — 붙여
                  놓고 보니 **화면 오른쪽 위가 검색창·칩 줄·고르개·단추로 넉 줄이 됐다.**
                  지도를 보라고 만든 화면에서 위쪽이 통째로 막히는 것이 v1.11 이 내내
                  고쳐 온 바로 그 문제다. 통일감은 **자리가 아니라 모양이 낸다** —
                  둘은 이제 높이도 폭도 같고(아래), 그거면 멀리 있어도 한 벌로 읽힌다.
                  `FloatingControls` 의 `place="top"` 은 손님이 없어져 함께 지웠다. */
            bottom={sheetH + (showPreview ? previewH + gap : 0)}
            /* 시트에게 넘기는 것과 **같은 실측값**이다 — 막지 않으면 시트를 끝까지 올렸을
               때 기둥 윗머리가 상단 필터 바 위로 올라선다 (단추가 z 400, 필터가 z 300) */
            topInset={sheetTopInset}
            /* ── **앵커를 놓쳤을 때만 뜬다** (2026-08-26, 사용자 요청) ────────────────
                  이 단추가 하는 일은 지도를 QR 지점으로 되돌리는 것 하나뿐이다. 그러니
                  **지점이 화면에 보이는 동안에는 눌러도 아무 일이 일어나지 않는다** —
                  그동안은 지도를 가리기만 하는 알약이고, 진입 직후의 화면이 바로 그
                  상태다(카메라가 앵커에 맞춰 서 있다). 처음 보는 화면에서 아무 일도
                  하지 않는 단추가 먼저 눈에 드는 것이 이 화면의 마지막 군더더기였다.

                  전체 스냅에서 감추는 것은 그대로다 — 시트가 지도를 다 덮은 상태라
                  역시 할 일이 없다. 두 조건은 **같은 이야기의 두 경우**다.

                  `hidden` 은 언마운트가 아니라 `opacity` + `pointer-events` 라
                  (`FloatingControls`) 뜨고 사라지는 것이 보이고, 감춰져 있는 동안에도
                  자리를 차지하므로 **재둔 폭(`onWidthChange`)이 살아 있다** — 반경
                  고르개가 그 값으로 제 폭을 맞추는데 단추가 없어지면 함께 무너진다. */
            hidden={snap === "full" || !anchorOff}
            /* ── 반경 고르개와 **같은 알약** (2026-08-26 오후, 사용자 요청) ─────────
                  이 단추와 위 안내 반경 고르개는 같은 지도 위에 함께 떠 있는 둘인데
                  **서로 다른 부품처럼 보였다** — 한쪽은 34px 알약에 13px 글자, 이쪽은
                  48×44 둥근 네모에 아이콘을 이고 선 12px 글자였다. `subtle` 이 이제
                  `InlineSelect.floating` 과 같은 값을 쓴다 (34px · 알약 · .82 + 흐림 ·
                  같은 테두리·그림자·글자색).

                  같은 날 아침에 「스캔 위치로」를 옆에 붙였다가 알약이 120px 을 넘어
                  지도 오른쪽 아래를 덮은 적이 있어 세로로 쌓았었는데, 글자를
                  `--fs-micro`(12px) 로 두고 아이콘을 14px 로 줄이니 **옆에 붙여도 100px
                  남짓**이다. 높이가 48 에서 34 로 내려간 만큼을 폭으로 돌려준 셈이고,
                  그 값에서는 **둘이 같은 것으로 읽히는 편**이 낫다.

                  **폭도 같다** — 둘이 화면의 다른 자리에 떨어져 서므로 높이만 같아서는
                  한 벌로 읽히지 않는다. 나란히 놓으면 오른쪽 끝만 맞춰도 같아 보이지만,
                  떨어져 있으면 **각자의 덩어리 크기**가 유일한 단서다. 맞추는 방향은
                  **이쪽 → 고르개**다 (`onWidthChange` → `faceMinWidth`): 글자가 긴 이쪽이
                  늘 넓으므로 이 단추는 제 폭 그대로이고 고르개가 따라온다.

                  글자를 다시 떼지는 않는다 — 그림 하나로는 어디로 가는 단추인지 배워야
                  알기 때문에 붙인 글자다 (v1.9). 손가락 자리도 44px 그대로다. */
            subtle
            /* 잰 폭을 위 반경 고르개가 받아 간다 (위 주석) */
            onWidthChange={setPillW}
            items={[{ icon: "qr-code", label: "스캔 위치로", text: "스캔 위치로", onClick: backToAnchor }]} />
        )}

        {/* ── 둘러보기 탭 (S04) — 시트가 아니라 화면 전체를 쓰는 정보 패널 ────────
               고르는 화면이 아니라 훑는 화면이라 시트에 담을 이유가 없다. 시트로 두면
               섹션 네 개를 읽는 내내 화면의 3분의 1이 안 보이는 지도에 묶인다. */}
        {isDiscover ? (
          <DiscoverPanel
            /* 기본 뷰는 진행중·예정만이다. 종료를 포함한 전체는 [전체보기] → S12 가 맡는다 */
            festivals={FESTIVALS_OPEN}
            onOpenAllFestivals={() => go("#/festivals")}
            /* `newStores={d.newStores}` 가 여기 있었다 — 신규 매장 레일이 없어졌다
               (2026-08-25, 사용자 요청. DiscoverPanel 의 그 자리 주석) */
            popular={d.popular}
            courses={d.courses}
            /* 여기서는 현재 상점가를 뺀다 — 지금 서 있는 곳이라 "다른 상점가"가 아니다.
               앞의 5곳만 깔리고 나머지는 [전체보기] → S13 이 32곳 전부를 맡는다 */
            districts={OTHER_DISTRICTS}
            currentDistrict={currentDistrict}
            onOpenFestival={f => go(`#/festival/${f.id}`)}
            /* 카드도 목록 행·지도 마커와 같다 — 상세로 건너뛰지 않고 지도에서 켠다
               (showStoreOnMap 주석). 상세는 거기 뜨는 카드의 [상세 보기]가 맡는다 */
            onOpenStore={showStoreOnMap}
            onOpenCourse={c => go(`#/course/${c.id}`)}
            onOpenAllDistricts={() => go("#/districts")}
            onOpenDistrict={x => go(`#/district/${encodeURIComponent(x.id)}`)} />
        ) : null}

        {/* 결정 1 — 3단 스냅. 실측 높이를 위로 올려보내 지도 패딩과 미리보기 카드 앵커가 따라온다.
            U-FC-03 의 "목록과 지도 토글"이 이것이다 — 별도 버튼을 두지 않는다.
            둘러보기 탭에는 시트 자체가 없다. */}
        {isDiscover ? null : <Sheet
          title={sheetTitle}
          snap={snap}
          /* 전체 스냅으로 올라가면 선택 자체가 풀린다 (changeSnap 머리말) */
          onSnapChange={changeSnap}
          onHeightChange={setSheetH}
          /* 전체 스냅에서는 지도가 완전히 가려지므로 돌아갈 길을 헤더에 명시한다.
             핸들을 아래로 끄는 방법만 남기면 지도로 못 돌아가는 사용자가 생긴다 */
          onClose={snap === "full" ? () => setSnap("half") : undefined}
          closeIcon="map"
          closeLabel="지도"
          topInset={sheetTopInset}
          /* 조건이 바뀌면 목록 스크롤을 맨 위로 되돌린다 (2026-08-18).
             [음식]을 보다가 [카페/디저트]를 누르면 목록이 통째로 바뀌는데 스크롤만 남아
             있으면 카페 1번이 아니라 카페 14번이 열린다 — 위에 무엇이 있는지 모른 채
             올려봐야 하고, 조건을 좁혔는데 화면은 더 아래로 간 것처럼 느껴진다.

             탭 이름을 앞에 붙인다. 두 탭이 한 시트를 공유해서, 붙이지 않으면 공공시설의
             [전체]와 상점가의 [전체]가 같은 값이 되어 탭을 옮겨도 스크롤이 남는다.
             선택 강조(selected)와 시트 스냅은 넣지 않는다 — 목록의 내용이 그대로다. */
          /* 쪽 번호도 함께 넣는다 (2026-08-18). 쪽 단추는 목록 **끝**에 있어서, 거기서
             [다음]을 누르면 새 쪽의 끝줄 근처가 열린다 — 방금 넘긴 쪽의 위쪽을 보지 못한
             채 다시 올려야 한다. 조건이 바뀔 때와 같은 이유이고 같은 장치로 푼다. */
          scrollKey={isFacility
            /* 반경도 조건이다 (2026-08-26) — 4km 로 늘려 아래까지 읽다가 2km 로 되돌리면
               목록의 뒤쪽이 통째로 없어지는데, 스크롤만 남으면 빈 자리에 서 있게 된다 */
            ? `facility|${fcTypes.join(",")}|${radius}|${fcPage}`
            : `district|${cats.join(",")}|${onnuriOnly}|${sort}|${q}|${page}`}
          /* U-ST-02 구역 안내 — 제목 줄 **오른쪽**이다 (2026-08-18). 제목 아래 한 줄로
             두면 절반 스냅에서 그 한 줄이 점포 한 줄을 먹어, 시트를 열었는데 가게가
             하나밖에 안 보였다. 상점가명은 짧고 그 옆은 비어 있다 (Sheet 의 titleAside).
             공공시설 탭에는 이 자리에 넣을 것이 없다 — 그쪽 요약은 가로가 필요해서
             아래 headerExtra 로 간다. */
          titleAside={isDistrict && hasDistrict
            ? <DistrictSummary district={d.district} /> : null}
          headerExtra={isFacility
            /* U-FC-02 기준 + U-FC-04 안전시설 개수 — 접힘 상태에서도 보여야 하므로 스크롤 영역 밖.
               U-FC-09 원거리 안내도 여기서 난다 — 목록 위 배너가 아니라 해당 유형 아이콘의
               주의 배지와 말풍선이다 (배너 한 장이 목록 두 줄만큼을 먹으면서 말하는 것은
               "대피소가 멀다" 한 가지뿐이었다). */
            ? <FacilitySummary
                counts={FACILITY_TYPES.reduce((o, t) => ({ ...o, [t]: facilityByType[t].length }), {})}
                warnings={facilityNotices}
                /* 닫힘을 셸이 들고 있다. 이 줄은 공공시설 탭일 때만 그려져서 탭을 옮기면
                   언마운트되는데, 그 안에 두면 둘러보기를 갔다 올 때마다 말풍선이 다시 열려
                   같은 경고를 몇 번이고 닫아야 했다. 셸은 탭이 바뀌어도 서 있다 (U-CM-16). */
                dismissed={warnDismissed}
                onDismissedChange={setWarnDismissed}
                style={{ marginTop: "var(--space-1)" }} />
            : null}>

          {isFacility ? (
            <FacilitySheet
              rows={facilityRows}
              /* `types` 와 `asOf` 를 넘기던 자리다 (2026-08-25 삭제) — 저 시트에서 그 둘을
                 쓰던 곳은 하단 기준일 줄 하나뿐이었고 그 줄이 없어졌다. 유형별 기준일은
                 상세(S08)가 그 유형 하나만 적는다 */
              page={fcPage} setPage={setFcPage}
              selectedId={selected ? selected.id : null}
              /* 상세로 곧장 가지 않는다 — 마커를 누른 것과 같이 지도가 그리로 움직이고
                 카드가 뜬다. 상세는 그 카드의 [상세 보기]가 맡는다 (pickFacility 주석) */
              onPick={pickFacility} />
          ) : isDistrict && !hasDistrict ? (
            /* ── S03-E 상점가 없음 안내 (U-ST-16) ─────────────────────────
                   점포 목록 자리를 통째로 대신한다. 탭은 그대로 둔다 —
                   탭이 사라졌다 나타나면 QR 지점마다 서비스가 다른 물건으로 보인다. */
            <DistrictEmpty
              districts={OTHER_DISTRICTS}
              totalCount={DISTRICT_COUNT}
              anchorName={d.anchor.name}
              onGoDiscover={() => changeTab("discover")}
              onGoFacility={() => changeTab("facility")}
              /* 이 자리도 안내 주소가 없는 줄만 탄다 (2026-08-24). 지금까지는 아무도
                 넘기지 않아 그런 줄이 눌러도 아무 일이 없었다 */
              onPickDistrict={x => go(`#/district/${encodeURIComponent(x.id)}`)} />
          ) : isDistrict ? (
            <DistrictSheet
              data={d}
              rows={storeRows}
              cats={cats}
              onnuriOnly={onnuriOnly} setOnnuriOnly={setOnnuriOnly}
              sort={sort} setSort={setSort}
              page={page} setPage={setPage}
              q={q}
              selectedId={selected ? selected.id : null}
              /* 점포 행도 마커를 누른 것과 같다 (pickFacility 주석) */
              onPickStore={pickOnMap}
              /* `onPickFacility` 가 여기 있었다 — 주변 공공시설 블록과 함께 나갔다
                 (2026-08-24. DistrictSheet 의 해당 자리 주석) */
              onOpenFestival={() => go(`#/festival/${d.festival.id}`)}
              /* 닫힌 축제의 id 를 셸이 들고 있다. 시트 안에 두면 탭을 옮길 때 언마운트되어
                 둘러보기를 갔다 올 때마다 배너가 되살아난다 (U-FC-09 말풍선과 같은 이유).
                 id 로 비교하는 이유: 축제가 다음 것으로 넘어가면 다시 보여야 한다 —
                 "한 번 닫았다"가 아니라 "이 축제를 닫았다"가 기억할 값이다. */
              festivalDismissed={!!d.festival && festivalDismissed === d.festival.id}
              /* 토스트를 띄우지 않는다 (2026-08-18). 닫기는 사용자가 직접 시킨 일이고
                 배너가 사라지는 것으로 이미 답이 됐다 — 그 위에 토스트를 얹으면 지운 것을
                 다시 덮는 꼴이다. 토스트는 **사용자가 시키지 않은 변화**(탭이 발밑에서
                 바뀌는 이동 같은 것)를 알리는 자리로 남긴다. */
              onDismissFestival={() => setFestivalDismissed(d.festival.id)} />
          ) : null}
        </Sheet>}

        {/* 스크린리더용 상태 안내 — 탭과 시트 단계는 시각적으로만 전달되면 안 된다.
            둘러보기에는 시트가 없으므로 단계를 읽지 않는다 (없는 조작을 안내하게 된다) */}
        <VisuallyHidden aria-live="polite">
          {tabOf(tab).label} 탭
          {isFacility ? ` · 목록 시트 ${SNAP_LABEL[snap]} · ${facilityRows.length}곳`
            : isDistrict ? (hasDistrict
              ? ` · 목록 시트 ${SNAP_LABEL[snap]} · ${storeRows.length}곳`
              : ` · 가까운 상점가 없음, 가볼 만한 상점가 ${districtMarkers.length}곳`)
              : ` · 축제 ${FESTIVALS.length}건, 다른 상점가 ${OTHER_DISTRICTS.length}곳`}
        </VisuallyHidden>
      </div>

      {/* 하단 탭바 (U-CM-03) — 지도 영역의 **형제**다. 시트 안이나 위가 아니라 밖에 있으므로
          전체 스냅(100%)에서도 덮이지 않는다. 기능명세서 5-3 #5 의 답.
          알림 점은 찍지 않는다 (2026-08-20. 종전 U-CM-18) — 아래 TABS 머리말 참조 */}
      <TabBar items={TABS} value={tab} onChange={changeTab} />

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
