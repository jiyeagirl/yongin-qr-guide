import React from "react";
import { Icon } from "../core/Icon.jsx";

/* QR 앵커 지점을 항상 보여주는 얇은 띠 (U-CM-04).
 *
 *   [조아용]  QR 스캔 지점 기준 · **둔전 시장 입구 버스정류장**
 *
 * ── "현재 위치"라고 쓰지 않는다 ─────────────────────────────────────────────
 * 이 서비스는 실시간 GPS 를 쓰지 않는다. 사용자가 걸어서 이동해도 기준점은 스캔 지점
 * 그대로다. "현재 위치"라고 쓰면 거짓말이 되므로 기준점의 정체를 그대로 밝힌다.
 * 화면의 모든 거리 표기가 이 한 점에 매달려 있어, 이름이 보이지 않으면 "320m"가 어디서
 * 잰 값인지 알 수 없다.
 *
 * ── 왜 한 줄인가 (2026-08-18 개정) ─────────────────────────────────────────
 * 앞서 두 가지 형태를 거쳤다. 처음에는 지점명·캐릭터·버튼을 얹은 60px 짜리 바였고,
 * 다음에는 앱바가 지점명을 맡고 여기는 전제 문장만 남긴 얇은 띠였다. 둘을 합치면
 * 상단이 80px 을 넘게 먹는데, 그 아래가 지도라 화면에서 가장 비싼 자리다.
 *
 * 그래서 **앱바를 없애고 이 한 줄이 기준점을 직접 말한다.** 지도가 화면 맨 위까지
 * 올라오고, U-CM-04 가 요구하는 상시 노출은 그대로 지켜진다.
 * "QR 스캔 지점 기준"이라는 앞머리가 이전의 전제 문장("이동해도 갱신되지 않는다")을
 * 대신한다 — 기준점이 스캔 지점이라는 말 자체가 그 뜻이다.
 *
 * 지도를 QR 지점으로 되돌리는 버튼은 지도 위 플로팅 컨트롤이 맡는다 — 지도를 움직인 뒤에
 * 되돌리고 싶어지는 자리는 지도 위이지 화면 맨 위가 아니다.
 *
 * 고정 높이를 주지 않는다 (U-CM-14). 지점명이 길거나 글자를 키우면 두 줄로 넘어가고
 * 띠도 함께 늘어난다 — 잘라내면 어느 정류장인지 알 수 없게 된다.
 */
/* leading: 왼쪽 자리에 들어갈 요소. 기본은 중립적인 QR 아이콘이고, 화면에서
   <Mascot pose="hello" /> 를 넘기면 조아용이 안내하는 모습이 된다. 캐릭터 에셋 경로는
   화면마다 다르므로(Mascot 의 base) 디자인 시스템이 아니라 화면이 알고 있어야 한다. */
export function ContextBar({ place, label = "QR 스캔 지점 기준", leading, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      gap: "var(--space-2)", padding: "4px var(--gutter-screen)",
      background: "var(--surface-brand-soft)",
      borderBottom: "var(--stroke-hairline) solid var(--yong-green-100)", ...style }} {...rest}>
      <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center" }}>
        {leading || <Icon name="qr-code" size={16} color="var(--brand-primary)" />}
      </span>
      <p style={{ minWidth: 0, fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)",
        color: "var(--text-muted)", lineHeight: 1.45, wordBreak: "keep-all" }}>
        {label}
        {place ? (
          <>
            {" · "}
            <b style={{ color: "var(--text-heading)", fontWeight: "var(--fw-bold)" }}>{place}</b>
          </>
        ) : null}
      </p>
    </div>
  );
}
