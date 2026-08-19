import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, KakaoMap, MapPreviewCard, Button, Badge, Icon,
  CategoryIcon, CATEGORY_LABELS, OnnuriBadge, SectionHeader, ProgressBar,
  TextButton, Chip, Mascot, Notice, VisuallyHidden,
} from "../../design-systems/index.js";
/* WALK_M_PER_MIN 을 여기서 쓰지 않는다 — 구간 시간(legMin)은 data/coursePlan.js 가 잰다.
   화면에서 따로 환산하면 같은 구간이 두 값으로 갈린다. */
import { KAKAO_APP_KEY } from "../main/config.js";
import { useCourseVisits } from "../main/data/courseVisits.js";
import { planCourse, nearestChain } from "../main/data/coursePlan.js";

/* S08 골목 한바퀴 코스 상세 (기능명세서 v1.0 4장 S08 행).
 * 관련 기능: U-DC-03(골목 한바퀴 추천 코스) · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 코스명
 *   ─────────────────────────────────
 *   코스 지도 — 순번 핀 + 점선 경로        ← QR 지점에서 출발한다
 *     └ [미리보기 카드]  순번을 고르면 지도 바닥에 뜬다 · [길찾기] [상세 보기]
 *   도보 n분 · n곳 · 약 nnn m
 *   ─────────────────────────────────
 *   (조아용) 2/4 방문  ▓▓▓░░░░    [처음부터]   ← 방문 완료 (선택 기능)
 *   ─────────────────────────────────
 *        ⌗                                 ← 출발점(QR 지점)에만 띠가 따로 있다
 *   2분  ┊
 *        ①  가게  업종                     ← 누르면 지도가 그 순번으로 가고 카드가 뜬다
 *        ┊      중식 · 중국집                  (U-DC-03 "순번 이동")
 *   3분  ┊                                 ← 시간은 점선 왼쪽, 그 구간의 세로 한가운데
 *        ┊      [✓ 방문 완료]                  (칩보다 위에 온다 — 칩이 아니라 선에 딸렸다)
 *        ②  가게 (흐림)          (조아용)  ← 방문 도장. 점선은 ①에서 ②까지 안 끊긴다
 *        ┊      [✓ 방문함]
 *   2분  ┊
 *        ③  가게  [다음 차례]              ← 마지막 아래로는 선이 없다
 *   ...
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * ── 셸의 지도와 같은 어법을 쓴다 ────────────────────────────────────────
 * 순번을 고르면 지도 바닥에 미리보기 카드가 뜬다. S02·S03 에서 마커를 눌렀을 때와
 * **같은 컴포넌트**(MapPreviewCard)이고 버튼도 같다 — 지도 위의 무언가를 눌렀을 때
 * 일어나는 일이 화면마다 다르면 사용자는 화면마다 다시 배워야 한다.
 * 고른 핀은 호박색이다. 코스 핀도 점선도 전부 초록이라 초록을 진하게 하는 것으로는
 * 구분되지 않았다 (tokens/icons.css 의 --pin-course-active 주석).
 *
 * ── 방문 완료는 화면의 전제가 아니다 ────────────────────────────────────
 * 한 번도 누르지 않아도 이 화면은 예전과 똑같이 동작한다. 진행률이 0/4 로 서 있을 뿐이다.
 * 순서를 강제하지 않고(문 닫은 가게를 건너뛰는 일은 흔하다), 방문한 곳을 목록에서 빼지
 * 않으며(빼면 몇 번째였는지 알 수 없다), 언제든 되돌릴 수 있다.
 * GPS 로 자동 판정하지 않는다 — 기록의 성격은 data/courseVisits.js 머리말 참조.
 *
 * ── 순서를 벗어나면 남은 순서를 다시 짠다 (2026-08-18) ──────────────────
 * "순서를 강제하지 않는다"고 해놓고 벗어났을 때 안내가 그대로면, 그 안내는 틀린 수가 된다.
 * ①을 들르고 ③으로 갔는데 "②가 다음 차례, ②까지 3분"이라고 말하면 그 3분은 **①에서 잰
 * 값**이고, 지금 서 있는 ③에서는 맞지 않는다. 방문 표시를 누를 때마다 마지막으로 들른 곳을
 * 기준으로 남은 곳을 다시 잇고 구간을 다시 잰다 (data/coursePlan.js).
 *
 * 방문한 곳은 **실제로 걸은 차례**로 앞에 남는다 — ③을 두 번째로 갔다면 그 줄은 ②다.
 * 코스를 도는 중에 알고 싶은 것은 "추천안에서 몇 번이었나"가 아니라 "내가 몇 번째로
 * 갔나"이기 때문이다. 지도의 순번 핀과 점선 경로도 같은 배열을 보므로 함께 다시 그려진다.
 * 머리말의 총 시간·거리도 다시 짠 순서의 합이다 — 아래 구간을 더해본 사람과 어긋나지 않게.
 *
 * 추천 순서를 되찾는 길은 [처음부터]다. 순서가 바뀌었을 때는 목록 위에 왜 바뀌었는지
 * 한 줄을 적는다 — 적지 않으면 목록이 저 혼자 뒤바뀐 것처럼 보이고, 그건 고장으로 읽힌다.
 *
 * ── 지도를 여기서 새로 만드는 이유 ──────────────────────────────────────
 * 셸의 지도는 세 탭이 공유하는 한 개뿐이고 U-CM-16 이 그것의 재로딩을 막는다.
 * 이 화면은 탭이 아니라 그 위에 덮이는 페이지이고, 보여줄 것도 다르다 —
 * 탭 지도는 "QR 지점 주변에 무엇이 있나", 이 지도는 "이 네 곳을 어떤 순서로 도나".
 * 두 목적을 한 인스턴스에 겹치면 오버레이를 닫을 때 탭 지도의 카메라와 레이어를
 * 원래대로 되돌리는 일이 남는다. SDK 는 이미 로드되어 있어 인스턴스 하나가 더 붙는
 * 비용은 크지 않다.
 *
 * ── 화면에 적지 않는 것 ─────────────────────────────────────────────────
 * "반경 300~500m". 명세서 U-DC-03 이 "300~500m는 내부 로직 값이며 사용자 필터가 아니다"
 * 라고 못박았다. 사용자가 읽어야 할 것은 몇 분 걸리고 어디를 도는가다.
 */
export function CourseDetail({ course, anchor, asOf, onBack, onPickStore, onRouteStore, onReport,
  base = "../../design-systems/" }) {
  const c = course;

  /* 지도와 목록이 같은 "지금 고른 곳"을 공유한다. 목록에서 누르면 지도가 옮겨가고,
     지도의 순번 핀을 눌러도 같은 상태가 바뀐다 (U-DC-03 "순번 이동").

     **처음에는 아무 것도 고르지 않은 상태로 연다** (null). 셸의 지도와 같은 어법이다 —
     거기서도 마커를 누르기 전에는 미리보기 카드가 없다. 열자마자 ①이 골라져 있으면
     코스 전체를 보여주려고 맞춰둔 지도 위에 카드가 덮여 첫인상이 "한 곳"이 된다. */
  const [activeId, setActiveId] = React.useState(null);
  const mapApi = React.useRef(null);

  /* ── 방문 완료 (선택 기능) ───────────────────────────────────────────────
     기록은 화면이 들고 있지 않다 — 가게를 한 번 눌러보고 돌아오면 이 화면은 언마운트된다.
     courseVisits.js 가 세션 단위로 보관한다 (그쪽 머리말에 왜 세션인지 적어두었다).

     **아무 것도 누르지 않아도 화면은 온전하다.** 진행률은 0/4 로 서 있고, 목록은 지금까지와
     똑같이 동작한다. 이 기능은 코스를 도는 사람이 스스로 붙이는 표시일 뿐 화면의 전제가
     아니다 — 그래서 순서를 강제하지도, 방문한 곳을 목록에서 빼지도 않는다. */
  const { visited, toggle, clear } = useCourseVisits(c.id);
  const isDone = React.useCallback(id => visited.includes(id), [visited]);

  /* ── 순서는 방문한 곳을 기준으로 다시 짜인다 (2026-08-18) ──────────────────
     ①을 들르고 ③으로 갔는데도 "②가 다음 차례, ②까지 3분"이라고 말하면, 그 3분은
     **①에서 잰 값**이라 지금 서 있는 ③에서는 맞지 않는다. 순서를 벗어나도 된다고 해놓고
     벗어나면 틀린 수를 주는 셈이다. 그래서 방문 표시를 누를 때마다 마지막으로 들른 곳을
     기준으로 남은 곳을 다시 잇고 구간을 다시 잰다 (data/coursePlan.js).

     방문한 곳은 목록에서 빼지 않고 **실제로 걸은 차례**로 앞에 남는다 — 번호가 추천 순번이
     아니라 걸은 차례가 된다. 코스를 도는 중에 알고 싶은 것은 "추천안에서 몇 번이었나"가
     아니라 "내가 몇 번째로 갔나"다.

     아무 것도 누르지 않았으면 추천 순서 그대로다 (planCourse 가 계산 없이 돌려준다) —
     "한 번도 누르지 않아도 예전과 똑같다"는 이 화면의 약속이다.

     지도도 같은 배열(stops)을 받으므로 순번 핀과 점선 경로가 목록과 함께 다시 그려진다. */
  const plan = React.useMemo(
    () => planCourse(c.stops || [], visited, anchor), [c.stops, visited, anchor]);
  const stops = plan.order;

  /* "지금 고른 곳"은 **다시 짜인 순서 안에서** 찾는다. 그래서 이 두 줄은 stops 아래에 있어야
     한다 — 위에 두면 선언 전 참조(TDZ)라 화면이 통째로 죽는다. activeIndex 를 쓰는 곳이
     미리보기 카드의 "직전 가게"라서, 순서가 바뀌면 이 값도 함께 따라와야 맞기도 하다. */
  const active = stops.find(s => s.id === activeId) || null;
  const activeIndex = stops.findIndex(s => s.id === activeId);

  const doneCount = stops.filter(s => isDone(s.id)).length;
  const allDone = stops.length > 0 && doneCount === stops.length;

  /* "다음 차례" — 아직 방문하지 않은 곳 중 순서가 가장 앞선 곳. 이것은 **표시일 뿐**이고
     다른 곳을 누르는 것을 막지 않는다 (문 닫은 가게를 건너뛰는 일은 흔하다). */
  const nextIndex = stops.findIndex(s => !isDone(s.id));

  /* 처음 열렸을 때는 코스 전체가 한눈에 들어와야 한다. 첫 지점으로 확대해 들어가면
     "네 곳을 도는 코스"라는 것이 지도에서 읽히지 않는다. QR 지점까지 함께 담는다 —
     출발점이 화면 밖이면 점선이 어디서 오는지 알 수 없다. */
  const fitAll = React.useCallback(() => {
    if (mapApi.current) mapApi.current.fitTo([anchor, ...stops], { top: 24, bottom: 24 });
  }, [anchor, stops]);

  /* 고르기만 하고 카메라는 아래 effect 가 옮긴다. 여기서 곧장 focus 하면 **카드가 아직
     서기 전**이라 지도가 가림 높이를 0 으로 알고 핀을 화면 한가운데에 놓는데, 그 자리가
     바로 다음 순간 카드가 덮는 자리다. 카드 높이를 알고 나서 한 번만 옮긴다. */
  const goTo = React.useCallback(id => setActiveId(id), []);

  /* 카드에 가려지는 높이. 지도는 이 값만큼 핀을 위로 올려 잡는다 (KakaoMap 의 bottomPad,
     5-3 결정 2 와 같은 규칙 — 셸에서는 시트 높이가 이 자리에 들어간다). */
  const [cardH, setCardH] = React.useState(0);

  React.useEffect(() => {
    const s = stops.find(x => x.id === activeId);
    if (s && mapApi.current) mapApi.current.focus(s.lat, s.lng);
  }, [activeId, cardH, stops]);

  /* 방문 표시를 켜면 지도를 다음 차례로 옮긴다 — 방금 들른 곳을 계속 비추고 있을 이유가 없고,
     "다음은 어디"가 이 화면에서 가장 흔한 다음 질문이다. 끌 때는 옮기지 않는다:
     되돌리는 동작인데 화면이 딴 데로 가면 무엇을 되돌렸는지 확인할 수 없다. */
  const markVisited = React.useCallback(s => {
    const turningOn = !isDone(s.id);
    toggle(s.id);
    if (!turningOn) return;
    /* 다음 차례는 **방금 들른 곳에서 가장 가까운** 남은 곳이다 — 아래 렌더에서 새로 짜일
       순서의 첫 곳과 같은 값이다. 여기서 미리 같은 규칙으로 구한다: `visited` 갱신은 다음
       렌더에나 반영되므로 지금 plan 을 읽으면 한 박자 늦은 순서를 보게 된다. */
    const rest = stops.filter(x => x.id !== s.id && !isDone(x.id));
    const next = nearestChain(rest, s, 1)[0];
    if (next) goTo(next.id);
  }, [isDone, toggle, stops, goTo]);

  return (
    /* ── 하단 액션바가 없다 (2026-08-18) ──────────────────────────────────────
       [◁][n. 가게 보기][▷] 세 개를 뺐다. 순번을 옮기는 일은 지도 핀과 목록이 이미 하고
       있었고, 가게로 가는 길은 이제 미리보기 카드의 [상세 보기]가 맡는다 — 같은 일을
       하는 자리가 셋이면 어느 것이 무엇인지 배워야 한다.
       화면이 세로로 긴 목록이라, 액션바가 사라진 만큼 목록이 더 보인다. */
    <DetailPage title={c.name} onBack={onBack}>

      <DetailBody style={{ paddingTop: 0 }}>
        {/* ── 코스 지도 — 스크롤해도 위에 붙어 있는다 (2026-08-18) ──────────
               예전에는 목록과 함께 흘러 올라가 사라졌다. 그런데 이 화면에서 목록을 훑는
               이유가 "어디를 어떤 순서로 도나"이고, 그 답의 절반은 지도에 있다.
               목록을 내리는 동안 지도가 없어지면 순번과 위치를 머릿속에서 이어붙여야 한다.

               sticky 는 DetailPage 의 스크롤 상자 기준으로 붙는다. z 는 새 값을 만들지 않고
               --z-filter(300)를 쓴다 — 7단계 표에서 "스크롤해도 고정"이 그 칸이다.
               고정 px 높이 대신 가로 비율로 잡는 것은 그대로다. 화면 폭이 달라도 비율이
               유지되고, 2차 글자 확대에도 지도는 글자가 아니라 그림이라 영향을 받지 않는다.
               position:relative → sticky 로 바뀌어도 KakaoMap 의 absolute inset:0 은 그대로
               동작한다 (sticky 도 위치 지정 요소다). */}
        <div style={{ position: "sticky", top: 0, zIndex: "var(--z-filter)",
          width: "auto", aspectRatio: "4 / 3", maxHeight: "46vh",
          margin: "0 calc(var(--gutter-screen) * -1)", background: "var(--surface-page)",
          borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
          <KakaoMap
            appKey={KAKAO_APP_KEY}
            center={anchor}
            anchorLabel={anchor.name}
            level={3}
            course={stops}
            courseDoneIds={visited}
            selectedId={activeId}
            /* 카드가 덮는 높이를 지도에 알린다 — 그만큼 핀을 위로 올려 잡아 카드 뒤에
               숨지 않는다 (5-3 결정 2. 셸에서는 이 자리에 시트 높이가 들어간다) */
            bottomPad={cardH}
            mapRef={mapApi}
            onReady={fitAll}
            onSelectCourseStop={s => goTo(s.id)} />

          {/* ── 미리보기 카드 ──────────────────────────────────────────────
                 셸의 지도(S02·S03)에서 마커를 눌렀을 때 뜨는 것과 **같은 컴포넌트**다.
                 이 화면만 다른 카드를 그리면 같은 동작이 화면마다 다른 모양이 된다.

                 저기서는 시트 위에 앵커링되지만 여기에는 시트가 없으므로 지도 상자
                 바닥에 붙인다 (bottom=0). compact 로 주소 줄과 여백을 덜어낸다 —
                 이 화면의 지도는 셸의 것보다 작아서 기본 크기로는 지도를 거의 다 덮는다. */}
          {active ? (
            <MapPreviewCard
              item={active}
              compact
              bottom={0}
              onHeightChange={setCardH}
              /* 닫으면 코스 전체로 되돌아간다 — 카드를 닫는 것은 "한 곳 들여다보기"를
                 그만두는 동작이고, 그 반대편이 코스 전체다. [코스 전체 보기] 버튼을
                 따로 두지 않는 이유다. */
              onClose={() => { setActiveId(null); setCardH(0); fitAll(); }}
              /* 출발지는 **코스 순서상 직전 가게**다 (첫 곳만 QR 지점). ②로 가는 길을
                 QR 지점에서 시작하면, ①에 서 있는 사람에게 왔던 길을 되돌아갔다가 다시
                 나오라고 안내하는 셈이 된다.
                 순서가 방문 기록에 따라 다시 짜이므로(plan) 이 "직전 가게"도 함께 바뀐다 —
                 ③을 들르고 남은 곳으로 갈 때 출발지는 ③이다. 사용자가 실제로 서 있는
                 자리에서 안내하는 것이라, 예전처럼 추천안의 직전 순번을 붙들고 있는 것보다
                 맞다 (2026-08-18. 그 전 주석은 "방문 표시와 무관"이라고 적혀 있었다). */
              onRoute={() => onRouteStore && onRouteStore(active, activeIndex > 0 ? stops[activeIndex - 1] : null)}
              onDetail={() => onPickStore(active)} />
          ) : null}
        </div>

        {/* ── 요약 ────────────────────────────────────────────────────── */}
        <div>
          {/* 총 시간·거리는 **지금 화면에 깔린 순서의 합**이다 (plan). 코스 자료의 값
              (c.minutes)이 아니다 — 순서가 다시 짜이면 걷는 길이 달라지는데 머리말만
              추천안의 수를 붙들고 있으면, 아래 구간을 더해본 사람에게 틀린 화면이 된다.
              아무 것도 누르지 않았으면 둘은 같은 값이다. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-2)" }}>
            <Badge tone="brand" dot>도보 {plan.minutes}분</Badge>
            <Badge tone="neutral">{stops.length}곳</Badge>
            <Badge tone="neutral">약 {plan.meters >= 1000 ? `${(plan.meters / 1000).toFixed(1)}km` : `${plan.meters}m`}</Badge>
          </div>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: "var(--lh-body)",
            wordBreak: "keep-all" }}>{c.desc}</p>
          {/* 한 줄로 줄였다 (2026-08-18). 지도의 점선이 실제 걷는 길이 아니라는 설명을
              따로 달고 있었는데, "코스를 나타냅니다"가 그 말을 이미 하고 있다 —
              길을 나타내는 선이라면 "코스"가 아니라 "경로"라고 적었을 것이다.
              실제로 걷는 길은 순번마다 [길찾기]가 따로 안내한다. */}
          <p style={{ marginTop: 4, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
            QR 지점에서 출발해 순서대로 도는 코스를 나타냅니다.
          </p>
        </div>

        {/* ── 진행률 ──────────────────────────────────────────────────────
               카드로 두지 않는다. 흰 상자에 테두리까지 두르면 이 화면에서 가장 큰 덩어리가
               되는데, 여기서 제일 중요한 것은 추천 코스 목록이지 진행률이 아니다.
               조아용 + 한 줄 + 얇은 막대, 세 가지로 끝낸다.

               조아용의 표정이 진행에 따라 바뀐다 — 이 화면에서 캐릭터가 할 수 있는 유일하게
               쓸모 있는 일이다(가만히 서 있는 마스코트는 장식이지만, 상태를 말하는 마스코트는
               정보다). 다만 **캐릭터만으로는 말하지 않는다**: 옆의 "2/4 방문"이 같은 것을
               글자로 적는다. 막대도 색 길이로만 말하지 않도록 그 글자에 기댄다. */}
        <section style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          {/* 세 포즈 모두 **전신(1:1) 그림**이어야 한다. 처음에는 진행 중을 hello 로 두었는데
              그것만 상반신 컷(1.5:1)이라 방문 개수가 바뀔 때 캐릭터가 커졌다 작아졌다 했다
              (Mascot 의 MASCOT_FULL / MASCOT_BUST 주석). curious 는 걸어서 둘러보는 모습이라
              "도는 중"과도 맞는다. */}
          <Mascot pose={allDone ? "thumbsup" : doneCount ? "curious" : "front"} size={64} base={base} alt=""
            style={{ flex: "0 0 auto" }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
              <span style={{ flex: "0 0 auto", fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
                fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.4 }}>
                {doneCount}/{stops.length} 방문
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: "var(--fs-caption)", color: "var(--text-muted)",
                lineHeight: 1.4, wordBreak: "keep-all" }}>
                {allDone ? "다 도셨어요" : doneCount ? "들른 곳에 표시해 두세요" : "표시는 선택입니다"}
              </span>
            </div>
            <ProgressBar value={doneCount} max={stops.length} tone={allDone ? "success" : "brand"}
              label={`${stops.length}곳 중 ${doneCount}곳 방문`} />
          </div>
          {/* 지울 것이 있을 때만 나온다 — 0/4 에 [처음부터]가 서 있으면 무언가 이미 눌린 것처럼 읽힌다 */}
          {doneCount ? (
            <TextButton tone="muted" icon="rotate-ccw" onClick={clear}
              style={{ flex: "0 0 auto", paddingRight: 0 }}>처음부터</TextButton>
          ) : null}
        </section>

        {/* ── 순번 목록 (U-DC-03 "순번 이동") ────────────────────────────
               행을 누르면 지도가 그 순번으로 가고 아래에 미리보기 카드가 뜬다.
               셸의 지도에서 마커를 누르는 것과 같은 동작이므로 같은 카드를 쓴다.
               **꺾쇠(상세로 가는 버튼)를 뺐다** — 그 일은 이제 카드의 [상세 보기]가 한다.

               방문 상태에는 행 배경을 쓰지 않는다. 배경은 "지금 고른 곳"이 가져간 자리라
               같은 수단으로 두 가지를 말하면 둘 다 읽히지 않는다. 방문은
               **조아용 도장 · 흐린 글자 · [방문함] 칩** 셋으로 말하고, 다음 차례는 배지로
               말한다 — 어느 것도 색 하나에 기대지 않는다. */}
        <section>
          <SectionHeader title="추천 코스"
            note={plan.replanned ? `${stops.length}곳 · 다시 짠 순서` : `${stops.length}곳 · 순서대로`} />
          {/* 순서가 바뀐 이유를 한 줄로 적는다. 적지 않으면 목록이 저 혼자 뒤바뀐 것처럼
              보이고, 그건 화면이 고장난 것으로 읽힌다. 추천 순서를 되찾는 길([처음부터])이
              바로 위에 있으므로 여기서는 무슨 일이 있었는지만 말한다. */}
          {plan.replanned ? (
            <Notice tone="neutral" size="sm" style={{ marginBottom: "var(--space-3)" }}>
              마지막으로 들른 곳에서 가까운 순서로 다시 잡았습니다
            </Notice>
          ) : null}
          <div role="list">
            {stops.map((s, i) => {
              const on = s.id === activeId;
              const done = isDone(s.id);
              const isNext = i === nextIndex;
              return (
                <React.Fragment key={s.id}>
                  {/* ── 출발 구간 (QR 지점 → ①) ────────────────────────
                         **첫 곳 위에만** 온다. 가게와 가게 사이의 구간은 띠를 따로 두지 않고
                         행 안에 그린다 (아래 "구간 시간은 행 안에 띄운다" 참조) — 여기만
                         위에 행이 없어서 걸 자리가 없다.

                         값은 데이터가 미리 갖고 있다 (coursePlan.js). 화면에서 다시 재면
                         머리말의 총 시간과 구간의 합이 어긋난다.

                         출발점은 QR 지점이라 순번이 없다. 그 자리에 아이콘이 대신 선다.
                         글자는 아이콘 높이(14px)만큼 내려 점선 한가운데에 세운다. */}
                  {i === 0 ? (
                    <div style={{ display: "flex", alignItems: "center",
                      padding: "0 calc(var(--space-3) + var(--stroke-hairline))" }}>
                      <span style={{ flex: "0 0 auto", minWidth: 24, textAlign: "right",
                        marginTop: 14,
                        fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)",
                        fontWeight: "var(--fw-semibold)", color: "var(--text-muted)",
                        lineHeight: 1.2, whiteSpace: "nowrap" }}>
                        <VisuallyHidden>QR 지점에서 도보 </VisuallyHidden>
                        {s.legMin}분
                      </span>
                      <span aria-hidden="true" style={{ flex: "0 0 auto", minWidth: 26,
                        marginLeft: "var(--space-1)",
                        display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Icon name="qr-code" size={14} color="var(--text-muted)" />
                        <span style={{ minHeight: "var(--course-leg-min)", width: 0,
                          borderLeft: "2px dotted var(--course-leg-line)" }} />
                      </span>
                    </div>
                  ) : null}

                  <div role="listitem" onClick={() => goTo(s.id)}
                    style={{ position: "relative",
                      display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
                      minHeight: "var(--tap-comfortable)",
                      /* 왼쪽만 28px 더 들어간다 = [시간 자리 24 + 사이 4]. 그래야 순번
                         동그라미의 중심이 점선과 정확히 맞는다. 이 값을 한쪽만 고치면
                         점선이 동그라미를 비껴간다.
                         위아래 8px 은 좌우 12px 보다 좁다 (2026-08-19). 이 값이 두 번(윗행의
                         아래쪽 + 아랫행의 위쪽) 더해져 **번호 사이의 간격 전부**가 되기
                         때문이다 — 지금 [방문 완료] 칩과 다음 상호명 사이는 8+8 = 16px 다.
                         행 사이 여백은 0 이다. */
                      padding: "var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 28px)",
                      cursor: "pointer",
                      borderRadius: "var(--radius-sm)",
                      background: on ? "var(--brand-primary-soft)" : "transparent",
                      border: "var(--stroke-hairline) solid " + (on ? "var(--border-brand)" : "transparent") }}>

                    {/* ── 점선은 행 안에서 그린다 (2026-08-19) ──────────────────────
                           행 사이에 띠를 두고 거기에만 점선을 그렸을 때는 ①에서 ②까지가
                           이어지지 않았다. 동그라미 아래 여백, 띠, 다음 동그라미 위 여백 중
                           **가운데 토막만** 점선이라 잇는 선이 아니라 띄엄띄엄 놓인 부호로
                           보였다. 이제 행이 자기 높이 전부를 두 토막으로 그리고, 아래 토막이
                           다음 행의 위 토막과 맞닿아 **끊기지 않는 한 줄**이 된다.

                           동그라미를 관통하는 선 하나로 그리지 않는다 — 방문한 순번은
                           opacity 0.5 라 뒤의 선이 비쳐 숫자 위에 줄이 그어진 것처럼 보인다.

                           x 는 52px = 왼쪽 여백(12) + 시간 자리(28) + 동그라미 반지름(13)
                           − 선 두께의 절반(1). 절대 위치의 기준이 테두리 안쪽이라 테두리 1px 은
                           빼지 않는다. 아래 토막이 시작하는 34px 은 여백(8) + 동그라미(26)다.

                           마지막 순번 아래로는 내리지 않는다 — 갈 곳이 없는데 선이 이어지면
                           아직 더 있는 것으로 읽힌다. */}
                    <span aria-hidden="true" style={{ position: "absolute",
                      left: "calc(var(--space-3) + 28px + 12px)",
                      top: 0, height: "var(--space-2)",
                      width: 0, borderLeft: "2px dotted var(--course-leg-line)" }} />
                    {i < stops.length - 1 ? (
                      <span aria-hidden="true" style={{ position: "absolute",
                        left: "calc(var(--space-3) + 28px + 12px)",
                        top: "calc(var(--space-2) + 26px)", bottom: 0,
                        width: 0, borderLeft: "2px dotted var(--course-leg-line)" }} />
                    ) : null}

                    {/* 순번 — 지도 핀과 같은 숫자, 같은 색. 고른 곳은 지도와 같은 호박색이다.
                        방문한 곳도 **숫자를 지우지 않는다** — 몇 번째였는지가 코스의 전부다.
                        체크는 숫자 옆이 아니라 아래 조아용 도장이 맡는다. */}
                    <span aria-label={done ? `${i + 1}번, 방문함` : `${i + 1}번`}
                      style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: 26, minHeight: 26, borderRadius: 999,
                        background: on ? "var(--pin-course-active)" : "var(--brand-primary-soft)",
                        color: on ? "var(--pin-course-active-ink)" : "var(--yong-green-800)",
                        opacity: !on && done ? 0.5 : 1,
                        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)" }}>
                      {i + 1}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
                        opacity: done ? 0.55 : 1 }}>
                        <CategoryIcon type={s.cat} size={18} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
                          fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", lineHeight: 1.4 }}>{s.name}</span>
                        {s.onnuri ? <OnnuriBadge size="sm" /> : null}
                        {/* 아직 안 들른 곳 중 첫 번째. 표시일 뿐 다른 곳을 막지 않는다 */}
                        {isNext ? <Badge tone="brand" dot>다음 차례</Badge> : null}
                      </div>

                      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 3,
                        lineHeight: 1.45, opacity: done ? 0.55 : 1 }}>
                        {CATEGORY_LABELS[s.cat] || "기타"} · {s.biz}
                      </div>

                      {/* 방문 토글 — 작은 알약(size="sm", 28px)이다. 행의 주인공은 상호명이고
                          이건 그 행에 붙이는 표시라 상호명보다 커서는 안 된다. 눌리는 크기는
                          그대로 44px 이다 — 눈에만 작아진다 (Chip 의 CHIP_SIZES 주석).
                          행을 누르면 지도가 옮겨가므로 여기서 전파를 끊는다. */}
                      <Chip size="sm" selected={done} icon="check" aria-pressed={done}
                        onClick={e => { e.stopPropagation(); markVisited(s); }}
                        style={{ marginTop: 0 }}>
                        {done ? "방문함" : "방문 완료"}
                      </Chip>
                    </div>

                    {/* 방문 도장 — 조아용이 이 행의 상태를 그림으로 한 번 더 말한다.
                        글자([방문함] 칩)와 흐림이 이미 같은 것을 말하고 있으므로 이것은
                        보조 수단이다. 56px 은 행 안에서 캐릭터가 표정까지 읽히는 크기다 —
                        작게 넣으면 얼룩이 되어 도장 구실을 못 한다. 옆의 칩을 28px 로 줄인
                        만큼 이 자리가 커져도 행이 시끄러워지지 않는다.
                        alt 를 비워 스크린리더가 같은 말을 세 번 읽지 않게 한다. */}
                    {done ? (
                      <Mascot pose="thumbsup" size={56} base={base} alt=""
                        style={{ flex: "0 0 auto", alignSelf: "center" }} />
                    ) : null}

                    {/* ── 구간 시간은 행 안에 띄운다 (2026-08-19) ────────────────────
                           행과 행 사이에 띠로 두었더니, **글자가 자기 높이만큼 두 순번을
                           밀어냈다.** [방문 완료] 칩과 다음 상호명 사이가 그만큼 벌어지는데,
                           거기 벌어질 이유가 없다 — 다음 가게는 바로 다음 줄이다.

                           그래서 흐름에서 빼 왼쪽 여백에 띄운다. 자리는 **점선의 세로
                           한가운데**다: 이 행의 동그라미 밑(34px)에서 행 끝까지가 다음
                           순번으로 가는 구간이고, 글자는 그 구간의 중앙에 선다. 결과적으로
                           [방문 완료] 칩보다 위에 오는데, 그게 맞다 — 글자는 칩에 딸린 것이
                           아니라 **선에 딸린 것**이다.

                           띄웠으므로 행 높이에 보태지 않는다. 번호 사이의 간격은 이제
                           여백 두 개(8+8)뿐이다.

                           값은 **다음 순번의 legMin** 이다. legMin 은 "여기까지 오는 데
                           걸린 시간"이라 ②의 값이 ①→② 구간이다.

                           읽는 차례는 이 행의 끝이다. 화면에서는 위로 떠 있지만 소리로는
                           "…방문 완료. 다음 지점까지 도보 2분." 이 자연스럽다 —
                           떠난 뒤의 이야기이기 때문이다. */}
                    {i < stops.length - 1 ? (
                      <span style={{ position: "absolute",
                        left: "var(--space-3)", width: 24, textAlign: "right",
                        top: "calc(var(--space-2) + 26px)", bottom: 0,
                        display: "flex", alignItems: "center", justifyContent: "flex-end",
                        fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)",
                        fontWeight: "var(--fw-semibold)", color: "var(--text-muted)",
                        lineHeight: 1.2, whiteSpace: "nowrap" }}>
                        <VisuallyHidden>다음 지점까지 도보 </VisuallyHidden>
                        {stops[i + 1].legMin}분
                      </span>
                    ) : null}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {/* [코스 전체 보기]를 뺐다 (2026-08-18). 코스 전체로 되돌리는 일은 미리보기 카드를
              닫는 동작이 맡는다 — 카드가 떠 있다는 것이 "한 곳을 들여다보는 중"이라는 뜻이고,
              닫는 것은 그 상태를 벗어난다는 뜻이라 자연스럽게 짝이 된다. 지도가 이미 할 줄
              아는 일(축소)에 버튼을 하나 더 얹고 있었다. */}
        </section>

        <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
          style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
          정보 오류 신고
        </Button>

        {/* 코스는 상점가 점포 데이터에서 만들어지므로 기준일자도 그쪽을 따른다 */}
        <DetailNotice asOf={`점포 정보 ${asOf}`}>
          <span style={{ display: "block" }}>
            코스는 추천이며 영업시간과 휴무는 매장마다 다릅니다. 방문 전 확인해 주세요.
          </span>
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default CourseDetail;
