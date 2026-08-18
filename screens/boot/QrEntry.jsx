import React from "react";
import { Mascot, LoadingBar, Icon } from "../../design-systems/index.js";
import { lookup } from "../main/data/qr.js";

/* S01 QR 진입 및 로딩 (U-CM-01).
 *
 * QR 을 찍고 브라우저가 열린 직후의 화면이다. 하는 일은 하나 — **지점 컨텍스트를 구성하고
 * 공공시설 탭으로 넘긴다.** 그동안 사용자에게 "무엇을 하고 있는지"를 보인다.
 *
 * ── 왜 로딩 화면을 따로 두는가 ────────────────────────────────────────────
 * 이 서비스는 앱이 아니라 QR 로 열리는 웹이라, 사용자는 방금 찍은 안내판 앞에 서 있고
 * 화면이 뜨기까지의 몇 백 ms 를 "이게 맞게 열린 건가"로 보낸다. 흰 화면을 보여주면
 * 다시 찍는다. 그래서 이 화면의 주 임무는 진행률이 아니라 **여기가 어디인지 확인해 주는 것**이다.
 * 그래서 단계 문구가 지점명을 확보하는 즉시 그 이름을 띄운다.
 *
 * ── 단계를 셋으로 끊는 이유 ───────────────────────────────────────────────
 * 불확정 막대(끝을 모르는 흐름)는 "언제 끝날지 모른다"는 뜻이다. 여기서는 할 일이
 * 조회 → 확인 → 진입 셋으로 정해져 있으므로 확정 막대를 쓴다.
 *
 * 조회에 실패하면(미등록·비활성 코드) 이 화면은 아무 판단도 하지 않고 결과를 그대로
 * 위로 올린다. 무엇을 보여줄지는 S11(EntryFallback)이 정한다 — 갈래가 늘어날 때
 * 로딩 화면을 고치게 되면 안 된다.
 */

const STEPS = [
  { at: 0.22, text: "QR 지점을 확인하고 있습니다" },
  { at: 0.68, text: "주변 공공시설을 불러오는 중" },
  { at: 1,    text: "잠시만 기다려 주세요" },
];

export function QrEntry({ code, onResolved, base = "../../design-systems/" }) {
  const [step, setStep] = React.useState(0);
  const [place, setPlace] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    /* 조회와 화면 단계를 따로 돌린다. 조회가 아무리 빨라도 1단계가 눈에 보여야
       "확인 중"이라는 안내가 의미를 갖는다 — 깜빡이고 사라지는 안내는 없는 것과 같다. */
    const t1 = setTimeout(() => alive && setStep(1), 220);
    lookup(code).then(result => {
      if (!alive) return;
      if (result.point) setPlace(result.point);
      setStep(2);
      /* 마지막 단계를 한 박자 보여준 뒤 넘긴다. 확보한 지점명을 사용자가 읽을 시간이다 */
      setTimeout(() => alive && onResolved(result), result.status === "ok" ? 420 : 220);
    });
    return () => { alive = false; clearTimeout(t1); };
  }, [code, onResolved]);

  const s = STEPS[step];

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-brand-soft)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "var(--space-4)", padding: "var(--space-8) var(--gutter-screen)", textAlign: "center" }}>

      <Mascot pose="hello" size={132} bob base={base} alt="" />

      <div>
        <h1 style={{ fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-bold)",
          color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>
          용인시 위치안내
        </h1>
        <p style={{ marginTop: "var(--space-1)", fontSize: "var(--fs-label)", color: "var(--brand-primary-strong)" }}>
          공공시설 · 골목형 상점가
        </p>
      </div>

      {/* 지점명이 확보되면 그 자리에 나타난다. 자리를 미리 비워두지 않는다 —
          빈 칸이 있다가 글자가 차는 것보다, 없다가 생기는 편이 "찾았다"로 읽힌다 */}
      {place ? (
        <p style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-4)", background: "var(--surface-card)",
          border: "var(--stroke-hairline) solid var(--yong-green-100)",
          borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-card)",
          fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)",
          animation: "yong-pop var(--dur-base) var(--ease-out)" }}>
          <Icon name="qr-code" size={17} color="var(--brand-primary)" />
          {place.name}
        </p>
      ) : null}

      <div style={{ width: "100%", maxWidth: 280, marginTop: "var(--space-2)" }}>
        <LoadingBar value={s.at} label="QR 지점 확인" />
        {/* 단계 문구는 스크린리더에도 흘려보낸다. 시각적으로만 바뀌면
            읽어주는 사용자에게는 아무 일도 일어나지 않는 화면이 된다 */}
        <p aria-live="polite" style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
          color: "var(--text-muted)", lineHeight: 1.5 }}>
          {s.text}
        </p>
      </div>
    </div>
  );
}

export default QrEntry;
