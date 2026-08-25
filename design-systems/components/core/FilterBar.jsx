import React from "react";
import { Chip } from "./Chip.jsx";
import { CategoryIcon } from "./CategoryIcon.jsx";
import { Icon } from "./Icon.jsx";

/* 업종 칩 필터 (U-ST-10) + 활성 필터 요약.
   기능명세서 5-3 #4 에서 정해야 했던 "상단 필터 바의 고정 범위"의 답:

     고정하는 것   업종 칩 한 줄 (+ 켜져 있을 때만 나타나는 활성 필터 pill 줄)
     고정하지 않는 것  검색창, 온누리 칩, 축제 배너, 신규·인기 매장

   셋 다 고정하면 시트 자체 헤더까지 더해 화면 상단 40% 가 필터로 찬다. 칩만 고정하면
   68px(2차 확대에도 min-height 로만 늘어난다)이고, 검색·토글은 시트를 조금만 내리면 다시 나온다.
   대신 스크롤로 사라진 필터가 켜져 있을 수 있으므로, 그 상태는 pill 로 칩 줄에 남긴다.
   ("결과가 왜 12곳뿐인가"에 답할 수 있어야 한다)

   sticky 는 시트의 스크롤 컨테이너 기준으로 붙는다 (position:sticky; top:0).

   renderIcon / label 은 같은 칩 줄을 다른 축에도 쓰기 위한 것이다.
   상점가 탭은 업종 7종(CategoryIcon), 공공시설 탭은 시설 4종(FacilityIcon)을 칩으로 쓴다 —
   생김새와 sticky 규칙은 같아야 하고 아이콘 체계만 달라야 한다 (5-2).

   ── 여럿 고르기 (2026-08-20) ───────────────────────────────────────────────
   `value` 에 **배열**을 주면 칩이 켜고 끄는 스위치가 된다. 문자열을 주면 예전처럼 하나만
   골린다 — 부르는 쪽이 축의 성질에 따라 고른다.

   배열 모드에서 **빈 배열은 "전체"** 다. 이 규칙은 그대로다.

   ── [전체] 칩을 되살린다 (2026-08-24, 사용자 요청) ─────────────────────────
   2026-08-20 에 뺐던 것이다. 뺀 이유는 둘이었는데, **하나는 지금 고쳤고 하나는 값을
   다시 매겼다.**

   ⑴ **자리** — 다섯 알약이 되면 좁은 화면에서 마지막 칩이 화면 밖으로 밀렸고
      (공공시설 탭의 [화장실]이 실제로 그랬다), 가로로 밀면 나오기는 하지만
      **밀 수 있다는 것 자체가 보이지 않았다.** 그때는 칩을 빼서 피했는데, 진짜 문제는
      칩 수가 아니라 **칩 줄이 끝을 감추는 방식**이었다. 아래 두 가지로 고친다:

        가장자리까지 흘린다   칩 줄이 오른쪽 여백에서 끊기지 않고 **화면 끝까지** 간다.
                              그래서 넘치면 마지막 칩이 늘 **잘린 채 걸쳐 보인다** —
                              잘린 알약은 "여기서 끝"이 아니라 "더 있다"고 말한다.
        끝을 흐린다           오른쪽으로 더 밀 수 있는 동안만 끝 24px 에 페이드를 건다.
                              칩 경계가 하필 화면 끝에 딱 맞아떨어져 잘린 자리가 안 생기는
                              경우까지 덮는다. 다 밀면 페이드가 사라져 끝인 줄 안다.

      (`floating` 이라 배경이 투명하므로 흰 그러데이션을 덧대지 못한다. 알파를 깎는
       mask-image 라야 지도 위에서도 맞는다.)

   ⑵ **뜻** — "여럿 고르기에서 [전체]는 칩이 아니라 다른 종류의 동작(모두 해제)이다"가
      뺀 두 번째 이유였다. 맞는 말이지만 **그 대가가 더 컸다**: 칩을 세 개 켜 둔 사람이
      전체로 돌아가려면 켠 것을 하나씩 다시 눌러야 했고, 돌아갈 자리가 화면에 없으니
      「전체」라는 상태가 있다는 것 자체가 목록 머리 글자로만 남았다. [전체]는 켜져 있는
      상태(빈 배열)를 **보여주기도** 한다 — 알약 하나가 상태와 되돌리기를 함께 맡는다.
      대신 혼자 다르게 동작하는 것은 사실이므로 그만큼만 다르게 둔다: 켜져 있을 때
      다시 눌러도 꺼지지 않는다 (이미 전체다). 나머지 칩은 그대로 켜고 꺼진다.

   [전체]의 개수는 **보이는 칩들의 합**이다 — 부르는 쪽이 총계를 따로 넘기면 칩 줄의 합과
   어긋날 길이 열린다 (0건이라 숨긴 칩이 총계에는 남는 식으로). 상점가 335, 공공시설은
   그 QR 지점 둘레의 시설 수가 그대로 나온다.

   역할(role)도 함께 바뀐다. 하나만 고르는 줄은 tablist/tab 이지만, 여럿 고르는 줄에서
   그것은 틀린 이름이다 — 탭은 한 번에 하나만 선택되는 것을 뜻한다. 배열 모드에서는
   group + aria-pressed 로, 켜고 끄는 단추 묶음이라고 말한다. */
/* ── 한 줄에 몇 개가 들어오느냐 (2026-08-24) ────────────────────────────────
   [전체]를 되살리고 나니 공공시설 탭이 다섯 알약이 됐고, 360px 화면에서 마지막 [화장실]이
   가장자리 너머로 **통째로** 나가 있었다. 잘린 칩과 페이드가 "더 있다"고는 말하지만,
   유형이 넷뿐인 줄에서 그중 하나가 아예 안 보이는 것은 그것대로 손해다 — 밀기 전에는
   화장실을 고를 수 있다는 사실 자체가 화면에 없다.

   글자를 줄이지 않고 **여백만** 걷어낸다 (`size="sm"` 은 12px 글자가 되어 칩이 주인공인
   줄에서 결과보다 조건이 작아진다). 두 자리에서 가져온다:

     GAP    알약 사이. 6 → 5. 알약에 이미 테두리가 있어 1px 은 눈에 띄지 않는다.
     dense  알약 안쪽 가로 여백 (Chip 머리말). 개당 −7px 이 가장 큰 몫이다.

   **페이드 폭은 걸치는 조각보다 좁아야 한다** (24 → 12 로 줄임). 페이드는 원래 잘린 자리가
   안 생기는 경우를 덮으려고 둔 것인데, 24px 이면 벌어 놓은 24px 짜리 조각을 **그 페이드가
   통째로 지운다** — 보이라고 만든 것을 흐리게 하는 꼴이다. 12 면 조각의 앞 절반이 또렷하게
   남고 끝만 풀리면서 사라진다. 그게 "잘렸다"의 생김새다.

   ── 줄의 양 끝을 검색창에 맞춘다 (2026-08-25, 사용자 요청) ───────────────────
   그 사이 이 줄은 왼쪽으로 8px 나가 있었고(`INSET` 12) 오른쪽은 화면 끝까지 흘렀다.
   둘 다 **폭을 벌기 위한 것**이었는데, 벌어 놓은 폭이 실제로는 도움이 되지 않았다 —
   상점가 탭에서 [쇼핑]이 딱 맞게 들어차고 [미용/생활]은 통째로 밖에 있어서, **밀 수
   있다는 것이 화면에 보이지 않았다.** 잘린 조각이 없으면 페이드 12px 만 남는데 그것은
   여백과 구별되지 않는다.

   지금은 양쪽 다 `gutter` 다 — 위 검색창과 **같은 세로선에서 시작하고 같은 선에서 끝난다.**
   줄이 8+20px 좁아지므로 넘침이 그만큼 커지고, 그래서 [쇼핑]이 잘린 채 걸친다.
   목적이 바뀐 것이 아니라 방법이 바뀌었다: 폭을 벌어 한 칩을 더 넣는 대신, **잘린 칩을
   확실히 만들어** 더 있다는 것을 보이게 한다. 오른쪽 끝의 여백 스페이서도 함께 없앴다 —
   줄이 화면 끝까지 가지 않으므로 여백을 줄 안에서 만들 이유가 없다. */
const FADE = 12;
const GAP = 5;

export function FilterBar({ chips = [], value, onChange, active = [], sticky = true, floating = false, leading,
  renderIcon, label = "업종 필터", allChip = true, allLabel = "전체",
  gutter = "var(--gutter-screen)", style, ...rest }) {
  const icon = renderIcon || (c => <CategoryIcon type={c.id} size={15} />);

  const multi = Array.isArray(value);
  const isOn = id => (multi ? value.includes(id) : value === id);
  /* 배열 모드는 **다음 배열**을 돌려준다 — 부르는 쪽이 토글 규칙을 저마다 다시 적으면
     탭마다 다르게 동작한다 (한쪽만 "다시 누르면 꺼짐"이 되는 식으로) */
  const hit = id => {
    if (!onChange) return;
    onChange(multi ? (value.includes(id) ? value.filter(v => v !== id) : [...value, id]) : id);
  };

  /* 해당 상점가에 0건인 칩은 숨긴다 (U-ST-10). 공공시설 탭에서도 같은 규칙이 통한다 —
     그 QR 지점 주변에 없는 시설 유형을 눌러 빈 결과를 보게 하지 않는다 */
  const shown = chips.filter(c => c.count > 0);
  const showAll = multi && allChip && shown.length > 0;
  const allOn = multi && value.length === 0;
  const allCount = showAll ? shown.reduce((n, c) => n + (c.count || 0), 0) : 0;

  /* 오른쪽에 **아직 칩이 남았는가**. 페이드를 켜고 끄는 데만 쓴다 (머리말 ⑴).
     스크롤·리사이즈·칩 목록 변화에 다시 잰다 — 칩이 켜지면 개수 자리가 바뀌어 폭도 바뀐다.
     1px 여유를 두는 것은 소수점 폭에서 scrollWidth 가 늘 1 미만으로 남기 때문이다.
     빼고 재던 끝 스페이서는 없어졌다 (2026-08-25. 머리말) — 줄이 여백에서 끝나므로
     줄 안에 여백을 만들 것이 없다. */
  const strip = React.useRef(null);
  const [more, setMore] = React.useState(false);
  React.useEffect(() => {
    const node = strip.current;
    if (!node) return;
    const measure = () => {
      setMore(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
    };
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    /* ResizeObserver 는 줄 자체(보이는 폭)의 변화만 잡는다 — 안쪽 칩이 넓어져 scrollWidth 만
       달라지는 경우는 못 잡는데, 그 일이 실제로 일어나는 자리가 **웹폰트 로드**다.
       처음 잰 값은 대체 글꼴 기준이라 폰트가 앉으면 넘침 여부가 뒤집힐 수 있다. */
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(node);
    return () => { node.removeEventListener("scroll", measure); if (ro) ro.disconnect(); };
  }, [chips, value, allChip]);
  const fade = more
    ? `linear-gradient(to right, #000 calc(100% - ${FADE}px), transparent 100%)`
    : undefined;

  return (
    <div style={{
      position: floating ? "static" : (sticky ? "sticky" : "static"), top: 0, zIndex: "var(--z-filter)",
      /* floating: 지도 위에 배경 패널 없이 알약만 띄운다. 패널을 깔면 지도가 그만큼 가려진다 */
      background: floating ? "transparent" : "rgba(255,255,255,.96)",
      backdropFilter: floating ? "none" : "var(--blur-glass)",
      borderBottom: floating ? "none" : "var(--stroke-hairline) solid var(--border-default)", ...style }} {...rest}>
      {/* 칩이 위아래 5px 씩 히트 여백을 이미 갖고 있으므로 바깥 여백은 최소로 둔다.
          leading 은 칩과 함께 흐르면 안 되는 것의 자리 — 스크롤 바깥에 고정된다.
          지금 여기 서는 것은 조아용 한 마리다 (MainApp). 한때 온누리 컨트롤이 이 자리를
          썼는데, 그것은 목록 위 제어 줄로 내려갔다 (ListControls · OnnuriChip) */}
      {/* 양쪽 다 화면 여백이다 (2026-08-25. 머리말) — 첫 칩이 위 검색창과 **같은 세로선에서
          시작하고 같은 선에서 끝난다.** 잘린 칩은 그 오른쪽 선에서 끊기면서 보인다 */}
      <div style={{ display: "flex", alignItems: "center", gap: GAP,
        padding: `2px ${gutter} var(--space-1)` }}>
        {leading ? <span style={{ flex: "0 0 auto", display: "inline-flex", paddingRight: 2 }}>{leading}</span> : null}
        <div ref={strip} role={multi ? "group" : "tablist"} aria-label={label}
          style={{ flex: 1, minWidth: 0, display: "flex", gap: GAP,
            overflowX: "auto", padding: "5px 0", margin: "-5px 0", scrollbarWidth: "none",
            /* 끝을 흐려 "더 있다"고 말한다. 더 밀 수 없으면 undefined 라 아무것도 걸리지 않는다 */
            maskImage: fade, WebkitMaskImage: fade }}>
          {/* [전체] — 맨 왼쪽. 여럿 고르기에서만 선다 (하나 고르기 줄에서는 부르는 쪽이
              chips 에 직접 넣는다). 켜져 있을 때 다시 눌러도 꺼지지 않는다 — 이미 전체다 */}
          {showAll ? (
            <Chip dense selected={allOn} count={allCount} elevated={floating} aria-pressed={allOn}
              icon={icon({ id: "all", label: allLabel })}
              onClick={() => { if (!allOn && onChange) onChange([]); }}>{allLabel}</Chip>
          ) : null}
          {shown.map(c => (
            <Chip key={c.id} dense selected={isOn(c.id)} count={c.count} elevated={floating}
              role={multi ? undefined : "tab"}
              aria-selected={multi ? undefined : isOn(c.id)}
              aria-pressed={multi ? isOn(c.id) : undefined}
              icon={icon(c)} onClick={() => hit(c.id)}>{c.label}</Chip>
          ))}
          {/* 끝의 여백 스페이서가 여기 있었다 (2026-08-25 삭제) — 줄이 화면 끝까지 흐르던
              동안 다 밀었을 때의 오른쪽 여백을 만들던 자리다. 지금은 줄 자체가 여백에서
              끝난다 */}
        </div>
      </div>
      {/* 아래 pill 줄은 칩 줄과 달리 가로로 흐르지 않는다 (wrap 이다). 끝을 보일 이유가
          없으므로 화면 여백을 그대로 지킨다 — 여기서 `gutter` 를 쓴다 */}
      {active.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)",
          padding: `0 ${gutter} var(--space-2)` }}>
          <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>적용 중</span>
          {active.map(a => (
            <button key={a.key} onClick={a.onClear} aria-label={`${a.label} 필터 해제`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 26, padding: "3px 7px 3px 9px",
                background: "var(--state-info-soft)", color: "var(--yong-teal-900)", border: "none",
                borderRadius: "var(--radius-pill)", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-semibold)" }}>
              {a.label}
              <Icon name="x" size={14} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
