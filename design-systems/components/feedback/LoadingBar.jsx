import React from "react";

/* 진행 중임을 알리는 가로 막대. S01 QR 진입 로딩이 첫 사용처다.
 *
 * 두 가지 모드를 한 컴포넌트로 둔다.
 *   value 없음   불확정 — 막대가 좌우로 흐른다 (얼마나 남았는지 모를 때)
 *   value 0~1    확정   — 그만큼 찬다 (단계가 정해져 있을 때)
 *
 * S01 은 단계가 셋으로 정해져 있어 확정 모드를 쓴다. 불확정 막대는 "언제 끝날지 모른다"는
 * 뜻이라, 끝을 아는 화면에 쓰면 실제보다 오래 걸리는 것처럼 느껴진다.
 *
 * prefers-reduced-motion 에서는 흐름과 전환을 모두 끈다 — 진행률은 여전히 폭으로 읽힌다.
 */
export function LoadingBar({ value, label = "불러오는 중", style, ...rest }) {
  const determinate = typeof value === "number";
  const pct = determinate ? Math.max(0, Math.min(1, value)) * 100 : 0;

  return (
    <div role="progressbar" aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? Math.round(pct) : undefined}
      style={{ position: "relative", overflow: "hidden", width: "100%", height: 6,
        borderRadius: 999, background: "var(--surface-sunken)", ...style }} {...rest}>
      <span style={determinate
        ? { display: "block", width: `${pct}%`, height: "100%", borderRadius: 999,
            background: "var(--brand-primary)", transition: "width var(--dur-slow) var(--ease-out)" }
        : { position: "absolute", top: 0, left: 0, width: "40%", height: "100%", borderRadius: 999,
            background: "var(--brand-primary)", animation: "yong-loadbar 1.4s var(--ease-standard) infinite" }} />
    </div>
  );
}

export default LoadingBar;
