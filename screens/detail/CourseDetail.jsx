import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, KakaoMap, MapPreviewCard, Badge, Icon,
  CategoryIcon, CATEGORY_LABELS, OnnuriBadge, SectionHeader, ProgressBar,
  TextButton, IconButton, Chip, Mascot, VisuallyHidden,
} from "../../design-systems/index.js";
/* WALK_M_PER_MIN 을 여기서 쓰지 않는다 — 구간 시간(legMin)은 data/coursePlan.js 가 잰다.
   화면에서 따로 환산하면 같은 구간이 두 값으로 갈린다. */
import { KAKAO_APP_KEY } from "../main/config.js";
import { useCourseVisits } from "../main/data/courseVisits.js";
import { useCourseOrder } from "../main/data/courseOrder.js";
import { planCourse, moveStop } from "../main/data/coursePlan.js";

/* S08 골목 한바퀴 코스 상세 (기능명세서 v1.1 4장 S08 행).
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
 *   추천 코스                              ← 머리말은 넉 자뿐. 오른쪽 보조 문구를 뺐다
 *        ⌗                                 ← 출발점(QR 지점)에만 띠가 따로 있다
 *   2분  ┊
 *        ①  가게  업종                     ← 누르면 지도가 그 순번으로 가고 카드가 뜬다
 *        ┊      중식 · 중국집          ⠿    ← 끌면 순서가 바뀐다 (행 오른쪽 · 세로 한가운데)
 *   3분  ┊      [✓ 방문 완료]                  (U-DC-03 "순번 이동")
 *        ②  가게 (흐림)                      ← 시간은 점선 왼쪽, 그 구간의 세로 한가운데
 *        ┊      중식 · 중국집   (조아용) ⠿   ← 방문 도장. 점선은 ①에서 ②까지 안 끊긴다
 *        ┊      [✓ 방문함]
 *   2분  ┊
 *        ③  가게                           ← 진하게 남은 첫 줄이 곧 다음 차례다 (배지 없음)
 *   ...
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지
 *
 * ── 셸의 지도와 같은 어법을 쓴다 ────────────────────────────────────────
 * 순번을 고르면 지도 바닥에 미리보기 카드가 뜬다. S02·S03 에서 마커를 눌렀을 때와
 * **같은 컴포넌트**(MapPreviewCard)이고 버튼도 같다 — 지도 위의 무언가를 눌렀을 때
 * 일어나는 일이 화면마다 다르면 사용자는 화면마다 다시 배워야 한다.
 * 고른 핀은 호박색이다. 코스 핀도 점선도 전부 초록이라 초록을 진하게 하는 것으로는
 * 구분되지 않았다 (tokens/icons.css 의 --pin-course-active 주석).
 *
 * ── 방문 완료는 화면의 전제가 아니다 ────────────────────────────────────
 * 한 번도 누르지 않아도 이 화면은 온전하다. 진행률이 0/4 로 서 있을 뿐이다.
 * 순서를 강제하지 않고(문 닫은 가게를 건너뛰는 일은 흔하다), 방문한 곳을 목록에서 빼지
 * 않으며(빼면 몇 번째였는지 알 수 없다), 언제든 되돌릴 수 있다.
 * GPS 로 자동 판정하지 않는다 — 기록의 성격은 data/courseVisits.js 머리말 참조.
 * **누른다고 목록이 바뀌지도 않는다** (2026-08-19. 바로 아래 참조).
 *
 * ── 순서를 바꾸는 것은 사용자뿐이다 (2026-08-19 뒤집음) ─────────────────────
 * 전에는 [방문 완료]를 누를 때마다 그 곳을 기준으로 남은 곳을 가까운 순으로 다시 이었다.
 * 계산은 맞았다 — ①을 들르고 ③으로 갔는데 "②까지 3분"이라고 말하면 그 3분은 ①에서 잰
 * 값이라 실제로 틀린 수다. 그런데 그 답이 **목록을 통째로 뒤바꾸는 것**이었다.
 *
 * 사용자가 누른 것은 "여기 들렀다"는 표시 하나인데, 그 한 번에 번호가 옮겨 붙고 줄 차례가
 * 바뀌고 총 시간까지 달라졌다. 요청하지 않은 변화가 동작에 딸려 오면 다음에 그 단추를
 * 누를 때 무슨 일이 일어날지 예측할 수 없다 — 그 지점의 피드백을 받고 뒤집었다.
 *
 * 이제 역할이 갈린다:
 *
 *   방문 표시   표시만 한다. 순서·번호·총 시간 어느 것도 건드리지 않는다.
 *   순서        기본은 코스가 추천한 그대로. **손잡이(⠿)를 끌어** 사용자가 옮긴다.
 *
 * 출발지는 이 화면에 없다. 코스 목록은 "어디를 도나"를 말하고, "지금 어디서 출발하나"는
 * 실제로 길을 물을 때 정해진다 — 순번의 [길찾기]가 여는 S07 이 그 자리를 갖는다.
 *
 * ── 끌기는 손잡이에서만 시작한다 ────────────────────────────────────────────
 * 이 화면은 지도가 sticky 로 붙어 있고 그 아래를 세로로 스크롤한다. 행 아무 데나 잡아도
 * 끌리게 두면 "끄는 것"과 "스크롤하는 것"이 같은 몸짓이 되어, 순서를 옮기려다 화면이
 * 흐르고 화면을 내리려다 순서가 바뀐다. 그래서 `touch-action: none` 은 **손잡이에만**
 * 건다 — 손잡이 밖은 예전 그대로 스크롤되고, 손잡이를 잡은 손가락만 목록을 옮긴다.
 *
 * 손잡이는 단추다. 초점을 받고 **↑/↓ 키로도 한 칸씩 옮긴다** — 끌기는 키보드와
 * 스크린리더에 아무것도 주지 않으므로, 같은 자리에서 같은 일을 하는 길을 함께 둔다
 * (화면에 단추가 하나 더 늘지 않는다). 옮긴 결과는 aria-live 로 읽어준다.
 *
 * ── 끄는 동안 화면이 답한다 (2026-08-20) ────────────────────────────────────
 * 잡은 줄은 손가락을 1:1 로 따라가고, 나머지 줄은 놓일 자리를 비우며 밀리고, 순번은 놓았을
 * 때의 번호로 미리 바뀐다. **배열은 손을 뗄 때 한 번만** 바뀐다 — 예전에는 옆 행에 들어서는
 * 순간 순서를 갈아치워서, 잡은 줄이 제자리에 선 채 한 칸씩 순간이동했다. 자세한 규칙과
 * 그 앞에 있었던 문제는 본문 `startDrag` 앞 주석에 적어 두었다.
 *
 * 되돌리는 길은 목록 바로 위의 [추천 순서로]다 — 손댄 뒤에만 나온다.
 * 방문 기록의 [처음부터]와 **다른 단추다.** 둘을 하나로 묶으면 순서를 되돌리려다
 * 애써 찍은 방문 표시가 함께 지워진다.
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
export function CourseDetail({ course, anchor, asOf, onBack, onPickStore, onRouteStore,
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

  /* ── 순서와 출발지는 사용자가 정한다 (2026-08-19) ──────────────────────────
     방문 기록은 여기에 관여하지 않는다 (머리말 "순서를 바꾸는 것은 사용자뿐이다").
     세션에 남으므로 가게를 한 번 눌러보고 돌아와도 맞춰둔 순서가 그대로다.

     손대지 않았으면 추천 순서 그대로다 (planCourse 가 계산 없이 돌려준다).
     지도도 같은 배열(stops)을 받으므로 순번 핀과 점선 경로가 목록과 함께 그려진다. */
  const { orderIds, setIds, reset } = useCourseOrder(c.id);

  const plan = React.useMemo(
    () => planCourse(c.stops || [], orderIds, anchor),
    [c.stops, orderIds, anchor]);
  const stops = plan.order;

  /* 한 곳을 to 번째 자리로 옮긴다. **지금 화면에 깔린 배열**을 기준으로 옮겨 그대로
     저장한다 — 끌어 옮긴 결과가 사용자가 보고 있던 그 목록 그대로여야 한다.
     자리가 그대로면 moveStop 이 같은 배열을 돌려주므로 저장이 돌지 않는다
     (끌기는 손가락이 움직이는 내내 이 함수를 부른다). */
  const moveTo = React.useCallback((id, to) => {
    const next = moveStop(stops, id, to);
    if (next === stops) return;
    setIds(next.map(x => x.id));
  }, [stops, setIds]);

  /* ── 끌어서 순서 바꾸기 (2026-08-19 신설 · 2026-08-20 다시 짬) ──────────────
     포인터 이벤트 하나로 손가락·마우스·펜을 함께 받는다. 잡은 손잡이가 포인터를 가두므로
     (setPointerCapture) 손가락이 행 밖으로 나가도 이 행의 이벤트로 계속 들어온다.

     ── 끄는 동안에는 배열을 건드리지 않는다 (2026-08-20) ───────────────────────
     전에는 손가락이 옆 행의 상자에 들어서는 순간 순서를 **바로 갈아치웠다.** 계산은 맞았지만
     화면이 툭툭 끊겼다: 잡은 줄은 손가락을 따라오지 않고 제자리에 선 채 한 칸씩 순간이동했고,
     지나친 줄도 같은 순간 자리를 바꿔서 무엇이 어디로 가는지 눈으로 좇을 수 없었다.
     세션 저장도 한 칸 넘길 때마다 돌았다.

     이제 끄는 동안 화면이 하는 일은 셋이고, **배열은 손을 뗄 때 한 번만** 바뀐다.

       잡은 줄     transform 으로 손가락을 1:1 로 따라간다. 여기엔 transition 을 걸지 않는다 —
                   한 프레임이라도 늦으면 손가락과 카드가 어긋나 끌리는 느낌이 사라진다.
       나머지 줄   놓일 자리를 비우려고 잡은 줄의 높이(h)만큼 위/아래로 밀린다. 이쪽에는
                   transition 을 건다 — **벌어지는 틈이 곧 "여기 들어갑니다"** 이므로,
                   그 틈이 생기는 과정이 보여야 한다.
       순번        놓았을 때 붙을 번호로 **미리 바뀐다.** 배열은 그대로이므로 화면용으로만
                   센다 (아래 moved / num). 틈은 자리를 그림으로, 번호는 같은 것을 숫자로
                   말한다 — 둘 중 하나만으로는 "3번이 2번이 된다"가 확인되지 않는다.

     자리는 잡는 순간 한 번 재둔 **다른 행들의 중심선**으로 정한다. 손가락보다 위에 남은
     중심선의 수가 곧 끼워질 자리다 (moveStop 의 `to` 와 같은 값). 끄는 동안 배열도 레이아웃도
     그대로라 이 기준이 발밑에서 움직이지 않는다 — 예전 방식은 한 칸 옮긴 직후 상자들이
     다시 배치되면서, 경계에서 두 자리를 오가며 떨었다.

     잡은 줄의 중심선은 셈에서 뺀다. 그 줄은 손가락을 따라다녀 자기 상자 안에 손가락이 늘
     들어 있으므로, 넣어두면 언제나 제자리가 답으로 나온다.

     px 차이로 칸수를 세지 않는 이유는 그대로다 — 행 높이가 저마다 다르다 (상호명이 두 줄이
     되거나 조아용 도장이 붙는다). */
  const rowEls = React.useRef(new Map());
  /* 끄는 중인 줄 하나. { id, from, h, y, to } — y 는 손가락을 따라간 거리, to 는 놓일 자리.
     null 이면 아무것도 끌고 있지 않다 (그때 화면은 예전 그대로다). */
  const [drag, setDrag] = React.useState(null);
  /* 잡는 순간 한 번 재고 끝나는 값들. 렌더에 쓰지 않으므로 state 가 아니다 */
  const grabRef = React.useRef(null);
  /* 옮긴 결과를 소리로 알린다. 끌기는 화면을 봐야만 알 수 있는 동작이라, 키보드로 옮긴
     사람에게는 이 한 줄이 유일한 응답이다 */
  const [moveSay, setMoveSay] = React.useState("");

  const startDrag = React.useCallback((s, from, e) => {
    const el = rowEls.current.get(s.id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    grabRef.current = {
      pointerY0: e.clientY,
      mids: stops.filter(x => x.id !== s.id).map(x => {
        const el2 = rowEls.current.get(x.id);
        if (!el2) return null;
        const r2 = el2.getBoundingClientRect();
        return (r2.top + r2.bottom) / 2;
      }).filter(m => m != null),
    };
    setDrag({ id: s.id, from, h: r.height, y: 0, to: from });
  }, [stops]);

  const onDragMove = React.useCallback(e => {
    const g = grabRef.current;
    if (!g) return;
    const y = e.clientY - g.pointerY0;
    let to = 0;
    g.mids.forEach(mid => { if (e.clientY > mid) to++; });
    /* 값이 그대로면 새 객체를 만들지 않는다 — 끌기는 초당 수십 번 들어온다 */
    setDrag(d => (d && (d.y !== y || d.to !== to) ? { ...d, y, to } : d));
  }, []);

  /* 손을 떼는 순간이 **유일하게 배열이 바뀌는 지점**이다. 화면에서 이미 밀려나 있던 줄들은
     같은 렌더에서 transform 을 잃고 새 자리에 놓이므로, 둘이 상쇄되어 눈에는 아무 일도
     일어나지 않는다 — 벌어져 있던 틈이 그대로 그 줄의 자리가 된다. */
  const endDrag = React.useCallback(() => {
    grabRef.current = null;
    if (!drag) return;
    /* 자리가 그대로면 아무 말도 하지 않는다 — 잡았다 놓기만 해도 "3번입니다"가 읽히면
       무언가 바뀐 것으로 들린다 */
    if (drag.to !== drag.from) {
      moveTo(drag.id, drag.to);
      const s = stops.find(x => x.id === drag.id);
      if (s) setMoveSay(`${s.name}, ${stops.length}곳 중 ${drag.to + 1}번`);
    }
    setDrag(null);
  }, [drag, stops, moveTo]);

  /* ↑/↓ 키로도 한 칸씩. 끌기가 키보드에 주지 않는 것을 같은 손잡이가 준다 (머리말) */
  const onHandleKey = React.useCallback((s, e) => {
    const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation();
    const from = stops.findIndex(x => x.id === s.id);
    const to = from + delta;
    if (to < 0 || to >= stops.length) return;
    moveTo(s.id, to);
    setMoveSay(`${s.name}, ${stops.length}곳 중 ${to + 1}번`);
  }, [stops, moveTo]);

  /* "지금 고른 곳"은 **지금 깔린 순서 안에서** 찾는다. 그래서 이 두 줄은 stops 아래에 있어야
     한다 — 위에 두면 선언 전 참조(TDZ)라 화면이 통째로 죽는다. activeIndex 를 쓰는 곳이
     미리보기 카드의 "직전 가게"라서, 순서가 바뀌면 이 값도 함께 따라와야 맞기도 하다. */
  const active = stops.find(s => s.id === activeId) || null;
  const activeIndex = stops.findIndex(s => s.id === activeId);

  const doneCount = stops.filter(s => isDone(s.id)).length;
  const allDone = stops.length > 0 && doneCount === stops.length;

  /* [다음 차례] 배지를 뺐다 (2026-08-20). 아직 안 들른 첫 곳에 붙던 표시인데, 그 곳은
     **번호와 흐림만으로 이미 읽힌다** — 방문한 곳은 흐리고 도장이 찍혀 있으므로 진하게
     남은 첫 줄이 곧 다음 차례다. 같은 사실에 배지를 하나 더 붙이면 행마다 붙는 것
     ([방문함] 칩 · 온누리 · 업종)이 넷이 되어, 정작 주인공인 상호명이 그 사이에 묻힌다.
     "다음은 어디"라는 질문에는 지도가 답한다 — 방문 표시를 켜면 카메라가 그리로 옮겨간다
     (markVisited). 배지가 없어져도 그 동작은 그대로다. */

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
    /* 다음 차례는 **목록에서 아직 안 들른 첫 곳**이다 (2026-08-19). 전에는 "방금 들른 곳에서
       가장 가까운 곳"이었는데, 그건 순서를 다시 짜던 시절의 값이다. 이제 순서는 그대로
       있으므로 지도도 목록 차례를 따라야 한다 — 다르면 지도가 가리키는 곳과 목록이 가리키는
       곳이 갈린다. 배지를 뺀 뒤로는 이것이 "다음은 어디"에 답하는 **유일한 장치**다.
       `visited` 갱신은 다음 렌더에나 반영되므로 방금 켠 곳을 여기서 직접 뺀다. */
    const next = stops.find(x => x.id !== s.id && !isDone(x.id));
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
              (c.minutes)이 아니다 — 순서나 출발지를 바꾸면 걷는 길이 달라지는데 머리말만
              추천안의 수를 붙들고 있으면, 아래 구간을 더해본 사람에게 틀린 화면이 된다.
              손대지 않았으면 둘은 같은 값이다. */}
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
            {anchor.name}에서 출발해 순서대로 도는 코스를 나타냅니다.
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
               **조아용 도장 · 흐린 글자 · [방문함] 칩** 셋으로 말한다 — 어느 것도 색 하나에
               기대지 않는다. 진하게 남은 첫 줄이 곧 다음 차례라, 그것을 따로 적지 않는다. */}
        <section>
          {/* 머리말 오른쪽 보조 문구를 뺐다 (2026-08-20). `4곳 · 직접 정한 순서` 였는데
              두 값 다 이 자리에서만 알 수 있는 것이 아니었다 — 곳수는 지도 아래 배지가 이미
              달고 있고(도보 n분 · n곳 · 약 nnnm), 순서를 손댔다는 사실은 바로 아래
              [추천 순서로]가 **나타나는 것 자체로** 말한다. 되돌릴 것이 없으면 그 단추가
              없으므로, 두 상태가 단추 하나로 갈린다.
              머리말이 "추천 코스" 넉 자만 남아 그 아래 목록이 곧바로 시작된다. */}
          <SectionHeader title="추천 코스" style={{ marginBottom: "var(--space-2)" }} />

          {/* 끌 수 있다는 것을 한 줄로 알린다. ⠿ 는 **작고 행 오른쪽 끝에 있어** 먼저 눈에
              들어오지 않으므로, 목록을 훑기 전에 한 번 읽히는 자리에 문장을 둔다.
              고지가 아니라 안내라서 Notice 상자를 두르지 않는다 — 상자는 이 화면에서
              가장 큰 덩어리가 되고, 정작 중요한 것은 그 아래 목록이다.

              ── 문장에서 ⠿ 를 뺐다 · "손잡이"라는 말도 뺐다 (2026-08-20) ──────────────
              앞에도 붙여 보고 뒤에도 붙여 봤지만, 어느 쪽이든 **기호가 문장 밖으로 떨어질
              길**을 안고 있었다 (글자를 키우면 줄이 접힌다). 기호 하나만 남은 줄은 아래
              목록의 손잡이처럼 보여 누를 것으로 읽힌다. nowrap 으로 붙들 수는 있지만, 그
              장치가 필요하다는 것 자체가 이 줄에 기호가 꼭 있어야 하는 것은 아니라는 뜻이다.

              "손잡이"라는 말도 쓰지 않는다. 그건 **우리가 부르는 이름**이지 화면에 적힌
              이름이 아니라, QR 을 찍고 들어온 사람에게는 그것이 ⠿ 인지 시트 위의 짧은
              막대인지 알 길이 없다. 지금 문구가 부르는 이름은 **순서 변경 아이콘** 이다 —
              무엇을 하는 것인지가 이름 안에 있어서, 처음 보는 기호를 그 이름으로 찾을 수 있다.

              ── 한 줄에 들어가는 길이로 줄였다 (2026-08-20) ─────────────────────────
              "순서 변경 아이콘을 드래그하여 코스 순서를 변경할 수 있습니다."는 한글 26자다.
              캡션 13px 에서 한글 한 자는 13px 를 그대로 먹으므로 띄어쓰기까지 370px 남짓이
              되는데, 360px 화면에서 이 줄이 쓸 수 있는 폭은 좌우 여백 20px 을 뺀 **320px**
              이다. 글자를 줄이지 않는 한 어떤 배치로도 한 줄이 되지 않는다 — 그래서 문장을
              줄였다 (본문 16px 고정과 같은 결이다. 읽는 크기를 깎아 길이를 사지 않는다).

              지운 말과 그 이유:
                "코스"        바로 위 머리말이 "추천 코스"다. 같은 화면에서 두 번 부를 말이 아니다
                "변경할 수 있습니다" → "변경됩니다". 뜻은 같고 네 자가 짧다. 무엇을 잡아야
                              하는지("순서 변경 아이콘")는 그대로 남아 있어 문장의 일은 끝난다
              남은 문장은 한글 21자 · 290px 남짓이다. ↺ 가 함께 서는 상태에서도 한 줄이 되도록
              단추를 좌우 12px 씩 물리고 사이 여백을 4px 로 좁혀 **296px** 를 남겼다 — 문장이
              여기서 더 길어지면 (한글 23자 넘어가면) 좁은 기기에서 접힌다. */}
          {/* ── 안내 문구와 되돌리기가 **한 줄에 선다** (2026-08-20) ───────────────
                 [추천 순서로]는 문구 아래 자기 줄을 갖고 있었다. 손대기 전에는 없다가
                 순서를 바꾸는 순간 나타나므로, **그 줄이 생기면서 목록 전체가 아래로
                 밀렸다** — 방금 옮긴 줄을 눈으로 좇고 있는데 화면이 통째로 내려간다.

                 같은 줄에 세우고 자리를 **미리 비워 둔다** (minHeight = --tap-min).
                 단추가 없을 때도 그 높이가 서 있으므로 나타나고 사라지는 것이 레이아웃을
                 건드리지 않는다. 비워두는 24px 남짓이 이 줄에서 치르는 값이고, 얻는 것은
                 "순서를 바꿔도 목록이 제자리에 있다"이다.

                 문구는 글자가 커지면 두 줄로 접힌다 — 그때 줄 높이는 문구가 정하고
                 단추는 가운데에 선다 (alignItems: center). */}
          {stops.length > 1 || plan.adjusted ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)",
              minHeight: "var(--tap-min)", marginBottom: "var(--space-1)" }}>
              <p style={{ flex: 1, minWidth: 0, fontSize: "var(--fs-caption)",
                color: "var(--text-muted)", lineHeight: 1.5 }}>
                {stops.length > 1 ? "순서 변경 아이콘을 드래그하면 순서가 변경됩니다" : ""}
              </p>

              {/* 되돌리는 길. 손대지 않았으면 나오지 않는다 — 0/4 에 [처음부터]를 두지 않는
                  것과 같은 규칙이고(위 진행률), 되돌릴 것이 없는데 되돌리기가 서 있으면
                  무언가 이미 바뀐 것처럼 읽힌다. 순서와 출발지를 함께 되돌리고 **방문 기록은
                  건드리지 않는다** — 위 [처음부터]와 다른 단추인 이유다 (머리말 참조).

                  **글자를 뗐다** (2026-08-20). "추천 순서로" 넉 자가 안내 문구와 한 줄에
                  서면 두 문장이 나란히 놓인 꼴이라 어느 쪽이 읽을 것이고 어느 쪽이 누를
                  것인지 갈리지 않았다. 화살표 하나면 이 줄에서 **누를 수 있는 유일한 것**이
                  되고, 이름은 label 로 남아 보조기기에 그대로 읽힌다. 되돌아갈 대상이
                  바로 아래 목록이라, 무엇이 되돌아가는지는 자리가 말한다.

                  **그림쇠는 18px, 누르는 자리는 그대로 44px 이다** (2026-08-20).
                  기본값 22px 는 13px 짜리 안내 문구 옆에서 문장보다 커 보였다 — 이 줄의
                  주인공은 문구이고 단추는 손댔을 때만 나타나는 곁가지다. 둘을 가르는
                  `iconSize` 는 IconButton 에 새로 낸 것이다 (U-CM-13 을 지키면서 눈에만
                  작게 하는 유일한 길).

                  좌우로 12px 씩 물린다(margin). 44px 상자가 폭을 다 차지하면 문구가 쓸 수
                  있는 자리가 그만큼 줄어 한 줄에 못 들어간다. 물린 만큼은 화면 여백
                  (--gutter-screen 20px)과 문구 사이 여백 위로 넘치는데, 거기에는 눌리는
                  것이 없어 손가락 자리를 빼앗지 않는다. 그림쇠(18px)는 상자 가운데라
                  가장자리에서 13px 안쪽에 있어, 물려도 문구와 맞닿지 않는다. */}
              {plan.adjusted ? (
                <IconButton name="rotate-ccw" iconSize={18} label="추천 순서로 되돌리기" onClick={reset}
                  style={{ flex: "0 0 auto", color: "var(--text-muted)",
                    marginRight: -12, marginLeft: -12 }} />
              ) : null}
            </div>
          ) : null}

          {/* 옮긴 결과를 소리로 알린다. 화면에서는 줄이 움직이는 것이 보이지만, 끌기도
              키보드 조작도 그 사실을 저절로 읽어주지는 않는다 */}
          <VisuallyHidden aria-live="polite">{moveSay}</VisuallyHidden>

          <div role="list">
            {stops.map((s, i) => {
              const on = s.id === activeId;
              const done = isDone(s.id);

              /* ── 끄는 동안의 이 줄 (위 drag 주석) ────────────────────────────
                 dragging  잡힌 줄. 손가락을 따라간다
                 moved     밀려나는 칸수. -1 은 한 칸 위, +1 은 한 칸 아래.
                           잡은 줄이 지나간 구간의 줄들만 밀린다
                 num       놓았을 때 붙을 번호. 배열은 아직 그대로이므로 여기서 센다 */
              const dragging = !!drag && drag.id === s.id;
              const moved = !drag || dragging ? 0
                : (drag.to > drag.from && i > drag.from && i <= drag.to) ? -1
                : (drag.to < drag.from && i >= drag.to && i < drag.from) ? 1 : 0;
              const num = dragging ? drag.to + 1 : i + 1 + moved;
              const shiftY = dragging ? drag.y : moved * (drag ? drag.h : 0);

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
                    /* 잡는 순간 이 상자의 높이와 중심선을 잰다 (위 startDrag) */
                    ref={el => { if (el) rowEls.current.set(s.id, el); else rowEls.current.delete(s.id); }}
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
                      /* ── 끌고 있는 줄 ─────────────────────────────────────────
                         들어올린 것처럼 보여야 한다 — 그림자를 얹고 카드 바탕을 깔아
                         아래 줄들과 층을 나눈다. "지금 고른 곳"(on)의 초록 바탕과 겹치면
                         둘 중 어느 상태인지 알 수 없으므로 끄는 쪽이 이긴다.
                         크기는 건드리지 않는다 — 줄 높이가 변하면 잡을 때 재둔 h 와 어긋나
                         비워둔 틈이 실제 줄보다 크거나 작아진다. */
                      background: dragging ? "var(--surface-card)"
                        : on ? "var(--brand-primary-soft)" : "transparent",
                      border: "var(--stroke-hairline) solid "
                        + (dragging ? "var(--border-strong)"
                          : on ? "var(--border-brand)" : "transparent"),
                      boxShadow: dragging ? "var(--shadow-raised)" : "none",
                      /* 끄는 동안에는 이 줄이 위로 온다. 아래 줄이 그림자를 덮으면
                         들어올린 느낌이 사라진다 */
                      zIndex: dragging ? 2 : "auto",

                      /* ── 실시간 되먹임 (2026-08-20) ──────────────────────────
                         잡은 줄은 손가락을 그대로 따라가고(transition 없음), 나머지 줄은
                         놓일 자리를 비우며 밀린다(transition 있음). 손을 떼면 drag 가 null 이
                         되어 두 값이 같은 렌더에서 사라진다 — 그 순간 배열이 바뀌므로
                         밀려 있던 자리가 곧 실제 자리가 되어, 눈에는 아무 일도 없다.
                         willChange 는 끄는 동안에만 건다. 늘 걸어두면 목록 네 줄이 계속
                         합성 레이어를 잡고 있게 된다. */
                      transform: shiftY ? `translateY(${shiftY}px)` : undefined,
                      transition: drag && !dragging
                        ? "transform var(--dur-fast) var(--ease-standard)" : "none",
                      willChange: drag ? "transform" : undefined,
                      /* 잡은 줄 위에서는 커서가 손을 쥔 모양이다 (손잡이 밖까지) */
                      ...(dragging ? { cursor: "grabbing" } : null) }}>

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
                        체크는 숫자 옆이 아니라 아래 조아용 도장이 맡는다.
                        끄는 동안에는 `num` 이 **놓았을 때의 번호**다 (위 moved/num 주석) —
                        벌어진 틈이 그림으로 말하는 것을 숫자로도 한 번 더 말한다. */}
                    <span aria-label={done ? `${num}번, 방문함` : `${num}번`}
                      style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: 26, minHeight: 26, borderRadius: 999,
                        background: on ? "var(--pin-course-active)" : "var(--brand-primary-soft)",
                        color: on ? "var(--pin-course-active-ink)" : "var(--yong-green-800)",
                        opacity: !on && done ? 0.5 : 1,
                        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)" }}>
                      {num}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
                        opacity: done ? 0.55 : 1 }}>
                        <CategoryIcon type={s.cat} size={18} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
                          fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", lineHeight: 1.4 }}>{s.name}</span>
                        {s.onnuri ? <OnnuriBadge size="sm" /> : null}
                        {/* [다음 차례] 배지가 여기 있었다 (2026-08-20 뺌. 위 markVisited 앞 주석) */}
                      </div>

                      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 3,
                        lineHeight: 1.45, opacity: done ? 0.55 : 1 }}>
                        {CATEGORY_LABELS[s.cat] || "기타"} · {s.biz}
                      </div>

                      {/* ── 방문 표시 ───────────────────────────────────────────
                             작은 알약(size="sm", 28px)이다. 행의 주인공은 상호명이고 이건 그
                             행에 붙이는 표시라 상호명보다 커서는 안 된다. 눌리는 크기는 그대로
                             44px 이다 — 눈에만 작아진다 (Chip 의 CHIP_SIZES 주석).
                             행을 누르면 지도가 옮겨가므로 전파를 끊는다.

                             순서 손잡이가 이 줄에 함께 있었다 (2026-08-20 옮김. 아래 참조). */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Chip size="sm" selected={done} icon="check" aria-pressed={done}
                          onClick={e => { e.stopPropagation(); markVisited(s); }}
                          style={{ marginTop: 0 }}>
                          {done ? "방문함" : "방문 완료"}
                        </Chip>
                      </div>
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

                    {/* ── 순서 손잡이 (2026-08-19 신설 · 2026-08-20 자리 옮김) ──────────
                           곳이 하나뿐이면 옮길 데가 없으므로 나오지 않는다.

                           **행 오른쪽 끝, 세로 한가운데다.** 전에는 [방문 완료] 칩과 한 줄로
                           내용 안에 있었다 — 그 줄이 행의 세 번째 줄이라 손잡이가 행 바닥에
                           붙어 섰고, 잡는 자리가 실제로 옮겨지는 덩어리(행 전체)의 가운데가
                           아니라 아래 모서리였다. 끄는 물건은 자기가 옮기는 것의 무게중심에
                           있어야 한다: 위 칸으로 올리려면 잡은 곳보다 위를 겨눠야 했고,
                           이웃 행의 손잡이와도 한 칸 어긋나 세로로 훑을 때 지그재그가 됐다.
                           이제 넷이 오른쪽에서 한 줄로 서고, 끌면 잡은 높이가 곧 그 행의
                           높이다 (자리를 정하는 기준도 행 상자의 중심선이다 — startDrag).

                           가로 폭을 여기서 44px 가져간다. 방문한 행에서는 도장(56)까지 서므로
                           360px 화면의 긴 상호명이 두 줄로 접힐 수 있다 — 접히게 둔다.
                           행은 고정 높이가 아니고(U-CM-14), 접혀서 잃는 것은 한 줄의 여백인데
                           손잡이가 바닥에 있어서 잃던 것은 끌기 그 자체였다.

                           `touch-action: none` 이 **여기에만** 걸린다 — 이 44px 안에서만
                           브라우저의 스크롤을 끄고, 손잡이 밖에서는 화면이 예전처럼
                           흐른다 (머리말 "끌기는 손잡이에서만 시작한다").

                           단추다. 초점을 받고 ↑/↓ 키로도 옮긴다. 이름에 지금 자리까지
                           적는다 — 소리로 훑으면 "순서 옮기기" 넷이 줄줄이 지나갈 뿐이라
                           무엇이 몇 번째인지가 이름 안에 있어야 한다. */}
                    {stops.length > 1 ? (
                      <button type="button"
                        aria-label={`${s.name} 순서 옮기기, ${stops.length}곳 중 ${num}번. 위아래 화살표 키로 옮깁니다`}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => onHandleKey(s, e)}
                        onPointerDown={e => {
                          e.stopPropagation();
                          /* 포인터를 이 단추에 가둔다 — 손가락이 행 밖으로 나가도 아래
                             onPointerMove 로 계속 들어온다 */
                          e.currentTarget.setPointerCapture(e.pointerId);
                          startDrag(s, i, e);
                        }}
                        onPointerMove={e => { if (dragging) onDragMove(e); }}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        style={{ flex: "0 0 auto", alignSelf: "center",
                          width: "var(--tap-min)", height: "var(--tap-min)",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          background: "none", border: "none", borderRadius: "var(--radius-pill)",
                          touchAction: "none",
                          cursor: dragging ? "grabbing" : "grab",
                          color: dragging ? "var(--text-heading)" : "var(--text-muted)" }}>
                        <Icon name="grip-vertical" size={20} />
                      </button>
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

        {/* [정보 오류 신고]를 뺐다 (2026-08-19). U-CM-10 이 받는 것은 **시설과 점포**의
            정보인데, 이 화면에는 신고할 대상이 없다 — 코스는 원본 자료가 아니라 점포
            데이터로 우리가 만들어낸 묶음이라, 여기서 열리는 폼은 대상 칸이 빈 채로 떴다.
            무엇을 신고하는지 사용자가 직접 적어야 하는 폼이었던 셈이다.

            고칠 것이 있으면 그 가게의 상세로 들어가면 된다 — 위 목록의 순번을 누르면
            미리보기 카드가 뜨고 [상세 보기]가 거기로 데려간다. 그 화면의 신고 버튼은
            대상이 이미 채워져 있다. */}

        {/* 코스는 상점가 점포 데이터에서 만들어지므로 기준일자도 그쪽을 따른다.
             ("기준"이 빠져 있었다 — 다른 화면은 모두 "점포 정보 2026.03. 기준"이다)

             ── 세 줄을 두 줄로 줄였다 (2026-08-19) ────────────────────────────
             전에는 이렇게 나갔다:

               점포 정보 2026.03.
               코스는 추천이며 영업시간과 휴무는 매장마다 다릅니다. 방문 전 확인해 주세요.
               안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.

             둘째 줄이 이미 "이건 확정이 아니다"를 말하는데 셋째 줄이 "참고용입니다"로
             같은 말을 한 번 더 했다. 두 문장을 하나로 잇고, 119 는 껐다 — 이 화면에는
             안전시설이 한 줄도 없다 (DetailNotice 의 emergency 주석. S09·S12 와 같은 이유). */}
        <DetailNotice emergency={false} asOf={`점포 정보 ${asOf} 기준`}>
          <span style={{ display: "block" }}>
            안내 정보는 참고용이며, 코스는 추천 경로입니다.
            영업시간과 휴무는 매장마다 다르니 방문 전에 확인해 주세요.
          </span>
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default CourseDetail;
