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
   한 번 닫으면 다시 열리지 않는다 — 같은 경고를 계속 들이밀지 않는다. */
export function FacilitySummary({ counts = {}, warnings = [], basis = "QR 스캔 지점 기준 직선거리 · 가까운 순", style, ...rest }) {
  const warnOf = t => warnings.find(w => w.type === t);
  /* 경고가 걸린 유형은 개수가 0 이어도 반드시 보여준다 — 경고를 걸어놓고 그 대상을
     줄에서 빼면 어디에 붙은 경고인지 알 수 없게 된다 */
  const safety = SAFETY.filter(t => counts[t] > 0 || warnOf(t));

  /* 경고 묶음이 바뀔 때만 다시 연다. 유형 칩을 바꾸면 경고 대상도 바뀌므로 그때는 새 경고다 */
  const key = warnings.map(w => `${w.type}:${w.text}`).join("|");
  const [open, setOpen] = React.useState(null);
  React.useEffect(() => { setOpen(warnings.length ? warnings[0].type : null); }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", ...style }} {...rest}>
      <p style={{ display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
        <Icon name="map-pin" size={15} color="var(--text-muted)" />
        {basis}
      </p>
      {safety.length ? (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2) var(--space-4)" }}>
          {safety.map(t => {
            const warn = warnOf(t);
            const label = FACILITY_LABELS[t];
            /* 문장은 여기 한 곳에서만 만든다 — 화면과 스크린리더가 다른 말을 하면 안 된다.
               조사는 유형 이름의 받침을 따른다 ("대피소는" / "화장실은") */
            const text = warn
              ? `가까운 곳에 ${label}가 없습니다. 가장 가까운 ${eun(label)} ${warn.text} 떨어져 있습니다.`
              : null;

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
              <span key={t} style={{ position: "relative", display: "inline-flex" }}>
                <button type="button" onClick={() => setOpen(on ? null : t)}
                  aria-expanded={on} aria-label={text}
                  style={{ ...itemStyle, background: "none", border: "none", padding: 0, cursor: "pointer",
                    textAlign: "left" }}>
                  {body}
                </button>

                {/* 말풍선 — 아이콘 아래로 뜬다. 시트 헤더는 스크롤 영역 밖이라 목록 위로 겹쳐도
                    목록과 함께 밀려 올라가지 않는다. 닫기는 배지를 다시 누르거나 X 로 한다.
                    폭은 화면을 넘지 않게 묶고, 줄 수는 내용에 맡긴다 (U-CM-14 고정 높이 금지) */}
                {on ? (
                  <span role="status" style={{ position: "absolute", left: -4, top: "calc(100% + 8px)",
                    zIndex: 2, width: "max-content", maxWidth: "min(280px, 78vw)",
                    display: "flex", alignItems: "flex-start", gap: "var(--space-2)",
                    padding: "9px 10px", background: "var(--state-warning-soft)",
                    border: "var(--stroke-hairline) solid var(--yong-amber-500)",
                    borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-raised)" }}>
                    {/* 꼬리 — 45도 돌린 정사각형에 위·왼쪽 테두리만 남겨 말풍선 테두리와 잇는다
                        (KakaoMap 의 앵커 말풍선과 같은 방식이다) */}
                    <span aria-hidden="true" style={{ position: "absolute", left: 12, top: -5,
                      width: 8, height: 8, background: "var(--state-warning-soft)",
                      borderTop: "var(--stroke-hairline) solid var(--yong-amber-500)",
                      borderLeft: "var(--stroke-hairline) solid var(--yong-amber-500)",
                      transform: "rotate(45deg)" }} />
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)",
                      color: "var(--text-body)", lineHeight: 1.5, wordBreak: "keep-all" }}>{text}</span>
                    <button type="button" onClick={() => setOpen(null)} aria-label="안내 닫기"
                      style={{ flex: "0 0 auto", display: "inline-flex", background: "none", border: "none",
                        padding: 2, margin: -2, cursor: "pointer", color: "var(--text-muted)" }}>
                      <Icon name="x" size={14} />
                    </button>
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
