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

/* ── 제목은 두 줄의 길이를 맞춰 접는다 (2026-09-02, 사용자 요청) ────────────────
 * `keep-all` 은 **어디서 끊지 않을지**만 정하고 어디서 끊을지는 정하지 않는다. 그래서
 * 브라우저 기본값(탐욕적 줄바꿈)이 한 줄을 끝까지 채우고 남는 것을 다음 줄로 넘기는데,
 * 가운데 정렬된 제목에서 그 결과는 대개 **긴 줄 하나와 토막 하나**다:
 *
 *     둔전 골목상권 활성화 한마당 축제가        ← 17자
 *     열리고 있어요!                            ← 7자
 *
 * 두 줄이 이만큼 차이 나면 아래 줄이 제목의 일부가 아니라 **흘러넘친 꼬리**로 보이고,
 * 가운데 정렬이라 그 어긋남이 좌우 양쪽에서 다 보인다. `balance` 는 줄 수를 늘리지 않는
 * 선에서 **가장 긴 줄을 가장 짧게** 만드는 지점을 찾아 준다:
 *
 *     둔전 골목상권 활성화 한마당               ← 13자
 *     축제가 열리고 있어요!                     ← 11자
 *
 * 손으로 `<br>` 을 넣어 맞출 수 있는 자리가 아니다 — 제목에 들어오는 이름이 자료에서
 * 오고(축제명 · 시설명), 2차 글자 확대에서 줄 수 자체가 달라진다. **끊을 자리를 미리
 * 적는 대신 고르게 나누라고 시키는 것**이 이 시스템의 「고정 높이 금지」와 같은 결이다.
 *
 * 모르는 브라우저에서는 이 한 줄이 통째로 무시되고 지금까지의 줄바꿈이 그대로 남는다 —
 * 잃는 것이 없어서 예외 처리를 두지 않는다. **본문에는 걸지 않는다**: `balance` 는 서너
 * 줄짜리 제목을 위한 것이고, 문단에 걸면 줄 수가 많은 곳에서 브라우저가 스스로 포기한다. */
const TITLE_WRAP = { ...WRAP, textWrap: "balance" };

export function EmptyState({ title, description, action, pose = "curious", base = "", style, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "var(--space-2)", padding: "var(--space-8) var(--space-5)", ...style }} {...rest}>
      <Mascot pose={pose} size={110} base={base} />
      <h3 style={{ font: "var(--type-title-3)", marginTop: "var(--space-2)", ...TITLE_WRAP }}>{title}</h3>
      {description ? <p style={{ font: "var(--type-body)", color: "var(--text-muted)", maxWidth: 280, ...WRAP }}>{description}</p> : null}
      {action ? <div style={{ marginTop: "var(--space-3)" }}>{action}</div> : null}
    </div>
  );
}
