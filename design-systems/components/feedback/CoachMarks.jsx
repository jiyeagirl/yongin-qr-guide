import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";

/* 처음 들어온 사람에게 화면을 한 바퀴 짚어주는 코치마크.
 *
 * 한 걸음이 **화면의 한 자리를 밝히고 그 위에 카드 한 장**을 세운다. 카드에는 제목 ·
 * 설명 · 진행 점 · [다음]이 있고, 오른쪽 위 [×] 로 언제든 그만둘 수 있다.
 *
 * ── 왜 스포트라이트인가 ─────────────────────────────────────────────────────
 * 설명만 있는 카드를 화면 한가운데 띄우는 방법도 있지만, 그러면 읽는 사람이 **그 말이
 * 가리키는 곳을 스스로 찾아야 한다** — 「둘러보기 맨 아래에서 볼 수 있어요」를 읽고 나서
 * 둘러보기가 어디인지 다시 눈으로 훑는다. 밝힌 자리와 문장이 한 화면에 함께 있으면
 * 그 찾는 일이 없어진다. 그래서 이 부품은 **말과 자리를 짝지어 주는 것**이 본업이고,
 * 짝지을 자리가 없으면(대상을 못 찾으면) 카드만 아래쪽에 세운다 — 아래 `box` 가 null 인
 * 갈래다. 안내를 통째로 걸러내지 않는 이유는, 그 사람이 잃는 것은 **밝은 자리 하나**이지
 * 안내 전체가 아니기 때문이다.
 *
 * ── 막에 구멍을 뚫는 방법 ───────────────────────────────────────────────────
 * 밝히는 자리에 **테두리를 두르지 않고** 그 자리 크기의 빈 상자에 `box-shadow` 를 아주
 * 넓게(9999px) 퍼뜨린다. 그림자가 곧 막이고, 상자 안쪽은 칠해지지 않으므로 그 자리만
 * 원래 밝기로 남는다. 구멍 하나에 요소 하나면 되고, 대상이 옮겨가도 좌표 넷만 바뀐다.
 *
 * **구멍으로도 손끝은 통하지 않는다.** 구멍 상자는 `pointer-events:none` 이고 그 아래에
 * 화면 전체를 덮는 투명한 막이 따로 깔린다 — 밝힌 자리를 눌러도 아무 일이 없다. 안내를
 * 읽는 동안 발밑에서 탭이 바뀌면, 다음 걸음의 카드가 방금까지와 다른 화면 위에 서게 된다.
 * 다음으로 가는 길은 [다음] 하나이고 그만두는 길은 [×] 하나다 — **막을 눌러 닫히지 않는
 * 것도 같은 이유**다. 읽는 중에 손이 스치면 안내가 통째로 사라진다.
 *
 * ── 여는 쪽이 정하는 것 ─────────────────────────────────────────────────────
 * 이 부품은 **누구에게 보일지 · 봤다는 사실을 어디에 적을지**를 모른다. 그건 화면의
 * 몫이다 (시민용은 `screens/main/data/coachMarks.js`). 여기서는 걸음 목록을 받아 그리고,
 * 끝나면 `onFinish("done")` · 그만두면 `onFinish("skip")` 을 부른다. 둘을 가르는 것은
 * 부르는 쪽이 두 경우에 다른 일을 하고 싶어질 수 있어서다 (지금 시민 화면은 둘 다 같은
 * 일을 한다 — 봤다고 적는다. 끝까지 본 사람에게만 적으면 [×] 로 닫은 사람에게 같은
 * 안내가 다음에 또 뜬다).
 *
 * steps: [{ id, title, body, target }]
 *   target — 밝힐 요소이거나 그것을 돌려주는 함수. 함수인 것은 이 부품이 **그릴 때마다
 *   다시 물어봐야** 하기 때문이다: 대상은 남의 화면 안에 있고, 걸음이 넘어가는 사이에
 *   다시 그려졌을 수 있다.
 */

/* 카드 아래에 붙는 꼬리(정사각형을 45° 돌린다) 한 변. 절반이 카드 밖으로 나간다. */
const TAIL = 14;

/* ── 구멍은 가로로 넓히고 세로로 조인다 (2026-08-28, 사용자 요청) ──────────────
   가로는 대상보다 6px 넓다. 딱 맞게 뚫으면 밝힌 것이 아니라 **잘린 것**으로 보인다 —
   아이콘과 글자가 상자 벽에 닿는다.

   세로는 반대로 6px **좁힌다.** 탭 한 칸은 제 안에 여백을 이미 넉넉히 갖고 있어서
   (아이콘 23 + 글자 한 줄이 64px 짜리 칸 가운데 선다), 사방을 똑같이 넓히면 구멍이
   **탭바 윗선부터 화면 맨 아래까지** 닿는다 — 그러면 밝힌 것이 「탭 한 칸」이 아니라
   「화면 아래 띠 한 조각」으로 보이고, 아래쪽은 잘릴 자리도 없어 화면 끝과 붙는다.
   조여도 아이콘과 글자에는 닿지 않는다.

   세로로 얇은 대상에서는 조이지 않는다 — 아래 `insetY` 가 대상 높이를 보고 물러선다. */
const HOLE_PAD_X = 6;
const HOLE_INSET_Y = 6;

/* 구멍이 남겨야 할 최소 높이. 이보다 얇아질 만큼 조이지 않는다 */
const HOLE_MIN_H = 28;

/* ── 줄바꿈은 낱말에서 (2026-08-28, 사용자 요청) ──────────────────────────────
   브라우저 기본값은 한글을 **글자 사이 아무 데서나** 끊는다. 좁은 카드에서 그러면
   「가까운 AED, 대피 / 소, 쉼터」처럼 낱말 한가운데가 갈리고, 읽는 사람이 다음 줄에
   가서야 그것이 「대피소」였음을 안다.

   이 카드는 그 값이 특히 크다 — **처음 온 사람이 읽는 유일한 설명**이고 문장이 두엇뿐이라
   잘못 끊긴 줄 하나가 화면에서 차지하는 비중이 크다. `keep-all` 은 띄어쓰기에서만 끊고,
   짝으로 두는 `overflowWrap: anywhere` 는 한 낱말이 통째로 카드 폭을 넘을 때의 보험이다
   (`EmptyState` · `CopyField` 와 같은 방식이다).

   **제목에도 건다.** 제목은 [×] 와 폭을 나눠 쓰므로 본문보다 먼저 접히고, 잘못 끊기면
   본문보다 먼저 눈에 띈다. (여기에 화면의 실제 제목을 예로 적어 두었다가 지웠다 —
   문구는 부르는 쪽의 것이라 이 부품이 인용하면 저쪽이 한 낱말 고칠 때마다 여기가 낡는다.) */
const WRAP = { wordBreak: "keep-all", overflowWrap: "anywhere" };

export function CoachMarks({
  steps = [],
  onFinish,
  nextLabel = "다음",
  prevLabel = "이전",
  doneLabel = "시작하기",
  skipLabel = "안내 건너뛰기",
  style,
  ...rest
}) {
  const host = React.useRef(null);
  const card = React.useRef(null);
  const [i, setI] = React.useState(0);
  const [box, setBox] = React.useState(null);

  const step = steps[i] || null;
  const last = i >= steps.length - 1;

  /* ── 밝힐 자리를 잰다 ─────────────────────────────────────────────────────
     상수로 적을 수 없는 값이다. 탭 한 칸의 폭은 화면 폭을 탭 수로 나눈 것이고, 높이는
     2차 글자 확대에서 늘어난다 (U-CM-14 — 이 시스템에는 고정 높이가 없다).

     좌표는 **이 부품의 상자 기준**으로 옮겨 적는다. 화면(viewport) 기준으로 두면
     데스크톱 검수용 기기 틀 안에서(390×844 로 세운 상자) 구멍이 통째로 어긋난다.

     ── 한 번 재고 관찰로 기다리는 것으로는 모자랐다 (2026-08-28) ────────────────
     처음에는 `ResizeObserver` 로 이 상자와 대상의 **크기 변화**만 지켜봤는데, 검수
     화면에서 구멍이 탭바보다 한 칸 위에 떠 있었다. **대상은 크기가 그대로인 채로
     움직인다** — 이 셸은 세로 flex 라(띠 · 지도 영역 · 탭바) 가운데가 한 픽셀이라도
     자라면 탭바가 통째로 내려가고, 탭 한 칸의 크기는 그대로다. 그런 일이 첫 화면에서
     실제로 일어난다: 웹폰트(Pretendard)가 뒤늦게 도착하며 띠의 글줄 높이가 바뀌고,
     모바일 브라우저의 `100dvh` 는 주소창이 접히며 다시 정해진다. 크기만 보는 관찰자는
     그때 한 번도 깨어나지 않고, 구멍은 처음 잰 자리에 남는다.

     그래서 **열려 있는 동안 프레임마다 다시 잰다.** 값이 달라졌을 때만 상태를 바꾸므로
     (`same`) 다시 그리는 일은 실제로 움직였을 때뿐이고, 재는 것은 매 프레임 두 번의
     `getBoundingClientRect` 다 — `Sheet` 가 스냅 트랜지션 내내 제 높이를 올려보내는
     것과 같은 방식이고, 이 부품은 그보다 훨씬 짧게 떠 있다. */
  React.useLayoutEffect(() => {
    if (!step) return undefined;
    const same = (a, b) => (a === null && b === null)
      || Boolean(a && b && a.top === b.top && a.left === b.left
        && a.width === b.width && a.height === b.height && a.hostH === b.hostH);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const h = host.current;
      const el = typeof step.target === "function" ? step.target() : step.target;
      let next = null;
      if (h && el && typeof el.getBoundingClientRect === "function") {
        const a = h.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        /* 폭이나 높이가 0 이면 아직(또는 이미) 화면에 없는 것이다 — 구멍을 0×0 으로
           뚫으면 막만 남고 어디를 가리키는지는 사라진다. 그때는 대상이 없는 것으로 본다 */
        if (b.width && b.height) {
          next = { top: b.top - a.top, left: b.left - a.left,
            width: b.width, height: b.height, hostH: a.height };
        }
      }
      setBox(cur => (same(cur, next) ? cur : next));
    };
    tick();   /* 첫 번째는 그리기 전에 — 구멍이 엉뚱한 자리에서 시작하지 않게 */
    return () => cancelAnimationFrame(raf);
  }, [step]);

  /* 걸음이 넘어갈 때마다 카드에 초점을 옮긴다. 보조기기에는 그 순간 새 제목과 설명이
     읽히고, 키보드로 [다음]을 누르던 사람은 다음 카드의 처음에서 다시 시작한다. */
  React.useEffect(() => {
    if (card.current) card.current.focus({ preventScroll: true });
  }, [i]);

  const finish = React.useCallback(reason => { if (onFinish) onFinish(reason); }, [onFinish]);

  /* Esc 는 [×] 와 같다. 이 화면은 모바일 웹이지만 검수와 키보드 사용자를 위해 둔다 */
  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape") finish("skip"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  /* Tab 이 카드 밖으로 나가지 않게 잡는다. 손끝은 막이 이미 막고 있는데 초점만 뒤 화면으로
       빠져나가면, 키보드로 읽는 사람에게는 **막이 없는 것과 같다** — 안 보이는 버튼들을
       하나씩 지나 다시 여기로 돌아와야 한다. 카드 안에 초점 갈 곳은 [×] · [이전] · [다음]
       셋뿐이라 목록을 그때그때 읽어도 비용이 없다. */
  const trap = e => {
    if (e.key !== "Tab" || !card.current) return;
    const stops = card.current.querySelectorAll("button");
    if (!stops.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || at === card.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  };

  if (!step) return null;

  const next = () => (last ? finish("done") : setI(n => n + 1));
  /* ── 되돌아가는 길 (2026-08-28, 사용자 요청) ────────────────────────────────
     [다음]만 있으면 **한 걸음 넘어간 순간 앞 걸음은 영영 못 본다.** 안내를 읽는 도중에
     화면 쪽으로 눈이 갔다 오면 방금 읽던 문장을 놓치는데, 그때 할 수 있는 일이 [×] 로
     끄고 처음부터 다시 여는 것뿐이었다 — 그런데 그렇게 끄면 「봤다」로 적혀 다시 열리지도
     않는다.

     **진행 점을 누르게 하지는 않는다.** 점은 6px 이라 손가락 자리(44px)를 지키려면 점마다
     보이지 않는 상자를 두르게 되는데, 그러면 점 사이 여백이 전부 눌리는 자리가 되어 카드를
     잡으려던 손끝이 걸음을 옮긴다. 점이 하는 말은 **「몇 걸음 중 몇 번째」**이고, 그것을
     조작으로 읽으라는 것은 화면에 적히지 않은 규칙이다 — 되돌아가는 길은 **글자로 적힌
     단추**가 맡는다. */
  const prev = () => setI(n => Math.max(0, n - 1));

  /* 본문은 **문장마다 줄을 새로 시작한다** (2026-08-28, 사용자 요청).
     두 문장이 한 문단으로 흐르면 「…있어요. 상점가」처럼 앞 문장의 끝과 뒤 문장의 머리가
     한 줄에 붙어, 어디까지가 한 마디인지 읽어봐야 안다. 이 카드는 문장이 한둘뿐이라 줄을
     나눠도 카드가 한 줄 이상 길어지지 않는다.

     **마침표만 보고 자르지 않는다 — 뒤에 빈칸(또는 끝)이 와야 문장 끝이다.** 그냥 자르면
     「1.4km」·「2026.08. 기준」처럼 **수 안의 마침표**에서 줄이 갈린다. 지금 이 셋에는
     그런 글자가 없지만, 다음 사람이 거리나 날짜를 한 줄 적는 순간 조용히 깨지는 자리다.
     뒤돌아보기(lookbehind) 대신 한 글자씩 훑는 것은, 아직 그 문법을 모르는 브라우저에서
     **정규식이 든 파일 전체가 통째로 죽기** 때문이다. */
  const sentences = [];
  {
    const body = String(step.body || "");
    let buf = "";
    for (let n = 0; n < body.length; n += 1) {
      buf += body[n];
      /* 숫자 바로 뒤의 마침표도 문장 끝이 아니다 — 「2026.08. 기준입니다」가 그 경우다
         (빈칸이 뒤따르므로 위 조건만으로는 걸러지지 않는다). 이 앱의 문장은 「…요.」·
         「…다.」로 끝나지 수로 끝나지 않는다 */
      const end = /[.!?]/.test(body[n])
        && (n + 1 >= body.length || /\s/.test(body[n + 1]))
        && !/[0-9]/.test(body[n - 1] || "");
      if (end) { sentences.push(buf.trim()); buf = ""; }
    }
    if (buf.trim()) sentences.push(buf.trim());
  }

  /* 조이는 폭은 대상 높이가 정한다 — 44px 짜리 단추를 12px 조이면 32px 이 남지만,
     그보다 얇은 것을 만나면 조이다가 구멍이 사라진다 */
  const insetY = box ? Math.min(HOLE_INSET_Y, Math.max(0, (box.height - HOLE_MIN_H) / 2)) : 0;
  const hole = box
    ? { top: box.top + insetY, left: box.left - HOLE_PAD_X,
        width: box.width + HOLE_PAD_X * 2, height: box.height - insetY * 2 }
    : null;

  return (
    <div ref={host} onKeyDown={trap}
      style={{ position: "absolute", inset: 0, zIndex: "var(--z-modal)", ...style }} {...rest}>

      {/* 손끝을 받는 막. 구멍이 뚫려 있을 때는 색을 칠하지 않는다 — 칠하는 일은 아래
          구멍 상자의 그림자가 맡고, 여기에도 칠하면 그 자리만 두 겹이 된다 */}
      <div style={{ position: "absolute", inset: 0,
        background: hole ? "transparent" : "var(--overlay-scrim)" }} />

      {hole ? (
        <div style={{ position: "absolute", top: hole.top, left: hole.left,
          width: hole.width, height: hole.height, borderRadius: "var(--radius-control)",
          boxShadow: "0 0 0 9999px var(--overlay-scrim)", pointerEvents: "none",
          transition: "top var(--dur-slow) var(--ease-out), left var(--dur-slow) var(--ease-out),"
            + " width var(--dur-slow) var(--ease-out), height var(--dur-slow) var(--ease-out)" }} />
      ) : null}

      {/* 카드 — 밝힌 자리 바로 위에 선다. 대상을 못 찾았으면 탭바 위쪽에 그대로 세운다 */}
      <div ref={card} role="dialog" aria-modal="true" aria-label={step.title} tabIndex={-1}
        style={{ position: "absolute", left: "var(--gutter-screen)", right: "var(--gutter-screen)",
          bottom: hole
            ? `calc(${Math.max(0, (box.hostH || 0) - hole.top)}px + var(--space-2))`
            : "calc(var(--tabbar-h) + var(--space-4))",
          /* 세로 간격은 10px 다 — `--space-3`(12) 에서 2px 줄였다 (2026-08-28, 사용자 요청).
             제목과 본문이 한 이야기인데 12px 이 그 둘을 갈라놓아 보였다. 8(`--space-2`)까지
             내리면 이번에는 제목이 본문에 붙어 한 덩어리가 된다. 눈금 사이의 값이라 토큰이
             없고, 그래서 **눈금에서 얼마를 뺐는지가 보이게** 적는다 (상수 10 이 아니라 calc).
             이 값이 실제로 화면의 간격이 되려면 제목 줄이 제 글줄 높이여야 한다 — 위 [×] 의
             음수 여백 주석. */
          display: "flex", flexDirection: "column", gap: "calc(var(--space-3) - 2px)",
          /* 위만 1px 넉넉하다 (2026-08-28, 사용자 요청) — 카드 맨 윗줄은 제목의 **글줄**이라
             글자 위로 남는 여백이 아래쪽 글자 밑 여백보다 좁아 보인다. 1px 은 그 차이만 갚는
             값이고, 눈금을 옮길 만한 크기가 아니라 여기서 더한다 */
          padding: "calc(var(--space-4) + 1px) var(--space-4) var(--space-4)",
          background: "var(--surface-card)",
          border: "var(--stroke-hairline) solid var(--border-default)",
          borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-raised)",
          outline: "none" }}>

        {/* 꼬리. 카드와 같은 흰 면이고 테두리 두 변만 이어받는다 — 삼각형을 따로 그리면
            카드의 1px 테두리가 그 자리에서만 끊긴다. 좌우 끝에서는 카드 밖으로 나가지
            않게 clamp 로 잡는다 (탭이 셋일 때는 걸리지 않지만, 값이 자리를 벗어나는지는
            부르는 쪽이 아니라 여기서 막아야 한다) */}
        {hole ? (
          <span aria-hidden="true"
            style={{ position: "absolute", bottom: -TAIL / 2, width: TAIL, height: TAIL,
              left: `clamp(var(--space-4), calc(${box.left + box.width / 2}px`
                + ` - var(--gutter-screen) - ${TAIL / 2}px), calc(100% - var(--space-4) - ${TAIL}px))`,
              background: "var(--surface-card)",
              borderRight: "var(--stroke-hairline) solid var(--border-default)",
              borderBottom: "var(--stroke-hairline) solid var(--border-default)",
              transform: "rotate(45deg)" }} />
        ) : null}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
          <strong style={{ flex: 1, minWidth: 0, font: "var(--type-title-3)",
            color: "var(--text-heading)", letterSpacing: "var(--ls-snug)", ...WRAP }}>{step.title}</strong>
          {/* [×] 는 카드의 오른쪽 위다. 화면 맨 위에 따로 두는 방법도 있으나, 거기 서면
              어두운 막 위에 홀로 뜬 부호가 되어 **무엇을 닫는 것인지**가 흐려진다.

              ── 아래쪽 음수 여백이 요점이다 (2026-08-28, 「여백이 안 맞는다」는 지적) ──────
              이 단추는 손가락 자리라 44px 인데 제목 한 줄은 23px 이다. 위로만 -12 를 주면
              단추의 상자가 제목 줄보다 **9px 더 아래까지** 뻗어, 제목과 본문 사이가 카드가
              정한 간격이 아니라 **그 9px 을 더한 값**이 된다 — 위(카드 여백 16)보다 아래가
              넓어져 제목이 본문 쪽이 아니라 위쪽에 붙어 보였다. 아래로도 -12 를 주면 상자가
              20px 이 되어 제목 줄 안에 들어가고, 간격은 카드가 적은 값 그대로가 된다.
              **44px 손가락 자리는 그대로다** — 줄어든 것은 자리를 차지하는 폭이지 눌리는
              넓이가 아니다(카드 여백 위로 겹쳐 눌린다). */}
          <button type="button" onClick={() => finish("skip")} aria-label={skipLabel}
            style={{ flex: "0 0 auto", width: "var(--tap-min)", height: "var(--tap-min)",
              margin: "-12px -12px -12px 0", display: "inline-flex", alignItems: "center",
              justifyContent: "center", background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)" }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* 본문은 16px 이다 (U-CM-13). 처음 온 사람이 읽는 유일한 설명이라 여기서 줄이지 않는다.
            문장마다 줄을 새로 시작하되 **한 문단**이다 — 사이를 벌리지 않으므로(같은 줄 높이)
            문장이 길어 접히면 그 줄들은 평소처럼 이어 붙는다 */}
        <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
          lineHeight: "var(--lh-body)", color: "var(--text-body)", ...WRAP }}>
          {sentences.map((s, n) => <span key={n} style={{ display: "block" }}>{s}</span>)}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "var(--space-3)" }}>
          {/* 진행 점 — 지금 걸음만 알약으로 늘어난다. 색만 바꾸면 색을 못 가리는 눈에는
              점 셋이 그대로다 (색만으로 상태를 전하지 않는다). 개수는 소리로도 들려준다 */}
          <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {steps.map((s, n) => (
              <span key={s.id || n}
                style={{ width: n === i ? 18 : 6, height: 6, borderRadius: "var(--radius-pill)",
                  background: n === i ? "var(--brand-primary)" : "var(--border-strong)",
                  transition: "width var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)" }} />
            ))}
          </span>
          <VisuallyHidden>{`${steps.length}단계 중 ${i + 1}단계`}</VisuallyHidden>
          {/* 단추 둘은 오른쪽 끝에 나란히 선다. [이전]은 **첫 걸음에서는 없다** — 돌아갈
              자리가 없는데 흐린 단추를 세워 두면 「왜 못 누르나」를 한 번 묻게 된다.
              바탕이 없는(ghost) 것은 [다음]과 무게가 같아 보이지 않게 하려는 것이다 —
              이 카드가 권하는 다음 동작은 하나뿐이다. */}
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            {i > 0 ? <Button size="sm" variant="ghost" onClick={prev}>{prevLabel}</Button> : null}
            <Button size="sm" variant="primary" onClick={next}>{last ? doneLabel : nextLabel}</Button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default CoachMarks;
