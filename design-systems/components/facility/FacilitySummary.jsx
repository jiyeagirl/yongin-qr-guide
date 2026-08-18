import React from "react";
import { Icon } from "../core/Icon.jsx";
import { FacilityIcon, FACILITY_LABELS, SAFETY } from "../core/FacilityIcon.jsx";
import { eun } from "../core/josa.js";

/* 공공시설 탭 시트 헤더 (U-FC-02 / U-FC-04). 상점가 쪽 DistrictSummary 와 짝을 이룬다.
   시트를 접어도(25% 스냅) 이 줄까지는 보이므로, 접힌 상태에서 답해야 할 두 가지만 담는다.

     1) 이 목록이 무엇을 기준으로 줄 세워졌는가  → QR 지점 기준 직선거리, 가까운 순
     2) 안전시설이 몇 곳 있는가                 → AED · 대피소 · 쉼터(무더위쉼터)

   유형별 개수는 지도 위 칩 줄에도 있지만 거기엔 5종이 나란히 있어 안전시설이 묻힌다.
   U-FC-04 의 "안전시설 우선 노출"은 목록 순서만이 아니라 이 헤더에서도 지켜야 한다.
   반대로 화장실 개수는 여기서 반복하지 않는다 — 칩에 이미 있고, 급한 정보가 아니다.
   센다는 대상은 목록 섹션과 반드시 같아야 한다(SAFETY). 헤더와 섹션이 다른 것을 세면
   "안전시설 8곳"이라 적혀 있는데 그 아래 섹션에는 11줄이 있는 상태가 된다.

   ── 원거리 안내는 배너가 아니라 이 줄의 말풍선이다 (U-FC-09, 2026-08-18 변경) ──
   전에는 목록 맨 위에 경고 배너 한 장이 통째로 들어갔다. 그런데 그 배너가 말하는 것은
   "대피소가 멀다" 한 가지인데, 자리는 목록 두 줄만큼을 먹었다.

   대신 **개수 옆 아이콘에 작은 주의 배지**를 얹고, 문장은 말풍선으로 붙인다.
   경고가 세어지는 대상(대피소)과 경고 표시가 같은 자리에 있게 되므로, 무엇이 먼지
   문장을 읽기 전에 알 수 있다. 유형이 여럿 걸려도 줄 수가 늘어나지 않는다.

   말풍선은 경고가 **새로 생겼을 때 저절로 열린다.** 배지만 두고 눌러야 열리게 하면,
   가장 알아야 할 사람(급히 대피소를 찾는 사람)이 그 배지를 못 보고 지나간다.
   한 번 닫으면 다시 열리지 않는다 — 같은 경고를 계속 들이밀지 않는다.

   ── 말풍선은 항목이 아니라 **줄 전체**에 붙는다 (2026-08-18 수정) ──
   처음에는 경고가 걸린 항목의 왼쪽 끝에 붙이고 오른쪽으로 펼쳤다. 그런데 SAFETY 순서가
   AED · 대피소 · 쉼터라 대피소는 줄의 가운데쯤에서 시작한다 — 거기서 280px 을 펼치면
   화면 오른쪽으로 잘려 나갔다. 항목마다 어디서 시작하는지가 다르므로, 시작점을 항목에
   맞추는 한 어느 유형에서든 잘릴 수 있다.

   그래서 말풍선을 **줄 컨테이너에 좌우로 붙여**(left:0 right:0) 폭을 화면 안에 묶고,
   대신 **꼬리만 경고가 걸린 항목의 아이콘 아래로 옮긴다.** 어느 유형에 붙은 경고인지는
   꼬리가 가리키고, 폭은 컨테이너가 책임진다. 잘릴 수 있는 자유도를 없앤 것이다. */
export function FacilitySummary({ counts = {}, warnings = [], basis = "QR 스캔 지점 기준 직선거리 · 가까운 순", style, ...rest }) {
  const warnOf = t => warnings.find(w => w.type === t);
  /* 경고가 걸린 유형은 개수가 0 이어도 반드시 보여준다 — 경고를 걸어놓고 그 대상을
     줄에서 빼면 어디에 붙은 경고인지 알 수 없게 된다 */
  const safety = SAFETY.filter(t => counts[t] > 0 || warnOf(t));

  /* 경고 묶음이 바뀔 때만 다시 연다. 유형 칩을 바꾸면 경고 대상도 바뀌므로 그때는 새 경고다 */
  const key = warnings.map(w => `${w.type}:${w.text}`).join("|");
  /* 첫 값은 effect 가 아니라 초기화에서 정한다. effect 로만 열면 첫 프레임은 닫힌 상태로
     그려졌다가 곧바로 열려, 급히 보는 사람 눈에 한 번 깜빡이는 것으로 남는다. */
  const [open, setOpen] = React.useState(() => (warnings.length ? warnings[0].type : null));
  React.useEffect(() => { setOpen(warnings.length ? warnings[0].type : null); }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* 문장은 여기 한 곳에서만 만든다 — 화면과 스크린리더가 다른 말을 하면 안 된다.
     조사는 유형 이름의 받침을 따른다 ("대피소는" / "화장실은") */
  const textOf = t => {
    const w = warnOf(t);
    if (!w) return null;
    const label = FACILITY_LABELS[t];
    return `가까운 곳에 ${label}가 없습니다. 가장 가까운 ${eun(label)} ${w.text} 떨어져 있습니다.`;
  };

  /* 꼬리 위치 — 열린 항목의 아이콘 중심을 줄 컨테이너 기준으로 잰다.
     상수로 둘 수 없다. 앞에 오는 항목의 폭이 개수 자릿수와 글자 크기(2차 확대)에 따라
     달라지므로, 재지 않으면 꼬리가 엉뚱한 유형을 가리킨다. */
  const rowRef = React.useRef(null);
  const btns = React.useRef({});
  const [tailX, setTailX] = React.useState(null);

  /* 브라우저에서는 그리기 전에 재야 꼬리가 한 번 튀지 않는다. 서버 렌더(검수 스크립트)에는
     useLayoutEffect 가 없다시피 하므로 경고를 피해 useEffect 로 떨어뜨린다. */
  const useMeasure = typeof document === "undefined" ? React.useEffect : React.useLayoutEffect;
  useMeasure(() => {
    const place = () => {
      const row = rowRef.current, btn = open && btns.current[open];
      if (!row || !btn) { setTailX(null); return; }
      const r = row.getBoundingClientRect(), b = btn.getBoundingClientRect();
      const ICON_MID = 9;                                  /* FacilityIcon size 18 의 절반 */
      const TAIL_HALF = 4;                                 /* 꼬리 정사각형 8px 의 절반 */
      const x = b.left - r.left + ICON_MID - TAIL_HALF;
      /* 말풍선 모서리(radius-sm)를 넘어가면 꼬리가 테두리 밖으로 떨어져 나온다 */
      setTailX(Math.max(10, Math.min(x, r.width - 18)));
    };
    place();
    /* 글자 크기 변경·회전·시트 스냅으로 줄 폭이 바뀌면 다시 잰다 */
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, key, safety.length]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", ...style }} {...rest}>
      <p style={{ display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
        <Icon name="map-pin" size={15} color="var(--text-muted)" />
        {basis}
      </p>
      {safety.length ? (
        /* position:relative — 말풍선이 이 줄에 좌우로 매달린다 (머리말 참조) */
        <div ref={rowRef} style={{ position: "relative", display: "flex", alignItems: "center",
          flexWrap: "wrap", gap: "var(--space-2) var(--space-4)" }}>
          {safety.map(t => {
            const warn = warnOf(t);
            const label = FACILITY_LABELS[t];
            const text = textOf(t);

            const body = (
              <>
                <span style={{ position: "relative", display: "inline-flex", flex: "0 0 auto" }}>
                  <FacilityIcon type={t} size={18} />
                  {warn ? (
                    /* 주의 배지 — 아이콘 오른쪽 위 모서리. 흰 테두리로 아이콘 획과 떼어놓는다 */
                    <span aria-hidden="true" style={{ position: "absolute", right: -6, top: -6,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 14, height: 14, borderRadius: 999,
                      background: "var(--yong-amber-500)", color: "var(--yong-ink-900)",
                      border: "var(--stroke-hairline) solid var(--surface-card)" }}>
                      <Icon name="triangle-alert" size={9} strokeWidth={2.6} />
                    </span>
                  ) : null}
                </span>
                {label}
                <b style={{ color: "var(--text-heading)", fontWeight: "var(--fw-bold)" }}>{counts[t] || 0}</b>곳
              </>
            );

            const itemStyle = { display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "var(--text-body)" };

            if (!warn) return <span key={t} style={itemStyle}>{body}</span>;

            const on = open === t;
            return (
              <button key={t} type="button" ref={el => { btns.current[t] = el; }}
                onClick={() => setOpen(on ? null : t)}
                aria-expanded={on} aria-label={text}
                style={{ ...itemStyle, background: "none", border: "none", padding: 0, cursor: "pointer",
                  textAlign: "left" }}>
                {body}
              </button>
            );
          })}

          {/* 말풍선 — 줄 컨테이너에 좌우로 붙는다. 폭이 컨테이너와 같으므로 어느 유형에 걸려도
              화면 밖으로 나갈 수 없다 (머리말 참조). 꼬리만 해당 아이콘 아래로 옮긴다.
              시트 헤더는 스크롤 영역 밖이라 목록 위로 겹쳐도 목록과 함께 밀려 올라가지 않는다.
              줄 수는 내용에 맡긴다 (U-CM-14 고정 높이 금지) */}
          {open && textOf(open) ? (
            <span role="status" style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 8px)",
              zIndex: 2, display: "flex", alignItems: "flex-start", gap: "var(--space-2)",
              padding: "9px 10px", background: "var(--state-warning-soft)",
              border: "var(--stroke-hairline) solid var(--yong-amber-500)",
              borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-raised)" }}>
              {/* 꼬리 — 45도 돌린 정사각형에 위·왼쪽 테두리만 남겨 말풍선 테두리와 잇는다
                  (KakaoMap 의 앵커 말풍선과 같은 방식이다). left 는 위에서 실측한 값이다 —
                  아직 못 쟀으면(첫 프레임·SSR) 왼쪽 기본 자리에 둔다. */}
              <span aria-hidden="true" style={{ position: "absolute", left: tailX == null ? 12 : tailX, top: -5,
                width: 8, height: 8, background: "var(--state-warning-soft)",
                borderTop: "var(--stroke-hairline) solid var(--yong-amber-500)",
                borderLeft: "var(--stroke-hairline) solid var(--yong-amber-500)",
                transform: "rotate(45deg)" }} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)",
                color: "var(--text-body)", lineHeight: 1.5, wordBreak: "keep-all" }}>{textOf(open)}</span>
              <button type="button" onClick={() => setOpen(null)} aria-label="안내 닫기"
                style={{ flex: "0 0 auto", display: "inline-flex", background: "none", border: "none",
                  padding: 2, margin: -2, cursor: "pointer", color: "var(--text-muted)" }}>
                <Icon name="x" size={14} />
              </button>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
