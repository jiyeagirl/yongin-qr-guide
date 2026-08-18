import React from "react";
import { Icon } from "../core/Icon.jsx";

/* QR 앵커 지점을 항상 보여주는 바 (U-CM-04).
   이 서비스는 실시간 GPS 를 쓰지 않는다. 사용자가 걸어서 이동해도 기준점은 스캔 지점 그대로이므로
   "현재 위치"라고 쓰면 거짓말이 된다. 그래서 기준점의 정체를 그대로 밝히고,
   아래 줄에 그 기준이 무엇을 뜻하는지 작게 덧붙인다. */
/* leading: 왼쪽 자리에 들어갈 요소. 기본은 중립적인 QR 아이콘이고,
   화면에서 <Mascot pose="hello" /> 를 넘기면 조아용이 안내하는 모습이 된다.
   캐릭터 에셋 경로는 화면마다 다르므로(Mascot 의 base) 디자인 시스템이 아니라 화면이 알고 있어야 한다. */
export function ContextBar({ place, label = "QR 스캔 지점", note = "QR 스캔 지점을 기준으로 위치가 안내됩니다.", leading, onReset, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
      padding: "8px var(--gutter-screen)", background: "var(--surface-brand-soft)",
      borderBottom: "var(--stroke-hairline) solid var(--yong-green-100)", ...style }} {...rest}>
      <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center" }}>
        {leading || <Icon name="qr-code" size={18} color="var(--brand-primary)" />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-body)", lineHeight: 1.4 }}>
          {label} : <b style={{ color: "var(--text-heading)", fontWeight: "var(--fw-bold)" }}>{place}</b>
        </div>
        {note ? (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", color: "var(--text-muted)", lineHeight: 1.4, marginTop: 2 }}>
            *{note}
          </div>
        ) : null}
      </div>
      {/* "기준점 보기"는 무슨 일이 일어나는지 알 수 없는 말이었다.
          이 버튼은 지도를 QR 지점으로 되돌리는 동작이므로 그대로 적는다 */}
      {onReset ? (
        <button onClick={onReset}
          style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 3,
            background: "none", border: "none", padding: "6px 0", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)",
            color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
          <Icon name="crosshair" size={14} />지점으로 이동
        </button>
      ) : null}
    </div>
  );
}
