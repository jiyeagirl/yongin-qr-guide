import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 플로팅 지도 컨트롤 (기능명세서 5-3 #3).
   목록 토글과 QR 지점 복귀 버튼을 화면 하단에 고정하면 시트가 올라올 때 시트 뒤로 사라진다.
   그래서 시트 상단 모서리에 앵커링해 함께 움직인다.

     bottom = clamp(시트 높이 + --float-gap, --float-gap, 지도 높이 - 44px - --float-gap)
     전체 스냅에서는 hidden — 시트가 화면을 소유하므로 버튼이 스크림 위에 떠 있으면 안 된다

   bottom 은 Sheet 의 onHeightChange 가 준 px 값을 넘기는 것이 정확하다.
   측정값이 없을 때만 토큰(--sheet-half 등)으로 떨어진다.

   ── bottom 에 트랜지션을 걸지 않는다 (2026-08-25) ────────────────────────────
   전에는 "시트와 같은 --dur-slow / --ease-out. 따로 두면 버튼이 시트를 쫓아가는 것처럼
   보인다"였는데, 실제로 쫓아가게 만든 것이 그 트랜지션이었다. 앵커로 받는 값이 이미
   **프레임마다 갱신되는 실측 높이**라(Sheet 의 report_ 루프) 여기에 320ms 를 한 번 더
   걸면 버튼이 시트보다 320ms 늦게 출발해 시트가 멈춘 뒤에도 혼자 미끄러진다.
   빼고 나면 앵커가 시트의 윗변을 그대로 따라간다. 미리보기 카드도 같은 이유로 뺐다
   (MapPreviewCard) — 둘이 같은 모서리에 얹혀 있어 한쪽만 지연되면 어긋나 보인다.
   opacity 는 그대로 둔다. 그쪽은 프레임마다 오는 값이 아니라 전체 스냅에서 한 번
   0/1 로 바뀌는 값이라 트랜지션이 있어야 켜지고 꺼지는 것이 보인다.

   ── `subtle` — **반경 고르개와 같은 알약** (2026-08-26, 사용자 요청) ─────────────
   시민 지도의 [스캔 위치로]가 쓴다. 이 단추와 안내 반경 고르개는 **같은 지도 위에 함께
   떠 있는 둘**인데 서로 다른 부품처럼 보였다 — 한쪽은 34px 알약에 13px 글자, 다른 쪽은
   48×44 짜리 둥근 네모에 아이콘을 이고 선 12px 글자였다. 이제 `InlineSelect` 의
   `floating` 과 **같은 값을 쓴다**: 34px · 알약 · `--surface-float-translucent`(.82) +
   `--blur-glass` · `--border-float-translucent` · `--shadow-card` · `--text-body`.

     쌓기   **없어졌다.** 아이콘 위 · 글자 아래로 쌓았던 것은 같은 날 아침 「스캔 위치로」를
            옆에 붙였더니 알약이 120px 을 넘어 지도 오른쪽 아래를 덮었기 때문이다. 지금은
            글자가 `--fs-micro`(12px, 눈금의 마지막 칸)이고 아이콘이 14px 이라 옆에 붙여도
            **100px 남짓**이다 — 높이가 48 에서 34 로 내려간 만큼을 폭으로 돌려준 셈이고,
            그 값에서는 두 부품이 같은 것으로 읽히는 편이 낫다
     두 겹   보이는 34px 과 눌리는 44px 을 나눈다 (바깥 button 이 위아래 5px 투명 여백을
            갖는다). `InlineSelect.floating` 과 Chip 이 쓰는 그 수법이다 — **작아 보이는
            것과 손가락 자리는 다른 이야기다**

   글자를 다시 떼지는 않는다 (v1.9 가 그림만으로 말하는 것을 그만둔 판이다) — 작아졌을 뿐
   어디로 가는 단추인지는 여전히 글자가 적는다.

   `topInset` — 위에서 가려지는 높이(px). 상단 필터 바의 실측값을 넘긴다. 기둥이 그보다
   위로는 올라가지 않는다. 시트가 필터 바 아래까지만 올라오는 것과 같은 이야기이고
   (`Sheet` 의 같은 이름 prop), 같은 실측값을 쓴다.

   > `place="top"`(상단 필터 바 바로 아래)이 2026-08-26 에 잠깐 있었다 — [스캔 위치로]를
   > 반경 고르개 밑에 붙이려던 것이다. **같은 날 되돌렸다** (사용자 요청): 붙여 놓고 보니
   > 화면 오른쪽 위가 검색창·칩 줄·고르개·단추로 **넉 줄**이 됐고, 지도를 보라고 만든
   > 화면에서 위쪽이 통째로 막히는 것이 v1.11 이 내내 고쳐 온 문제다. 대신 **폭을 맞췄다**
   > (아래 `onWidthChange`) — 통일감은 자리가 아니라 모양이 낸다.

   ── `onWidthChange` — 이 기둥의 실측 **폭** (2026-08-26, 사용자 요청) ─────────────
   [스캔 위치로]와 안내 반경 고르개는 화면의 반대쪽 끝에 떨어져 서므로 **덩어리 크기가
   같아야** 한 벌로 읽힌다. 두 알약 중 **글자가 긴 이쪽이 늘 넓으므로** 이 값을 재서
   고르개에 넘기고, 고르개는 그 값을 제 최소 폭으로 삼는다 (`InlineSelect` 의
   `faceMinWidth`). 이쪽은 늘 제 폭 그대로라 **여백이 붙지 않는다.**

   > 처음에는 토큰 상수로 했다가(`--float-pill-min:108px`) 같은 날 이 방식으로 바꿨다.
   > 한글 글자 폭을 눈대중으로 셈해 박은 수라 **고르개에는 20px 짜리 빈 자리가 생기고
   > 단추는 그 수를 넘겨** 둘이 어긋났다. 글꼴이 무엇으로 잡히는지 · 2차 글자 확대가
   > 걸렸는지에 따라 달라지는 값을 상수로 적을 수는 없다 — **재야 하는 값이다.**

   `children` 슬롯이 여기 있었다 (2026-08-26 아침 신설 → 같은 날 삭제). 세로 반경
   고르개(`RadiusSlider`)를 이 기둥에 세우려고 열었는데, 그 고르개가 **지도 오른쪽을 너무
   많이 차지해** 상단 필터 바의 칩 줄 아래로 내려갔다 (사용자 요청. `MapFilterOverlay` 의
   `trailing`). 손님이 없어진 슬롯은 함께 닫는다. */
export function FloatingControls({ bottom = "var(--sheet-half)", hidden = false, topInset = 0,
  subtle = false, items = [], onWidthChange, style, ...rest }) {
  const anchor = typeof bottom === "number" ? `${bottom}px` : bottom;
  const top = typeof topInset === "number" ? `${topInset}px` : topInset;

  /* 위쪽 상한은 **이 기둥의 실측 높이**로 잰다 (2026-08-26). 전에는 `--tap-min`(44px)
     상수였는데, 글자를 아이콘 아래로 쌓던 시절의 `subtle` 이 그보다 높아지면서 시트를
     끝까지 올렸을 때 **기둥 윗머리가 그만큼 지도 위로 밀려났다.** 지금은 다시 옆으로
     붙어 44 로 돌아왔지만 **상수로 되돌리지 않는다** — 안에 무엇이 서는지 이 부품이
     모르고, 2차 글자 확대에서는 잰 값만이 따라온다. */
  const col = React.useRef(null);
  const [h, setH] = React.useState(0);
  /* 폭을 알리는 쪽은 ref 로 든다 — 부모가 인라인 함수를 넘겨도 관찰자를 다시 달지 않는다 */
  const reportW = React.useRef(onWidthChange);
  reportW.current = onWidthChange;
  React.useEffect(() => {
    const el = col.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const send = () => {
      setH(el.offsetHeight);
      /* 기둥은 절대 배치라 폭이 없다 — 안에 선 단추 중 가장 넓은 것의 폭이 그대로 나온다.
         `getBoundingClientRect` 로 재는 이유는 소수점이다: `offsetWidth` 는 반올림한
         정수라 두 알약이 1px 어긋난 채 서는 일이 생긴다 */
      if (reportW.current) reportW.current(el.getBoundingClientRect().width);
    };
    const ro = new ResizeObserver(send);
    ro.observe(el);
    send();
    return () => ro.disconnect();
  }, []);
  const tall = h ? `${h}px` : "var(--tap-min)";

  return (
    <div ref={col} style={{ position: "absolute", right: "var(--float-inset)",
      bottom: `clamp(var(--float-gap), calc(${anchor} + var(--float-gap)), calc(100% - ${top} - ${tall} - var(--float-gap)))`,
      zIndex: "var(--z-float)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-2)",
      opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : "auto",
      transition: "opacity var(--dur-base) var(--ease-standard)", ...style }}
      aria-hidden={hidden ? "true" : undefined} {...rest}>
      {items.map(it => {
        const on = !!it.active;
        /* `subtle` 이면 **보이는 것**은 이 알약이고 바깥 button 은 손가락 자리다.
           값은 `InlineSelect.floating`(안내 반경 고르개)에서 그대로 가져왔다 — 두 부품이
           같은 지도 위에 함께 서므로 여기서 조금이라도 다르게 적으면 그만큼 어긋난다.
           켜진 상태(`active`)만 브랜드 초록으로 덮는다: 그때는 「지금 이 상태다」가
           비켜서 있는 것보다 먼저다 (지금 시민 화면에 켜지는 단추는 없다 — 관리자
           `CoordField` 가 `subtle` 없이 쓰는 길이 그쪽이다). */
        const face = {
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
          /* 폭은 **제 글자만큼**이다 — 둘 중 넓은 쪽이라 여백을 붙일 이유가 없고,
             이 폭을 `onWidthChange` 가 고르개에 넘겨 그쪽이 맞춰 온다 (위 머리말) */
          minHeight: 34, padding: "0 12px 0 10px",
          background: on ? "var(--brand-primary)" : "var(--surface-float-translucent)",
          backdropFilter: on ? undefined : "var(--blur-glass)",
          WebkitBackdropFilter: on ? undefined : "var(--blur-glass)",
          border: "var(--stroke-hairline) solid "
            + (on ? "var(--brand-primary)" : "var(--border-float-translucent)"),
          borderRadius: "var(--radius-pill)",
          /* 그림자도 고르개와 같은 한 단이다 — 비쳐 보이는 것 아래에 짙은 그림자가
             깔리면 떠 있는 만큼 지도를 다시 가린다 */
          boxShadow: "var(--shadow-card)",
          color: on ? "var(--text-on-brand)" : "var(--text-body)",
          fontSize: "var(--fs-micro)", lineHeight: "var(--lh-micro)",
          fontWeight: "var(--fw-semibold)",
        };
        return (
          <button key={it.label} onClick={it.onClick} aria-label={it.label} title={it.label} aria-pressed={it.active}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", minHeight: "var(--tap-min)", whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
              ...(subtle
                /* 위아래 5px 이 투명 여백이다 (34 + 5 + 5 = 44). Chip · InlineSelect 와
                   같은 수법 — 보이는 것이 작아져도 누를 수 있는 넓이는 줄지 않는다 */
                ? { padding: "5px 0", background: "none", border: "none" }
                : { gap: 6, minWidth: "var(--tap-min)",
                    padding: it.text ? "10px 14px" : "0 12px",
                    background: on ? "var(--brand-primary)" : "var(--surface-card)",
                    color: on ? "var(--text-on-brand)" : "var(--text-heading)",
                    border: "var(--stroke-hairline) solid "
                      + (on ? "var(--brand-primary)" : "var(--border-default)"),
                    borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-raised)",
                    fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)" }) }}>
            {subtle
              ? <span style={face}><Icon name={it.icon} size={14} />{it.text}</span>
              : <><Icon name={it.icon} size={20} />{it.text}</>}
          </button>
        );
      })}
    </div>
  );
}
