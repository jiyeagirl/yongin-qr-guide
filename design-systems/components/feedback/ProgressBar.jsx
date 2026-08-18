import React from "react";

/* 값/최대값 진행 막대. S08 골목 한바퀴의 "2/4 방문"이 처음 쓴다.
 *
 * ── LoadingBar 와 다른 것 ──────────────────────────────────────────────
 * LoadingBar 는 "무언가 오고 있다"는 신호라 끝을 모르고 계속 움직인다. 이것은 반대로
 * **끝을 아는 값**을 그린다 — 몇 개 중 몇 개인가.
 *
 * ── ProgressSteps 와 다른 것 ───────────────────────────────────────────
 * ProgressSteps 는 앞 단계를 마쳐야 다음으로 가는 순차 절차용이다(현재 단계가 하나뿐이다).
 * 여기서 다루는 것은 순서를 강제하지 않는 진행이라 "지금 몇 번째"가 없고 개수만 있다.
 *
 * ── 막대만으로는 말하지 않는다 ─────────────────────────────────────────
 * 이 컴포넌트는 라벨을 갖지 않는다. 진행 상태를 색 길이로만 전하면 저시력·색각 이상
 * 사용자에게 아무 것도 전하지 못하므로, 쓰는 쪽이 "2/4 방문" 같은 글자를 반드시 함께
 * 둔다. 그 글자를 `label` 로 넘겨 받아 보조기기에 읽힌다 (화면에는 그리지 않는다 —
 * 같은 문장이 두 번 나오면 스크린리더가 두 번 읽는다).
 */
export function ProgressBar({ value = 0, max = 1, label, tone = "brand", style, ...rest }) {
  const total = Math.max(1, max);
  const done = Math.min(Math.max(0, value), total);
  const pct = (done / total) * 100;
  const fill = tone === "success" ? "var(--state-success)" : "var(--brand-primary)";

  return (
    <div role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}
      aria-label={label}
      style={{ width: "100%", height: 6, borderRadius: 999, background: "var(--surface-sunken)",
        overflow: "hidden", ...style }} {...rest}>
      {/* 0 일 때도 막대 자리는 남는다 — 채움만 사라지고 트랙이 보인다.
          진행에 애니메이션을 주는 것은 값이 사람의 동작(버튼)으로 바뀌기 때문이다.
          움직임을 줄이도록 설정한 사용자에게는 즉시 바뀐다. */}
      <div style={{ width: `${pct}%`, height: "100%", background: fill, borderRadius: 999,
        transition: "width var(--dur-base) var(--ease-out)" }} />
    </div>
  );
}

export default ProgressBar;
