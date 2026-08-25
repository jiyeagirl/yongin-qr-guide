import React from "react";
import { Mascot } from "../brand/Mascot.jsx";

/* ── 줄바꿈은 낱말에서 (2026-08-25, 사용자 요청) ──────────────────────────────
 * 이 컴포넌트만 `word-break` 를 정하지 않고 있었다. 브라우저의 기본값은 한글을 **글자
 * 사이 아무 데서나** 끊으므로, 280px 짜리 가운데 정렬 문단에서 이런 줄이 나온다:
 *
 *     모현골목형상점가의 상세 안내 페이
 *     지는 아직 준비 중입니다. 준비되는
 *
 * 「페이 / 지는」은 읽는 사람이 한 번 되짚어야 하는 줄이다. 안내 화면은 대개 짧은 문장
 * 두엇이라 그런 줄이 한 화면에서 차지하는 비중이 크다.
 *
 * `keep-all` 은 **띄어쓰기에서만** 끊는다. 짝으로 두는 `overflowWrap: anywhere` 는
 * 한 낱말이 통째로 280px 을 넘을 때의 보험이다 — 그때는 끊어야 넘치지 않는다.
 * 둘을 같이 두는 것은 `CopyField` 와 같은 방식이다.
 *
 * 제목에도 건다. 「등록되지 않은 QR 코드입니다」처럼 긴 제목이 실제로 있고, 제목이
 * 잘못 끊기면 본문보다 먼저 눈에 띈다. */
const WRAP = { wordBreak: "keep-all", overflowWrap: "anywhere" };

export function EmptyState({ title, description, action, pose = "curious", base = "", style, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "var(--space-2)", padding: "var(--space-8) var(--space-5)", ...style }} {...rest}>
      <Mascot pose={pose} size={110} base={base} />
      <h3 style={{ font: "var(--type-title-3)", marginTop: "var(--space-2)", ...WRAP }}>{title}</h3>
      {description ? <p style={{ font: "var(--type-body)", color: "var(--text-muted)", maxWidth: 280, ...WRAP }}>{description}</p> : null}
      {action ? <div style={{ marginTop: "var(--space-3)" }}>{action}</div> : null}
    </div>
  );
}
