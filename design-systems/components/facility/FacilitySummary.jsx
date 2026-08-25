import React from "react";
import { Icon } from "../core/Icon.jsx";
import { FacilityIcon, FACILITY_LABELS, SAFETY } from "../core/FacilityIcon.jsx";
import { eun, i } from "../core/josa.js";

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

   ── 여럿이 걸리면 문장을 합친다 (2026-08-24) ────────────────────────────────
   배지는 유형마다 서지만 **말풍선은 하나**이고, 그 안의 문장이 걸린 유형을 전부 적는다
   (아래 noticeText). 배지를 세 번 눌러 같은 뼈대의 문장을 세 번 읽게 하지 않는다.
   어느 배지를 눌러도 같은 말풍선이 열리고, 갈리는 것은 꼬리가 가리키는 자리뿐이다.

   말풍선은 경고가 **새로 생겼을 때 저절로 열린다.** 배지만 두고 눌러야 열리게 하면,
   가장 알아야 할 사람(급히 대피소를 찾는 사람)이 그 배지를 못 보고 지나간다.
   한 번 닫으면 다시 열리지 않는다 — 같은 경고를 계속 들이밀지 않는다.

   ── "닫았다"를 이 컴포넌트가 기억할 수 없다 (2026-08-18) ────────────────────
   이 줄은 공공시설 탭일 때만 그려진다. 둘러보기 탭을 눌렀다가 돌아오면 **언마운트되었다가
   다시 마운트**되므로, 닫은 기억이 지역 상태에 있으면 그때마다 말풍선이 다시 열린다.
   같은 사람이 같은 경고를 탭을 오갈 때마다 다시 닫아야 했다.

   그래서 닫힘을 **밖에서 들고 있게** 한다 (`dismissed` / `onDismissedChange`). 값은 경고
   묶음을 나타내는 문자열이고, 그것이 지금 경고와 같으면 열지 않는다. 경고가 달라지면
   (유형 칩을 바꾸는 등) 키도 달라져 다시 열린다 — 새 경고는 새로 알려야 한다.

   두 prop 을 주지 않으면 예전처럼 자기 상태로만 동작한다. 디자인 시스템 컴포넌트가
   쓰는 쪽에 상태 관리를 강요하지 않기 위해서다.

   ── 말풍선은 항목이 아니라 **줄 전체**에 붙는다 (2026-08-18 수정) ──
   처음에는 경고가 걸린 항목의 왼쪽 끝에 붙이고 오른쪽으로 펼쳤다. 그런데 SAFETY 순서가
   AED · 대피소 · 쉼터라 대피소는 줄의 가운데쯤에서 시작한다 — 거기서 280px 을 펼치면
   화면 오른쪽으로 잘려 나갔다. 항목마다 어디서 시작하는지가 다르므로, 시작점을 항목에
   맞추는 한 어느 유형에서든 잘릴 수 있다.

   그래서 말풍선을 **줄 컨테이너에 좌우로 붙여**(left:0 right:0) 폭을 화면 안에 묶고,
   대신 **꼬리만 경고가 걸린 항목의 아이콘 아래로 옮긴다.** 어느 유형에 붙은 경고인지는
   꼬리가 가리키고, 폭은 컨테이너가 책임진다. 잘릴 수 있는 자유도를 없앤 것이다. */
export function FacilitySummary({ counts = {}, warnings = [], basis = "QR 스캔 지점 기준 직선거리 · 가까운 순",
  dismissed = null, onDismissedChange, style, ...rest }) {
  const warnOf = t => warnings.find(w => w.type === t);
  /* 경고가 걸린 유형은 개수가 0 이어도 반드시 보여준다 — 경고를 걸어놓고 그 대상을
     줄에서 빼면 어디에 붙은 경고인지 알 수 없게 된다 */
  const safety = SAFETY.filter(t => counts[t] > 0 || warnOf(t));

  /* 경고 묶음이 바뀔 때만 다시 연다. 유형 칩을 바꾸면 경고 대상도 바뀌므로 그때는 새 경고다 */
  const key = warnings.map(w => `${w.type}:${w.text}`).join("|");
  /* 이미 닫은 경고면 열지 않는다 (머리말 참조). 마운트될 때마다 이 판단을 다시 하므로
     탭을 오가도 결과가 같다. */
  const first = () => (warnings.length && dismissed !== key ? warnings[0].type : null);
  /* 첫 값은 effect 가 아니라 초기화에서 정한다. effect 로만 열면 첫 프레임은 닫힌 상태로
     그려졌다가 곧바로 열려, 급히 보는 사람 눈에 한 번 깜빡이는 것으로 남는다. */
  const [open, setOpen] = React.useState(first);
  /* deps 에 dismissed 를 넣지 않는다 — 닫는 순간 dismissed 가 바뀌는데 그때 이 effect 가
     돌면 방금 닫은 것을 두고 "새 경고인가"를 다시 따지게 된다. 다시 열 이유는 경고가
     바뀌었을 때(key) 하나뿐이다. */
  React.useEffect(() => { setOpen(first()); }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* 닫힘은 밖으로 올려보낸다. 이 컴포넌트는 탭이 바뀌면 언마운트되므로 스스로 기억할 수 없다 */
  const close = () => { setOpen(null); if (onDismissedChange) onDismissedChange(key); };
  /* 배지를 눌러 다시 열면 닫은 기록도 지운다 — 열어둔 채 탭을 옮겼다 돌아왔는데
     닫혀 있으면, 방금 연 사람 입장에서는 화면이 제 말을 듣지 않은 것이 된다 */
  const reopen = t => { setOpen(t); if (onDismissedChange) onDismissedChange(null); };

  /* ── 여럿이 걸려도 문장은 하나다 (2026-08-24, 사용자 요청) ──────────────────
     전에는 유형마다 문장을 따로 만들고 말풍선도 따로 열었다. 셋이 걸리면 이런 꼴이 됐다:

       가까운 곳에 AED가 없습니다. 가장 가까운 AED는 1.2km 떨어져 있습니다.
       가까운 곳에 대피소가 없습니다. 가장 가까운 대피소는 1.4km 떨어져 있습니다.
       가까운 곳에 쉼터가 없습니다. 가장 가까운 쉼터는 1.8km 떨어져 있습니다.

     같은 뼈대가 세 번 되풀이되고, 그것을 다 읽으려면 배지를 세 번 눌러야 했다 —
     한 번에 하나만 열리기 때문이다. **급히 대피소를 찾는 사람에게 세 번 누르게 하는
     안내는 안내가 아니다.** 여기서 알아야 하는 것은 「무엇무엇이 멀고, 각각 얼마나 머냐」
     하나이고, 그것은 한 문장에 담긴다:

       가까운 곳에 AED, 대피소, 쉼터가 없습니다.
       가장 가까운 AED는 1.2km, 대피소는 1.4km, 쉼터는 1.8km 떨어져 있습니다.

     하나만 걸리면 예전 문장 그대로다 — 나열이 한 칸이면 쉼표가 나오지 않는다.

     문장은 여기 한 곳에서만 만든다 — 화면과 스크린리더가 다른 말을 하면 안 된다.
     조사는 이름의 받침을 따른다: 앞 문장은 **나열의 마지막 이름**이 정하고
     (「…쉼터가」 · 「…화장실이」), 뒤 문장은 이름마다 따로 붙는다 (「AED는」 · 「대피소는」).
     차례는 warnings 가 들고 온 차례 그대로다 — 부르는 쪽이 SAFETY 순(AED · 대피소 · 쉼터)으로
     만들고, 그 순서가 아래 아이콘 줄의 순서이기도 하다. 문장과 줄이 어긋나면 안 된다. */
  const noticeText = React.useMemo(() => {
    if (!warnings.length) return null;
    const named = warnings.map(w => ({ label: FACILITY_LABELS[w.type] || w.type, text: w.text }));
    const names = named.map(x => x.label).join(", ");
    const each = named.map(x => `${eun(x.label)} ${x.text}`).join(", ");
    return `가까운 곳에 ${i(names)} 없습니다. 가장 가까운 ${each} 떨어져 있습니다.`;
  }, [warnings]);

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

            /* 어느 배지를 눌러도 **같은 말풍선**이 열린다 (문장이 하나이므로). 배지가
               갈라 놓는 것은 내용이 아니라 **꼬리가 가리키는 자리**다 — 누른 유형 밑에
               꼬리가 서서, 여러 유형이 걸린 줄에서 지금 무엇을 눌렀는지가 남는다.
               읽어주는 도구에는 배지마다 전체 문장을 들려준다: 열지 않고도 답을 얻어야
               하는 사람에게 「AED 안내 보기」는 안내가 아니라 안내로 가는 길이다 */
            const on = open === t;
            return (
              <button key={t} type="button" ref={el => { btns.current[t] = el; }}
                onClick={() => (on ? close() : reopen(t))}
                aria-expanded={on} aria-label={noticeText}
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
          {open && noticeText ? (
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
                color: "var(--text-body)", lineHeight: 1.5, wordBreak: "keep-all" }}>{noticeText}</span>
              <button type="button" onClick={close} aria-label="안내 닫기"
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
