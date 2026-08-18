import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, KakaoMap, RouteSteps, routeStepText,
  Button, Badge, Notice, SectionHeader, Icon, EmptyState, FacilityIcon, CategoryIcon,
  FACILITY_LABELS, CATEGORY_LABELS, OnnuriBadge, ro,
} from "../../design-systems/index.js";
import { KAKAO_APP_KEY, WALK_M_PER_MIN, FACILITY_AS_OF } from "../main/config.js";
import { requestWalkRoute, distanceM } from "../main/data/walkRoute.js";

/* S07 길찾기 (기능명세서 v1.0 4장 S07 행).
 * 관련 기능: U-NV-01(도보 경로 안내) · U-NV-02(경로 지도 표시) · U-NV-03(구간별 상세 안내)
 *            U-NV-04(경로 실패 처리) · U-NV-05(호출량 제어) · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 길찾기
 *   ─────────────────────────────────
 *   경로 지도 — 파란 실선 + 출발(QR 앵커) + 도착 핀      ← U-NV-02
 *   ─────────────────────────────────
 *   ● 둔전 시장 입구 버스정류장   (출발 · QR 지점)
 *   ▼
 *   ⚑ 둔전마을회관 AED           (도착)
 *   [도보 6분]  [약 380m]
 *   ─────────────────────────────────
 *   ● 출발                    둔전 시장 입구 버스정류장   ← U-NV-03
 *   ↰ 120m 앞에서 좌회전       둔전로
 *   ↱ 50m 앞에서 우회전        둔전2로 방향
 *   ⚑ 30m 앞 도착             둔전마을회관 AED
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * 하단 액션바가 없다. 되돌아가는 길은 왼쪽 위 뒤로가기 하나뿐이다 (footer 주석 참조).
 *
 * ── 출발지는 고를 수 없다 (다만 언제나 QR 지점인 것은 아니다) ────────────
 * 이 화면에는 출발지 입력란이 없다. 보통은 QR 스캔 지점이 출발지다 — 화면의 "내 위치"가
 * 그 고정 좌표이기 때문이다 (제안서 3-1 · U-CM-04). GPS 를 쓰지 않으므로 사용자가
 * 이동해도 이 좌표는 바뀌지 않고, 그래서 컨텍스트 바가 늘 기준점을 보여준다.
 *
 * **예외는 골목 한바퀴(S08)에서 들어온 경우 하나다** (2026-08-18). 코스의 ②로 가는 길은
 * ①에서 출발한다. 코스를 도는 사람은 이미 ①에 서 있고, 거기서 QR 지점으로 되돌아갔다가
 * 다시 나오지 않는다. 그래도 **고르는 것이 아니라 코스 순서가 정하는 값**이라 입력란이
 * 없다는 사실은 그대로다. 어느 쪽인지는 `fromAnchor` 로 들어온다 (MainApp 이 URL 에서 읽는다).
 *
 * ── 목록의 거리와 여기 거리가 다른 이유 ─────────────────────────────────
 * 목록·상세의 "약 320m"는 **QR 지점에서의 직선거리**다 (U-FC-06 이 그렇게 못박았다 —
 * 목록 단계에서 경로 API 를 부르지 않기 위해서다). 이 화면의 거리는 **실제로 걷는 길이**라
 * 20~35% 길다. 두 수치가 다른 것은 오류가 아니지만, 설명 없이 두면 사용자는 둘 중 하나가
 * 틀렸다고 읽는다. 그래서 아래 고지에 한 줄로 적는다.
 * **출발지가 QR 지점이 아닐 때는 그 줄을 적지 않는다** — 목록의 수는 QR 지점 기준이라
 * 여기 거리와 견줄 대상이 아니고, 견주게 두면 없던 오해를 만든다.
 *
 * ── 경로를 못 받았을 때 (U-NV-04) ───────────────────────────────────────
 * 빈 화면을 만들지 않는다. 좌표만 있으면 방향과 직선거리는 언제나 말할 수 있으므로
 * "북서쪽으로 약 320m"까지는 안내하고, 지도에는 회색 점선을 긋는다.
 * **턴바이턴 목록은 만들지 않는다** — 없는 경로를 지어내는 것이 안내가 없는 것보다 나쁘다.
 * 이 상태는 `?route=fallback` 으로 열어 확인할 수 있다 (walkRoute.js).
 */

const km = m => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);
const mins = sec => Math.max(1, Math.round(sec / 60));

export function RouteView({ dest, origin, asOf, fromAnchor = true, onBack, onClose, onOpenDest, onReport }) {
  const [result, setResult] = React.useState(null);
  const [active, setActive] = React.useState(-1);
  const [mapReady, setMapReady] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);   /* [다시 시도] — 값이 바뀌면 아래가 다시 돈다 */
  const mapApi = React.useRef(null);

  /* 경로 요청 (U-NV-01). 캐시와 쿼터, 실패 폴백은 전부 walkRoute 안에서 끝난다 —
     이 화면에는 오류 상태가 따로 없고, 언제나 result 하나만 본다.
     화면을 떠난 뒤 응답이 와도 무시한다 (dead) — 뒤로가기가 즉시여야 한다. */
  React.useEffect(() => {
    let dead = false;
    setResult(null);
    setActive(-1);
    requestWalkRoute(origin, dest).then(r => { if (!dead) setResult(r); });
    return () => { dead = true; };
  }, [origin, dest, attempt]);

  /* 경로 전체가 한 화면에 들어와야 "여기서 저기까지"가 읽힌다. 도착지로 확대해 들어가면
     출발점이 화면 밖이라 선이 어디서 오는지 알 수 없다 (S08 이 같은 이유로 fitAll 을 쓴다).
     지도와 경로 중 늦게 오는 쪽에 맞춰야 하므로 둘 다 의존성에 넣는다. */
  const fitAll = React.useCallback(() => {
    if (mapApi.current && result && result.path.length) {
      mapApi.current.fitTo(result.path, { top: 24, bottom: 24 });
    }
  }, [result]);

  React.useEffect(() => {
    if (mapReady && result) fitAll();
  }, [mapReady, result, fitAll]);

  /* 안내 항목을 누르면 지도가 그 지점으로 간다. 지도의 꺾임 표시를 눌러도 같은 항목이 켜진다
     (KakaoMap 의 onSelectTurn). 목록과 지도가 같은 것을 가리키는 짝짓기는 S08 에서 정한 규칙이다. */
  const pickStep = React.useCallback(i => {
    setActive(i);
    const s = result && result.steps[i];
    if (s && s.lat && mapApi.current) mapApi.current.focus(s.lat, s.lng);
  }, [result]);

  const loading = !result;
  const failed = result && result.source === "fallback";
  /* source 가 "sample" 인지는 화면이 구분하지 않는다 (2026-08-18). 예전에는 그때
     "연동 전 예시" 라는 붉은 고지를 달았는데, 그것은 실제로 쓰는 사람이 아니라 검수하는
     우리를 향한 문장이었다. 경로 출처는 walkRoute.js 가 감추기로 한 것이고(머리말),
     화면은 받은 경로를 그냥 안내한다. */

  /* 지도에 넘길 것 — 선, 꺾임 표시, 도착 핀. steps 를 그대로 넘겨 인덱스를 맞춘다 */
  const mapRoute = React.useMemo(() => {
    if (!result) return null;
    return {
      path: result.path,
      straight: result.straight,
      dest: { name: dest.name, lat: dest.lat, lng: dest.lng },
      turns: result.steps.map(s => ({ lat: s.lat, lng: s.lng, dot: s.dot, label: routeStepText(s) })),
    };
  }, [result, dest]);

  /* 목록·상세가 쓰는 직선거리 (U-FC-06). 아래 고지에서 도보 거리와 나란히 적는다.
     **목록이 실제로 보여준 값(dest.dist)을 그대로 인용한다.** 좌표에서 다시 재면 점포에서
     어긋난다 — dunjeon.js 의 좌표 생성이 반지름에 이방성 배율을 먹여서 좌표상 거리가
     dist 의 0.6~1.25 배다. 고지가 "목록에서 보신 약 nnn m" 라고 못박는 문장이라,
     목록에 없던 숫자를 적으면 사용자가 본 적 없는 값을 인용하는 셈이 된다.
     dist 를 갖지 않는 목적지(딥링크 등)에서만 좌표로 잰다. */
  const straight = dest.dist != null ? dest.dist : Math.round(distanceM(origin, dest));
  const isFacility = Boolean(dest.type && FACILITY_LABELS[dest.type]);
  const kindLabel = isFacility ? (FACILITY_LABELS[dest.type] || "공공시설") : (CATEGORY_LABELS[dest.cat] || "점포");

  return (
    /* 뒤로는 한 칸(대개 도착지 상세)으로, [X]는 지도로 나간다. 이 화면은 목록 → 상세 →
       길찾기로 두 칸 쌓여 들어오는 것이 보통이라, 지도로 돌아가려면 뒤로를 두 번 눌러야 한다.
       두 번째가 무엇을 걷어낼지는 눌러봐야 알기 때문에 나가는 길을 따로 둔다. */
    <DetailPage title="길찾기" onBack={onBack} onClose={onClose} closeLabel="지도로 나가기"
      /* ── 평소에는 하단 액션바가 없다 (2026-08-18) ──────────────────────────────
         [도착지 정보 보기]를 뺐다. 여기까지 온 사용자에게 남은 일은 걷는 것이고, 화면이
         할 일은 경로를 보여주는 것뿐이다. 되돌아가는 길은 **왼쪽 위 뒤로가기 하나**로 모은다 —
         화면 아래에 또 하나를 두면 "뒤로"와 "정보 보기"가 대개 같은 곳으로 가면서 둘 중
         무엇이 되돌아가는 버튼인지 흐려진다. 지도의 도착 핀을 눌러도 상세로 갈 수 있다
         (KakaoMap 의 onSelectDest).

         실패했을 때만 [다시 시도]가 선다. 그때는 화면에 경로가 없어 사용자가 할 수 있는
         일이 실제로 하나 생기기 때문이다. 평소에도 보이면 경로가 미덥지 않다는 인상을 준다. */
      footer={failed ? (
        <Button variant="primary" size="lg" icon="rotate-cw" block onClick={() => setAttempt(n => n + 1)}>
          다시 시도
        </Button>
      ) : null}>

      <DetailBody style={{ paddingTop: 0 }}>
        {/* ── 경로 지도 (U-NV-02) ────────────────────────────────────────
               S08 과 같은 비율·여백을 쓴다. 상세 화면 안의 지도가 화면마다 다른 크기면
               같은 앱의 같은 장치로 읽히지 않는다. */}
        <div style={{ position: "relative", width: "auto", aspectRatio: "4 / 3", maxHeight: "46vh",
          margin: "0 calc(var(--gutter-screen) * -1)",
          borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
          <KakaoMap
            appKey={KAKAO_APP_KEY}
            center={origin}
            anchorLabel={origin.name}
            level={3}
            route={mapRoute}
            activeTurn={active}
            mapRef={mapApi}
            onReady={() => setMapReady(true)}
            onSelectTurn={pickStep}
            onSelectDest={onOpenDest} />
        </div>

        {/* ── 출발 → 도착 ────────────────────────────────────────────────
               "어디서 어디까지"가 지도 밖에서도 글자로 읽혀야 한다. 지도는 앱키가 없거나
               도메인이 미등록이면 목업으로 떨어지는데(KakaoMap), 그때도 이 줄은 그대로 남는다. */}
        <section>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            {/* 왼쪽 기둥 — 출발점, 잇는 선, 도착점. RouteSteps 의 세로선과 같은 어법이다 */}
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", width: 22, paddingTop: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: "var(--pin-anchor)",
                border: "var(--stroke-bold) solid var(--pin-stroke)", boxShadow: "0 0 0 3px var(--pin-anchor-halo)" }} />
              <span aria-hidden="true" style={{ flex: 1, width: 2, minHeight: 18, margin: "5px 0",
                background: "var(--yong-ink-100)", borderRadius: 999 }} />
              <Icon name="map-pin" size={18} style={{ color: "var(--pin-dest)" }} />
            </div>

            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {fromAnchor ? "출발 · QR 스캔 지점" : "출발 · 코스에서 앞선 가게"}
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)",
                  color: "var(--text-heading)", lineHeight: 1.45, wordBreak: "keep-all" }}>{origin.name}</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.4 }}>도착</div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  {isFacility
                    ? <FacilityIcon type={dest.type} size={20} />
                    : <CategoryIcon type={dest.cat} size={20} style={{ color: "var(--text-muted)" }} />}
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)",
                    color: "var(--text-heading)", lineHeight: 1.45, wordBreak: "keep-all" }}>{dest.name}</span>
                  {dest.onnuri ? <OnnuriBadge size="sm" /> : null}
                </div>
                <div style={{ marginTop: 2, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
                  {kindLabel}{dest.addr ? ` · ${dest.addr}` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* ── 총 거리와 예상 소요시간 (U-NV-02) ──────────────────────────
                 폴백일 때는 "도보 6분"을 적지 않는다. 그 값은 실제로 걷는 길이 기준인데
                 폴백이 아는 것은 직선거리뿐이라, 같은 자리에 같은 형식으로 적으면
                 경로를 받은 것처럼 읽힌다. */}
          {result ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "var(--space-4)" }}>
              {failed ? (
                <>
                  <Badge tone="warning" dot>경로 안내 없음</Badge>
                  <Badge tone="neutral">직선 약 {km(result.distance)}</Badge>
                  <Badge tone="neutral">{result.compass}쪽 방향</Badge>
                </>
              ) : (
                /* 여기 적는 것은 **걷기 전에 판단할 값** 둘뿐이다 — 얼마나 걸리고 얼마나 먼가.
                   "안내 n단계"도 있었는데 뺐다. 걸을지 말지를 정하는 데 쓰이지 않는 수이고,
                   바로 아래 목록을 보면 몇 줄인지 그냥 보인다. 칩이 셋이 되면 앞의 둘도
                   같은 무게로 읽혀 정작 중요한 두 값이 묻힌다. */
                <>
                  <Badge tone="brand" dot>도보 {mins(result.duration)}분</Badge>
                  <Badge tone="neutral">약 {km(result.distance)}</Badge>
                </>
              )}
            </div>
          ) : null}
        </section>

        {/* ── 로딩 ───────────────────────────────────────────────────────
               경로는 네트워크로 오므로 반드시 기다리는 순간이 있다. 그 사이를 비워두면
               "눌렀는데 아무 일도 안 일어났다"가 된다 (예시 경로도 일부러 늦춘 이유다). */}
        {loading ? (
          <div aria-live="polite" aria-busy="true">
            <EmptyState pose="curious" base="../../design-systems/"
              title="도보 경로를 찾고 있어요"
              description={`${ro(origin.name)}부터 ${dest.name}까지`} />
          </div>
        ) : null}

        {/* ── 경로 실패 폴백 (U-NV-04) ───────────────────────────────────── */}
        {failed ? (
          <Notice tone="warning" title="도보 경로를 불러오지 못했습니다">
            지금은 상세 경로를 안내드릴 수 없어 방향과 직선거리만 알려드립니다.
            <span style={{ display: "block", marginTop: 4 }}>
              {ro(origin.name)}에서 <b>{result.compass}쪽으로 약 {km(result.distance)}</b> 거리입니다.
              지도의 회색 점선은 실제 걷는 길이 아니라 두 지점을 곧게 이은 선입니다.
            </span>
            {result.reason ? (
              <span style={{ display: "block", marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
                사유: {result.reason}
              </span>
            ) : null}
          </Notice>
        ) : null}

        {/* ── 상세 경로 안내 (U-NV-03) ────────────────────────────────────
               항목을 누르면 지도가 그 지점으로 간다. 걸으면서 "지금 어디쯤인가"를 짚는 동작이다.

               머리말 오른쪽의 "n개 · 순서대로"는 뺐다. 번호가 매겨진 목록이 바로 아래에
               있어 개수도 순서도 눈으로 보이는데, 그것을 다시 글자로 적으면 머리말이
               목록을 설명하는 줄이 된다.

               [전체 경로 보기]도 뺐다. 지도가 처음부터 경로 전체에 맞춰져 있고, 항목을 눌러
               한 지점으로 들어간 뒤에도 지도를 직접 축소하면 그만이다 — 지도가 이미 할 줄
               아는 일에 버튼을 하나 더 얹고 있었다. */}
        {result && !failed ? (
          <section>
            <SectionHeader title="상세 경로 안내" />
            <RouteSteps steps={result.steps} activeIndex={active} onPick={pickStep} />
          </section>
        ) : null}

        <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
          style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
          경로 오류 신고
        </Button>

        {/* ── 고지 (U-CM-07 · U-CM-08) ────────────────────────────────────
               목록의 직선거리와 여기 도보 거리가 왜 다른지 적는다 (위 머리말 참조).
               "직선거리 · 도보 거리"라는 낱말만 던지면 그 말을 이미 아는 사람에게만 설명이 된다.
               어느 쪽이 실제로 걷는 값인지 먼저 말하고, 나머지 하나가 왜 짧은지를 잇는다.

               **출발지가 QR 지점이 아니면 그 문장을 적지 않는다.** 목록의 수는 QR 지점에서
               잰 값이라 여기 거리와 견줄 대상이 아니고, 나란히 적으면 없던 오해를 만든다.
               대신 어디서 잰 거리인지를 밝힌다 — 코스 ②의 "약 95m"가 QR 지점에서의 거리로
               읽히면 그 수는 완전히 틀린 안내가 된다. */}
        <DetailNotice asOf={isFacility ? `공공시설 정보 ${FACILITY_AS_OF}` : `점포 정보 ${asOf || ""}`}>
          {result && !failed ? (
            <>
              <span style={{ display: "block" }}>
                {fromAnchor ? (
                  <>
                    위에 적힌 <b>약 {km(result.distance)}</b>가 실제로 걸어가는 길을 따라 잰 거리입니다.
                    목록에서 보신 약 {km(straight)}는 두 지점을 곧게 이은 직선거리라 더 짧게 나옵니다.
                  </>
                ) : (
                  <>
                    위에 적힌 <b>약 {km(result.distance)}</b>는 QR 지점이 아니라 <b>{origin.name}</b>에서
                    걸어가는 거리입니다. 코스는 순서대로 도는 것이라 앞선 가게에서 이어 걷는 기준으로 안내합니다.
                  </>
                )}
              </span>
              <span style={{ display: "block", marginTop: 4 }}>
                도보 {mins(result.duration)}분은 성인 걸음(분당 {WALK_M_PER_MIN}m) 기준이며,
                신호 대기나 경사에 따라 달라질 수 있습니다.
              </span>
            </>
          ) : null}
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default RouteView;
