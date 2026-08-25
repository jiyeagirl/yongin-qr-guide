import React from "react";
import { token } from "../core/token.js";
import { loadKakaoMaps } from "./kakaoLoader.js";
import { MapCanvas } from "./MapCanvas.jsx";
import { FACILITY_LABELS, FACILITY_PIN } from "../core/FacilityIcon.jsx";

/* 카카오맵 SDK 를 실제로 띄우는 지도 레이어. 6개 지도 화면이 공유한다.
   앱키가 없거나 SDK 로드가 실패하면 MapCanvas(목업)로 떨어져 화면 검증은 계속 가능하다.

   여기서 책임지는 것
   - z 100 (--z-map) 베이스. 마커·클러스터는 SDK 가 z 200 대역에서 직접 렌더한다.
   - bottomPad(px): 시트에 가려지는 아래쪽 높이. 마커를 탭했을 때 그만큼 위로 올려 잡는다.
     (기능명세서 5-3 #2) 값은 Sheet 의 measure 결과라 스냅이 바뀌면 같이 바뀐다.
   - 클러스터링: 수백 개 마커를 그대로 렌더하지 않는다 (U-ST-13).

   지도의 "내 위치"는 항상 QR 스캔 지점이다. GPS 를 쓰지 않는다 (제안서 3-1). */

const PIN_W = 28, PIN_H = 36;

/* scale 은 고른 핀을 키울 때만 쓴다 (--pin-selected-scale). viewBox 는 그대로 두고
   상자만 키우므로 실루엣이 달라지지 않는다 — 같은 핀이 앞으로 나온 것처럼 보여야 한다.

   테두리는 **모든 핀이 흰색 하나**다. 고른 핀만 회색·잉크로 바꿔 봤는데(2026-08-18 두 번),
   테두리 색이 다른 순간 같은 무리의 핀이 아니라 다른 종류의 표시로 읽혔다.
   고른 것을 알리는 일은 색·물결·크기 셋이 맡고, 테두리는 "이것도 핀이다"를 맡는다. */
function pinImage(kakao, fill, scale = 1) {
  const stroke = token("--pin-stroke", "#ffffff");
  const w = Math.round(PIN_W * scale), h = Math.round(PIN_H * scale);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 36">`
    + `<path d="M14 34.5S25.5 21 25.5 13.5a11.5 11.5 0 1 0-23 0C2.5 21 14 34.5 14 34.5Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
    + `<circle cx="14" cy="13.5" r="4.2" fill="${stroke}"/></svg>`;
  return new kakao.maps.MarkerImage(
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
    new kakao.maps.Size(w, h),
    { offset: new kakao.maps.Point(w / 2, h) }
  );
}

/* 고른 핀 아래에서 번지는 물결. 핀이 몰린 곳에서 "이 중에 어느 것인지"를 알리는 장치다 —
   색만 바꾸면 옆 핀에 파묻힌다 (tokens/icons.css 의 --pin-selected-* 주석).
   좌표 위에 중심을 맞추므로 yAnchor 0.5, 핀보다 뒤(zIndex 낮게)에 깐다. */
function haloElement() {
  const size = token("--pin-selected-halo-size", "72px");
  const el = document.createElement("div");
  /* 바탕 모습(opacity .18)이 **움직임을 껐을 때의 모습**이다. 움직임 최소화를 요청한
     기기에서는 motion.css 가 반복을 1회로 줄이는데, 애니메이션이 끝나면 요소는 바탕
     모습으로 돌아온다 — 그래서 물결 대신 은은한 원이 그 자리에 남는다. 여기에
     opacity 1 을 두면 그 기기에서만 짙은 원판이 핀을 덮는다. */
  el.style.cssText = `width:${size};height:${size};border-radius:999px;opacity:.18;`
    + `background:var(--pin-selected-halo);pointer-events:none;`
    + `animation:yong-pin-pulse 2.4s var(--ease-out) infinite`;
  return el;
}

function clusterStyles() {
  const base = {
    color: token("--cluster-text", "#ffffff"),
    textAlign: "center",
    fontWeight: token("--fw-bold", "700"),
    fontFamily: token("--font-sans", "Pretendard, sans-serif"),
    borderRadius: token("--radius-pill", "999px"),
    border: `${token("--stroke-outline", "2px")} solid ${token("--pin-stroke", "#ffffff")}`,
    boxShadow: token("--shadow-raised", "0 6px 18px rgba(22,34,28,.10)"),
  };
  const sizes = [
    ["--cluster-sm-size", "40px", "--cluster-bg", "15px"],
    ["--cluster-md-size", "48px", "--cluster-bg", "16px"],
    ["--cluster-lg-size", "58px", "--cluster-bg-strong", "17px"],
  ];
  return sizes.map(([sizeVar, sizeFallback, bgVar, font]) => {
    const s = token(sizeVar, sizeFallback);
    return { ...base, width: s, height: s, lineHeight: s, fontSize: font, background: token(bgVar, "rgba(47,146,96,.92)") };
  });
}

export function KakaoMap({
  appKey,
  center,                     /* {lat, lng} — QR 스캔 지점 */
  anchorLabel = "QR 지점",
  /* 그 지점을 **파란 점 + 말풍선**으로 그릴지 (2026-08-25 추가).
     시민 화면에서 이 표시는 「내 위치」다 — QR 을 찍은 자리이고, 화면의 모든 거리가
     거기서 잰 값이다. 그래서 늘 켜져 있어야 한다.

     관리자의 좌표 지정 지도(CoordField)에서는 **꺼야 한다.** 거기서 center 는 「내
     위치」가 아니라 **지금 고치고 있는 그 좌표**라, 켜 두면 끌 수 있는 핀 바로 밑에
     같은 자리를 가리키는 파란 점이 하나 더 서고 말풍선이 시설 이름을 적는다 —
     둘 중 무엇을 끌어야 하는지 화면이 스스로 흐린다. 거기 있어야 하는 것은 핀뿐이다. */
  anchor = true,
  level = 4,
  /* 레이어 셋. U-CM-17 에 따라 한 번에 하나만 채운다 — 탭이 소유한 레이어만 그린다 */
  stores = [],                /* [{id, name, lat, lng, onnuri}] — 상점가 탭. 클러스터링(U-ST-13) */
  facilities = [],            /* [{id, name, type, lat, lng}] — 공공시설 탭. 유형 4종 색 */
  districts = [],             /* [{id, name, lat, lng, festival}] — 상점가 지점 (S03-E 의 근처 상점가) */
  course = [],                /* [{id, name, lat, lng}] — S08 코스 상세. **순서가 있는 배열**이다 */
  /* 코스에서 이미 들른 곳의 id. 그 핀을 흐리게 둔다 — 목록에서 체크한 것이 지도에도
     보여야 두 곳이 같은 상태를 말한다. 색을 새로 만들지 않고 투명도만 낮춘다. */
  courseDoneIds = [],
  /* S07 길찾기 (U-NV-02). {path:[{lat,lng}], turns:[{lat,lng}], dest:{name,lat,lng}, straight:bool}
     straight 는 경로 실패 폴백(U-NV-04) 표시다 — 직선을 점선으로 낮춰 긋는다 */
  route = null,
  activeTurn = -1,            /* 안내 목록에서 고른 지점. 지도의 꺾임 표시와 목록이 같은 것을 가리킨다 */
  onSelectTurn,
  selectedId = null,
  /* ── 좌표 지정 (관리자 전용) ───────────────────────────────────────────────
     시민 화면은 좌표를 **읽기만** 한다. 관리자는 명세서 입력 원칙 3번에 따라
     "주소에서 자동 변환된 좌표가 부정확할 때 지도에서 수정"해야 하고, 그 한 가지를
     위해 지도 컴포넌트를 하나 더 만들 이유가 없다.

       pick    {lat, lng} — 끌어 옮길 수 있는 핀 하나를 그린다
       onPick  (lat, lng) — 지도를 누르거나 핀을 놓았을 때 부른다

     시민 쪽 화면은 둘 다 넘기지 않으므로 동작이 달라지지 않는다. */
  pick = null,
  onPick,
  topPad = 0,                 /* px. 상단 필터 바에 가려지는 높이 */
  bottomPad = 0,              /* px. 시트에 가려지는 높이 */
  onSelectStore,
  onSelectFacility,
  onSelectDistrict,
  onSelectCourseStop,
  onSelectDest,
  onReady,
  onError,
  mapRef,                     /* {current} — {focus(lat,lng), reset()} 를 받는다 */
  style,
  ...rest
}) {
  const host = React.useRef(null);
  const map = React.useRef(null);
  const kakaoRef = React.useRef(null);
  const clusterer = React.useRef(null);
  /* 마커 조회표는 레이어별로 따로 둔다. 하나로 합치면 점포 필터가 바뀔 때
     표를 통째로 비우면서 시설 마커까지 조회 불가가 된다 (선택 강조가 조용히 죽는다). */
  const storeMarkers = React.useRef(new Map());
  const facilityMarkers = React.useRef(new Map());
  const districtMarkers = React.useRef(new Map());
  /* 코스는 마커가 아니라 CustomOverlay 다 — 순번 숫자를 넣어야 하는데
     마커 이미지는 미리 만든 PNG 라 숫자를 얹을 수 없다 */
  const courseOverlays = React.useRef(new Map());
  const coursePath = React.useRef(null);
  /* 경로는 선 두 겹(밑선 + 본선) + 꺾임 표시 + 도착 마커로 이루어진다. 하나라도 남으면
     다른 경로를 그릴 때 옛 선이 겹쳐 남으므로 한 자리에 모아 통째로 지운다. */
  const routeArt = React.useRef([]);
  const images = React.useRef(null);
  const pad = React.useRef({ top: topPad, bottom: bottomPad });
  const [failed, setFailed] = React.useState(null);

  /* 지도가 만들어졌다는 신호. **마커 이펙트의 의존성으로 반드시 들어가야 한다.**
     지도 생성은 SDK 를 네트워크로 받아오는 비동기라, 첫 렌더에서 마커 이펙트가 먼저 돌면
     kakaoRef 가 아직 null 이라 아무 것도 그리지 않고 끝난다. 그 뒤 지도가 생겨도
     stores/facilities 배열의 참조는 그대로이므로 이펙트가 다시 돌지 않는다.
     → 진입 직후에는 핀이 없고, 필터 칩을 눌러 배열이 새로 만들어져야 비로소 나타난다.
     ref 대신 state 를 쓰는 이유가 이것이다. ref 는 바뀌어도 리렌더를 일으키지 않는다. */
  const [ready, setReady] = React.useState(false);

  pad.current = { top: topPad, bottom: bottomPad };

  /* 콜백은 ref 로 — 부모가 인라인 함수를 넘겨도 지도를 다시 만들지 않는다 */
  const cb = React.useRef({});
  cb.current = { onSelectStore, onSelectFacility, onSelectDistrict, onSelectCourseStop, onSelectDest, onSelectTurn, onReady, onError, onPick };
  const pickMarker = React.useRef(null);

  /* 실제로 보이는 띠 = 상단 필터 바 아래 ~ 시트 위. 그 한가운데로 마커를 옮긴다.
     지도 중심을 화면 좌표 P 의 좌표로 옮기면 P 는 지도 정중앙으로 간다. 따라서
       마커의 새 y = 지도높이/2 - (P.y - 마커y)
     이걸 목표 y = topPad + (지도높이 - topPad - bottomPad)/2 와 같게 두고 풀면
       P.y = 마커y + (bottomPad - topPad) / 2
     topPad 가 0 이면 기존 식(+bottomPad/2)과 같다. */
  const focus = React.useCallback((lat, lng) => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;
    const target = new k.maps.LatLng(lat, lng);
    const proj = m.getProjection();
    const pt = proj.containerPointFromCoords(target);
    const lifted = new k.maps.Point(pt.x, pt.y + (pad.current.bottom - pad.current.top) / 2);
    m.panTo(proj.coordsFromContainerPoint(lifted));
  }, []);

  /* 탭을 바꾸면 카메라를 QR 지점으로 되돌리고 줌을 그 탭의 기본 레벨로 맞춘다 (5-3 #6).
     지도를 멀리 끌어둔 채 탭을 바꾸면 새 레이어의 마커가 화면 밖에 있어
     "아무것도 없다"로 보이기 때문이다. 지도 인스턴스는 그대로 두므로 재로딩은 없다 (U-CM-16). */
  const setView = React.useCallback((lat, lng, lv) => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;
    if (lv != null) m.setLevel(lv);
    m.setCenter(new k.maps.LatLng(lat, lng));
  }, []);

  /* 여러 지점을 한 화면에 담는다 (둘러보기 탭의 32개소처럼 범위를 미리 알 수 없을 때).
     줌 레벨을 상수로 찍으면 기기 폭과 대상 분포에 따라 잘리거나 너무 멀어진다.
     가려지는 위아래(필터 바 / 시트)를 padding 으로 넘겨 보이는 띠 안에 들어오게 한다. */
  const fitTo = React.useCallback((points, padding) => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m || !points || !points.length) return;
    const b = new k.maps.LatLngBounds();
    points.forEach(p => p.lat && p.lng && b.extend(new k.maps.LatLng(p.lat, p.lng)));
    const pad = padding || {};
    m.setBounds(b, Math.round(pad.top || 0), 16, Math.round(pad.bottom || 0), 16);
  }, []);

  React.useEffect(() => {
    if (mapRef) mapRef.current = {
      focus,
      setView,
      fitTo,
      reset: () => center && focus(center.lat, center.lng),
    };
  }, [mapRef, focus, setView, fitTo, center]);

  /* 지도 생성 — 한 번만 */
  React.useEffect(() => {
    let dead = false;
    loadKakaoMaps(appKey).then(kakao => {
      if (dead || !host.current) return;
      kakaoRef.current = kakao;
      const m = new kakao.maps.Map(host.current, { center: new kakao.maps.LatLng(center.lat, center.lng), level });
      map.current = m;
      /* 둘러보기 탭은 32개소 전체(약 25km 범위)를 한 화면에 담아야 하므로 7 로는 부족하다.
         상한을 12 로 두되 실제 레벨은 fitTo 가 대상 분포에서 계산한다. */
      m.setMaxLevel(12);

      /* 핀 이미지는 한 번만 만들어 재사용한다 — 마커마다 새로 만들면 수백 개에서 비용이 든다.
         시설은 유형 4종이 각자 색을 갖는다 (U-FC-04 / 5-2, 값은 tokens/icons.css). */
      images.current = {
        store: pinImage(kakao, token("--pin-store", "#5b6a62")),
        onnuri: pinImage(kakao, token("--pin-store-onnuri", "#179496")),
        /* 고른 핀만 밝은 민트 + 조금 큰 크기다 — 색 하나로는 옆 핀에 파묻힌다 */
        selected: pinImage(kakao, token("--pin-selected", "#66ce94"),
          parseFloat(token("--pin-selected-scale", "1.12")) || 1.12),
        aed: pinImage(kakao, token("--pin-aed", "#e5544b")),
        shelter: pinImage(kakao, token("--pin-shelter", "#b23a33")),
        toilet: pinImage(kakao, token("--pin-toilet", "#0f6e70")),
        rest: pinImage(kakao, token("--pin-rest", "#179496")),
        neutral: pinImage(kakao, token("--pin-neutral", "#0f6e70")),
        district: pinImage(kakao, token("--pin-district", "#2f9260")),
        festival: pinImage(kakao, token("--pin-festival", "#f2a73b")),
        dest: pinImage(kakao, token("--pin-dest", "#216e48")),
      };

      clusterer.current = new kakao.maps.MarkerClusterer({
        map: m, averageCenter: true, minLevel: 3, disableClickZoom: false,
        calculator: [10, 100], styles: clusterStyles(),
      });

      /* QR 스캔 지점 앵커 — 마커가 아니라 "내 위치" 점이다. 점포 핀과 형태·색이 겹치면 안 된다.
         점과 말풍선을 두 개의 오버레이로 나눈다. 하나로 묶으면 yAnchor 하나로는
         점을 좌표에 정확히 앉히면서 말풍선을 그 위에 띄울 수 없다.
         `anchor={false}` 인 화면에서는 아예 그리지 않는다 (위 prop 주석). */
      if (anchor) {
        const anchorPos = new kakao.maps.LatLng(center.lat, center.lng);

        const dot = document.createElement("div");
        dot.style.cssText = "width:18px;height:18px;border-radius:999px;background:var(--pin-anchor);"
          + "border:var(--stroke-bold) solid var(--pin-stroke);box-shadow:0 0 0 6px var(--pin-anchor-halo)";
        new kakao.maps.CustomOverlay({ map: m, position: anchorPos, content: dot, yAnchor: 0.5, zIndex: 3 });

        /* 말풍선 — 검은 알약은 지도 위에서 너무 무겁게 읽혔다. 흰 바탕에 꼬리를 달아
           어느 지점을 가리키는지 형태로 드러내고, 글자는 bold 를 빼고 medium 으로 낮춘다.
           paddingBottom 이 점과의 간격이 된다 (yAnchor 1 이라 콘텐츠 아래끝이 좌표에 닿는다). */
        const bubble = document.createElement("div");
        bubble.style.cssText = "position:relative;padding-bottom:15px";
        bubble.innerHTML =
          `<span style="display:block;position:relative;padding:5px 10px;border-radius:var(--radius-sm);`
          + `background:var(--surface-card);color:var(--text-heading);`
          + `border:var(--stroke-hairline) solid var(--border-default);box-shadow:var(--shadow-raised);`
          + `font-family:var(--font-sans);font-size:var(--fs-micro);font-weight:var(--fw-medium);`
          + `line-height:1.35;letter-spacing:var(--ls-normal);white-space:nowrap">${anchorLabel}</span>`
          /* 꼬리: 45도 돌린 정사각형에 아래·오른쪽 테두리만 남겨 말풍선 테두리와 이어 붙인다 */
          + `<span style="position:absolute;left:50%;bottom:11px;width:9px;height:9px;`
          + `margin-left:-4.5px;background:var(--surface-card);`
          + `border-right:var(--stroke-hairline) solid var(--border-default);`
          + `border-bottom:var(--stroke-hairline) solid var(--border-default);`
          + `transform:rotate(45deg)"></span>`;
        new kakao.maps.CustomOverlay({ map: m, position: anchorPos, content: bubble, yAnchor: 1, zIndex: 4 });
      }

      /* 좌표 지정 — 지도를 누르면 그 자리가 새 좌표가 된다. 리스너를 여기(생성 1회)에
         두는 이유는 onPick 이 인라인 함수로 들어와도 지도를 다시 만들지 않기 위해서다.
         onPick 을 넘기지 않은 화면에서는 아무 일도 일어나지 않는다. */
      kakao.maps.event.addListener(m, "click", e => {
        if (!cb.current.onPick) return;
        const ll = e.latLng;
        cb.current.onPick(+ll.getLat().toFixed(6), +ll.getLng().toFixed(6));
      });

      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => m.relayout()) : null;
      if (ro) ro.observe(host.current);
      /* 마커 이펙트를 깨운다 — 이 줄이 없으면 진입 직후 지도에 핀이 하나도 없다 */
      setReady(true);
      cb.current.onReady && cb.current.onReady(m);
    }).catch(err => {
      if (dead) return;
      setFailed(err.message || String(err));
      cb.current.onError && cb.current.onError(err);
    });
    return () => { dead = true; };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  /* 선택 강조를 되돌릴 때 원래 색이 무엇이었는지 알아야 한다. 점포·시설을 한 표에 담아둔다 —
     둘은 U-CM-17 에 따라 동시에 뜨지 않으므로 id 가 겹칠 일이 없다. */
  const byId = React.useMemo(
    () => new Map([...stores, ...facilities, ...districts].map(x => [x.id, x])),
    [stores, facilities, districts]);

  /* 마커의 평상시 이미지 — 상점가는 축제 유무, 시설은 유형 4종, 점포는 온누리 여부.
     kind 를 명시적으로 보는 이유: 상점가에도 onnuri 수치가 있어 점포와 구별이 안 된다. */
  const baseImage = React.useCallback(item => {
    const im = images.current;
    if (!im || !item) return undefined;
    if (item.kind === "district") return item.festival ? im.festival : im.district;
    if (item.type && FACILITY_PIN[item.type]) return im[item.type] || im.neutral;
    return item.onnuri ? im.onnuri : im.store;
  }, []);

  /* 점포 마커 — 필터 결과가 바뀔 때마다 클러스터러 내용을 교체한다 */
  React.useEffect(() => {
    const k = kakaoRef.current, cl = clusterer.current;
    if (!k || !cl) return;
    cl.clear();
    storeMarkers.current.clear();
    const list = stores.filter(s => s.lat && s.lng).map(s => {
      const mk = new k.maps.Marker({
        position: new k.maps.LatLng(s.lat, s.lng),
        image: baseImage(s),
        title: s.name,
      });
      k.maps.event.addListener(mk, "click", () => cb.current.onSelectStore && cb.current.onSelectStore(s));
      storeMarkers.current.set(s.id, mk);
      return mk;
    });
    cl.addMarkers(list);
  }, [stores, baseImage, ready]);

  /* 공공시설 핀 (S02) — 유형 4종이 각자 색을 갖는다. AED·대피소는 적색 계열, 화장실·쉼터는 중립 계열.
     클러스터에 넣지 않는다. 개수가 수십 단위라 뭉칠 필요가 없고, 응급 시설이 클러스터 숫자 뒤로
     숨는 상태를 만들면 안 된다 (U-FC-04 의 취지). */
  React.useEffect(() => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;
    facilityMarkers.current.forEach(mk => mk.setMap(null));
    facilityMarkers.current.clear();
    facilities.filter(f => f.lat && f.lng).forEach(f => {
      const mk = new k.maps.Marker({
        map: m,
        position: new k.maps.LatLng(f.lat, f.lng),
        image: baseImage(f),
        title: `${f.name} · ${FACILITY_LABELS[f.type] || "공공시설"}`,
        zIndex: 2,
      });
      k.maps.event.addListener(mk, "click", () => cb.current.onSelectFacility && cb.current.onSelectFacility(f));
      facilityMarkers.current.set(f.id, mk);
    });
  }, [facilities, baseImage, ready]);

  /* 상점가 지점 핀 (S04 둘러보기) — 32개소 전체. 축제가 걸린 곳은 호박색이다.
     클러스터에 넣지 않는다. 32개가 시 전역에 흩어져 있어 뭉칠 만큼 겹치지 않고,
     축제가 있는 곳이 클러스터 숫자 뒤로 숨으면 이 탭의 최상단 섹션과 지도가 어긋난다. */
  React.useEffect(() => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;
    districtMarkers.current.forEach(mk => mk.setMap(null));
    districtMarkers.current.clear();
    districts.filter(x => x.lat && x.lng).forEach(x => {
      const mk = new k.maps.Marker({
        map: m,
        position: new k.maps.LatLng(x.lat, x.lng),
        image: baseImage(x),
        /* 마커 툴팁도 짧은 이름이다 — 실제 축제명은 상세 화면이 온전히 적는다 */
        title: x.festival ? `${x.name} · ${x.festival.short || x.festival.name}` : x.name,
        zIndex: x.festival ? 3 : 2,
      });
      k.maps.event.addListener(mk, "click", () => cb.current.onSelectDistrict && cb.current.onSelectDistrict(x));
      districtMarkers.current.set(x.id, mk);
    });
  }, [districts, baseImage, ready]);

  /* ── 코스 레이어 (S08 골목 한바퀴 상세) ─────────────────────────────────
     다른 레이어와 성격이 다르다. 점포·시설·상점가는 **집합**이지만 코스는 **순서**다.
     그래서 두 가지가 더 붙는다.

       1. 순번 숫자   1·2·3·4 를 핀 안에 적는다. 숫자가 없으면 어디서 시작해 어디로
                      가는지 알 수 없고, 그러면 "코스"가 아니라 그냥 네 곳의 목록이다.
       2. 경로 선     들르는 순서대로 이은 선. QR 지점에서 시작한다 — 코스의 도보 시간이
                      "QR 지점에서 첫 가게까지"를 포함해 계산되므로(dunjeon.js), 선도
                      같은 곳에서 출발해야 지도와 숫자가 어긋나지 않는다.

     실제 도보 경로가 아니라 직선이다. 경로 API 는 길찾기(S07)에서만 부른다 —
     목록·개요 단계에서 부르지 않는 규칙(U-FC-06 / U-NV-05 호출량 제어)을 여기도 따른다.
     그래서 선을 점선으로 그린다. 실선으로 그리면 "이 길로 가라"는 안내로 읽힌다. */
  React.useEffect(() => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;

    courseOverlays.current.forEach(ov => ov.setMap(null));
    courseOverlays.current.clear();
    if (coursePath.current) { coursePath.current.setMap(null); coursePath.current = null; }
    if (!course.length) return;

    const stops = course.filter(s => s.lat && s.lng);
    if (!stops.length) return;

    /* 경로 선 — QR 지점 → 1 → 2 → … */
    const pts = [];
    if (center && center.lat && center.lng) pts.push(new k.maps.LatLng(center.lat, center.lng));
    stops.forEach(s => pts.push(new k.maps.LatLng(s.lat, s.lng)));
    coursePath.current = new k.maps.Polyline({
      map: m, path: pts, strokeWeight: 4,
      strokeColor: token("--brand-primary", "#2f9260"),
      strokeOpacity: 0.85, strokeStyle: "shortdash",
    });

    stops.forEach((s, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${i + 1}번째 ${s.name}`);
      el.dataset.stop = s.id;
      el.style.cssText =
        "display:flex;align-items:center;justify-content:center;"
        + "width:30px;height:30px;border-radius:999px;cursor:pointer;"
        + "font-family:var(--font-sans);font-size:var(--fs-caption);font-weight:var(--fw-bold);"
        + "border:var(--stroke-bold) solid var(--pin-stroke);box-shadow:var(--shadow-raised);"
        + "background:var(--brand-primary);color:var(--text-on-brand)";
      el.textContent = String(i + 1);
      el.addEventListener("click", () => cb.current.onSelectCourseStop && cb.current.onSelectCourseStop(s));
      const ov = new k.maps.CustomOverlay({
        map: m, position: new k.maps.LatLng(s.lat, s.lng), content: el, yAnchor: 0.5, zIndex: 6,
      });
      courseOverlays.current.set(s.id, ov);
    });
  }, [course, center, ready]);

  /* ── 경로 레이어 (S07 길찾기 · U-NV-02) ──────────────────────────────────
     코스(위)와 가장 비슷해 보이지만 성질이 정반대다.

       코스 점선   들르는 순서를 이은 직선. "이 순서로 돌아라"
       경로 실선   경로 API 가 돌려준 실제 도보 길. "이 길로 가라"

     그래서 실선이고, 색도 초록(점포 계열)이 아니라 파랑(QR 지점 계열)이다.
     선을 두 겹으로 긋는다 — 카카오 기본 지도의 도로가 회색·노랑·흰색이라
     파란 선 하나만 그으면 교차로에서 도로 위에 묻힌다 (밑선이 흰 테두리 역할을 한다).

     경로를 못 받았을 때(U-NV-04)도 이 레이어를 쓴다. 다만 straight 로 들어오면
     출발-도착을 잇는 회색 점선이 된다. 방향과 거리만 맞는 직선이지 걸어갈 길이 아니므로
     실선으로 그리면 안내가 거짓말이 된다.

     출발 표시는 따로 그리지 않는다 — 지도 생성 때 만든 QR 지점 앵커(파란 점 + 말풍선)가
     그대로 출발점이다. 화면의 "내 위치"는 언제나 QR 지점이라는 전제(제안서 3-1)가
     여기서도 그대로 유지된다. */
  React.useEffect(() => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;

    routeArt.current.forEach(x => x.setMap(null));
    routeArt.current = [];
    if (!route) return;

    const pts = (route.path || []).filter(p => p && p.lat && p.lng).map(p => new k.maps.LatLng(p.lat, p.lng));
    if (pts.length < 2) return;
    const keep = x => { routeArt.current.push(x); return x; };

    if (route.straight) {
      keep(new k.maps.Polyline({
        map: m, path: pts, strokeWeight: 4,
        strokeColor: token("--route-line-straight", "#5b6a62"),
        strokeOpacity: 0.9, strokeStyle: "shortdash", zIndex: 2,
      }));
    } else {
      keep(new k.maps.Polyline({
        map: m, path: pts, strokeWeight: parseInt(token("--route-casing-w", "10px"), 10) || 10,
        strokeColor: token("--route-line-casing", "#ffffff"),
        strokeOpacity: 0.95, strokeStyle: "solid", zIndex: 1,
      }));
      keep(new k.maps.Polyline({
        map: m, path: pts, strokeWeight: parseInt(token("--route-line-w", "6px"), 10) || 6,
        strokeColor: token("--route-line", "#3d7be5"),
        strokeOpacity: 0.95, strokeStyle: "solid", zIndex: 2,
      }));
    }

    /* 꺾이는 지점 — 안내 목록의 항목과 1:1 이다. 목록에서 누르면 지도가 그리로 가고,
       지도에서 눌러도 같은 항목이 열린다 (S08 의 순번 이동과 같은 짝짓기).
       마커가 아니라 CustomOverlay 인 이유도 같다: 선택되면 커져야 하는데 마커 이미지는 PNG 다. */
    /* dot === false 인 항목(출발·도착)도 배열에 남겨둔다 — 안내 목록과 인덱스가 어긋나면
       목록에서 세 번째를 눌렀는데 지도는 네 번째 지점을 키우게 된다.
       출발은 QR 앵커가, 도착은 아래 핀이 이미 그린다. */
    (route.turns || []).forEach((t, i) => {
      if (!t || t.dot === false || !t.lat || !t.lng) return;
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", t.label || `${i + 1}번째 안내 지점`);
      el.style.cssText =
        "display:block;width:14px;height:14px;border-radius:999px;padding:0;cursor:pointer;"
        + "background:var(--route-turn-bg);border:var(--stroke-bold) solid var(--route-line);"
        + "box-shadow:var(--shadow-raised);transition:transform var(--dur-fast) var(--ease-standard)";
      el.addEventListener("click", () => cb.current.onSelectTurn && cb.current.onSelectTurn(i));
      keep(new k.maps.CustomOverlay({
        map: m, position: new k.maps.LatLng(t.lat, t.lng), content: el, yAnchor: 0.5, zIndex: 5,
      })).__turn = i;
    });

    /* 도착지 — 출발(파란 점)과 형태가 다른 핀이라야 어느 쪽이 목적지인지 바로 읽힌다 */
    const dest = route.dest;
    if (dest && dest.lat && dest.lng) {
      const mk = keep(new k.maps.Marker({
        map: m, position: new k.maps.LatLng(dest.lat, dest.lng),
        image: images.current && images.current.dest, title: dest.name, zIndex: 6,
      }));
      k.maps.event.addListener(mk, "click", () => cb.current.onSelectDest && cb.current.onSelectDest(dest));
    }
  }, [route, ready]);

  /* ── 좌표 지정 핀 (관리자) ────────────────────────────────────────────────
     끌어 옮길 수 있는 마커 하나. 누르는 것(위 지도 click)과 끄는 것 둘 다 같은 값을 낸다 —
     정확한 자리를 찍기 어려울 때 대충 누른 뒤 끌어 맞추는 것이 실제 사용 순서다.
     핀 색은 도착지(--pin-dest)와 같다. "여기다"를 말하는 자리라 성격이 같고,
     둘이 한 화면에 함께 나오는 경우는 없다. */
  /* 의존성을 `pick` 객체가 아니라 **좌표 두 값**으로 잡는다. 부모가 {lat, lng} 를 인라인으로
     만들어 넘기면 객체는 렌더마다 새것이라, 객체를 의존성에 두면 핀을 끄는 도중에도
     이펙트가 다시 돌아 마커가 지워졌다 다시 생긴다 — 끌기가 손에서 놓친다. */
  const pickLat = pick ? pick.lat : null;
  const pickLng = pick ? pick.lng : null;
  const pickLabel = pick ? pick.label : null;
  React.useEffect(() => {
    const k = kakaoRef.current, m = map.current;
    if (!k || !m) return;
    if (pickMarker.current) { pickMarker.current.setMap(null); pickMarker.current = null; }
    if (pickLat == null || pickLng == null) return;

    const mk = new k.maps.Marker({
      map: m, position: new k.maps.LatLng(pickLat, pickLng),
      image: images.current && images.current.dest,
      draggable: true, zIndex: 9, title: pickLabel || "지정 좌표",
    });
    k.maps.event.addListener(mk, "dragend", () => {
      if (!cb.current.onPick) return;
      const ll = mk.getPosition();
      cb.current.onPick(+ll.getLat().toFixed(6), +ll.getLng().toFixed(6));
    });
    pickMarker.current = mk;
  }, [pickLat, pickLng, pickLabel, ready]);

  /* 고른 안내 지점을 키운다 (목록 ↔ 지도). 위 이펙트를 다시 돌리지 않는다 —
     선을 지웠다 다시 그리면 항목을 누를 때마다 경로가 깜빡인다. */
  React.useEffect(() => {
    routeArt.current.forEach(ov => {
      if (ov.__turn === undefined || !ov.getContent) return;
      const el = ov.getContent();
      if (!el || !el.style) return;
      const on = ov.__turn === activeTurn;
      el.style.transform = on ? "scale(1.75)" : "none";
      el.style.background = on ? token("--route-turn-active", "#3d7be5") : token("--route-turn-bg", "#ffffff");
      ov.setZIndex(on ? 7 : 5);
    });
  }, [activeTurn, route, ready]);

  /* 코스에서 고른 곳을 키우고 색을 바꾼다. 마커 이미지가 아니라 DOM 이라 스타일만 바꾸면
     된다 — 다른 레이어의 선택 강조(아래)와 방식이 다른 이유다.

     고른 곳은 **호박색**이다. 초록을 한 단계 진하게 하는 것으로는 부족했다: 핀도 점선도
     전부 초록이라 어두워진 한 칸은 옆에 두고 비교해야 보인다 (--pin-course-active 주석).
     방문한 곳은 색을 더 만들지 않고 같은 초록을 흐리게 둔다. */
  React.useEffect(() => {
    const done = new Set(courseDoneIds);
    courseOverlays.current.forEach((ov, id) => {
      const el = ov.getContent();
      if (!el || !el.style) return;
      const on = id === selectedId;
      el.style.background = on ? token("--pin-course-active", "#f0dc72") : token("--brand-primary", "#2f9260");
      el.style.color = on ? token("--pin-course-active-ink", "#161f1a") : token("--text-on-brand", "#ffffff");
      /* 고른 곳은 방문했더라도 또렷하게 둔다 — 지금 보고 있는 것이 흐리면 무엇을 골랐는지 모른다 */
      el.style.opacity = !on && done.has(id) ? token("--pin-course-done-opacity", ".45") : "1";
      el.style.transform = on ? "scale(1.28)" : "none";
      el.style.transition = "transform var(--dur-fast) var(--ease-standard), opacity var(--dur-fast) var(--ease-standard)";
      ov.setZIndex(on ? 8 : 6);
    });
  }, [selectedId, courseDoneIds, course, ready]);

  /* ── 선택 강조 (2026-08-18 개정) ──────────────────────────────────────────
     전에는 핀 색만 짙은 초록으로 바꿨다. 그것으로는 **몰려 있는 곳에서 못 찾는다** —
     점포 335곳이 골목 하나에 있어 화면에 핀 열 개가 겹치는데, 그중 하나가 초록에서
     짙은 초록이 된 것은 옆에 두고 비교해야 보인다. 목록에서 고른 사람은 애초에 어느
     핀인지 모르니 비교할 대상이 없다. 셋을 함께 준다:

       1. 크기   --pin-selected-scale (1.34배). 색을 못 봐도 전해진다.
       2. 색     --pin-selected
       3. 물결   핀 아래에서 번지는 원 (--pin-selected-halo, yong-pin-pulse)

     **클러스터에서 꺼낸다.** 점포 마커는 클러스터러 안에 있어서, 고른 핀이 뭉침 숫자
     뒤에 그대로 숨는 경우가 있었다 — 카드는 떴는데 지도에는 아무 변화가 없다. 고른
     동안만 클러스터에서 빼 지도에 직접 얹고, 놓으면 되돌린다.

     정리(cleanup)로 되돌리는 이유: `stores` 가 바뀌면 위 마커 효과가 clusterer 를
     통째로 비우는데, React 는 **모든 정리를 먼저 돌린 뒤** 효과 본문을 돌린다.
     그래서 비우기 전에 이 마커가 제자리로 돌아가고, 이후 새 마커로 다시 칠해진다.
     (그 순서 때문에 deps 에 stores·facilities·districts 가 함께 들어 있다.) */
  React.useEffect(() => {
    const k = kakaoRef.current, m = map.current, cl = clusterer.current;
    if (!k || !m || !images.current || !selectedId) return undefined;

    const inCluster = storeMarkers.current.has(selectedId);
    const mk = storeMarkers.current.get(selectedId)
      || facilityMarkers.current.get(selectedId)
      || districtMarkers.current.get(selectedId);
    if (!mk) return undefined;

    if (inCluster && cl) { cl.removeMarker(mk); mk.setMap(m); }
    mk.setImage(images.current.selected);
    mk.setZIndex(9);

    const halo = new k.maps.CustomOverlay({
      map: m, position: mk.getPosition(), content: haloElement(),
      yAnchor: 0.5, xAnchor: 0.5, zIndex: 1,
    });

    return () => {
      halo.setMap(null);
      /* 목록이 걸러지며 그 사이 대상이 사라졌을 수 있다 — 이미지를 못 찾으면 그냥 둔다.
         어차피 바로 뒤에 마커 효과가 표를 새로 짓는다 */
      const base = baseImage(byId.get(selectedId));
      if (base) mk.setImage(base);
      mk.setZIndex(inCluster ? 1 : 2);
      if (inCluster && cl) { mk.setMap(null); cl.addMarker(mk); }
    };
  }, [selectedId, byId, baseImage, ready, stores, facilities, districts]);

  if (failed) {
    /* SDK 를 못 띄웠을 때도 화면 검증은 계속되어야 한다 — 레이어 구조가 동일한 목업으로 대체 */
    return <MapCanvas anchorLabel={anchorLabel} bottomPad={`${bottomPad}px`} note={`지도를 불러오지 못했습니다 · ${failed}`} style={style} />;
  }

  return <div ref={host} style={{ position: "absolute", inset: 0, zIndex: "var(--z-map)", background: "var(--surface-sunken)", ...style }} {...rest} />;
}
