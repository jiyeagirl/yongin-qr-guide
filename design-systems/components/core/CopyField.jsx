import React from "react";
import { Icon } from "./Icon.jsx";

/* 주소 + [복사] (U-FC-05 "주소 복사"). S05 시설 상세, S06 점포 상세, 이후 S09 축제 상세가 쓴다.
 *
 * 왜 별도 컴포넌트인가: 주소는 이 서비스에서 **길찾기 다음으로 많이 쓰이는 출력**이다.
 * 카카오맵·티맵을 이미 쓰고 있는 사용자는 경로 안내를 우리 화면에서 받는 대신 주소를 복사해
 * 자기 앱에 붙여넣는다. 그 동작이 화면마다 다른 모양이면 안 된다.
 *
 * ── 클립보드 폴백이 필요한 이유 ────────────────────────────────────────
 * navigator.clipboard 는 보안 컨텍스트(https 또는 localhost)에서만 있다. 검수 단계에서
 * 팀원이 사내 IP(http://192.168.x.x:8000)로 열면 그냥 undefined 라 아무 일도 일어나지 않는다.
 * 그때 조용히 실패하면 "복사가 안 된다"가 아니라 "버튼이 죽었다"로 읽히므로
 * execCommand("copy") 로 한 번 더 시도한다.
 *
 * 결과는 여기서 토스트를 띄우지 않고 onCopied(성공 여부)로 올린다 — 토스트는 화면 최상단
 * (z-toast)에 하나만 있어야 하고, 그 자리는 화면이 갖고 있다.
 */

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}

/* 보안 컨텍스트가 아닐 때의 폴백. 화면 밖에 textarea 를 잠깐 두고 선택해서 복사한다.
   readOnly 를 주지 않으면 iOS 사파리가 키보드를 띄운다. */
function legacyCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.readOnly = true;
    ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

export function CopyField({ label = "주소", value, onCopied, style, ...rest }) {
  if (!value) return null;

  const copy = () => copyText(value).then(ok => onCopied && onCopied(ok, value));

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
      background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)", padding: "var(--space-3) var(--space-4)", ...style }} {...rest}>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 굵기는 InfoList 의 라벨(dt)과 같은 bold(600)다 — 같은 카드 묶음 안에서
            "주소"만 가늘면 항목명 줄이 들쭉날쭉해 보인다 */}
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)", color: "var(--text-muted)",
          lineHeight: "var(--lh-caption)" }}>{label}</div>
        {/* 주소는 자르지 않는다. 말줄임하면 복사 전에 무엇을 복사하는지 확인할 수 없다 */}
        <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: "var(--lh-body)",
          wordBreak: "keep-all", overflowWrap: "anywhere" }}>{value}</div>
      </div>

      <button onClick={copy} aria-label={`${label} 복사`}
        style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 4,
          minWidth: "var(--tap-min)", minHeight: "var(--tap-min)", padding: "0 var(--space-2)",
          justifyContent: "center", background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)",
          color: "var(--brand-primary)" }}>
        <Icon name="copy" size={18} />복사
      </button>
    </div>
  );
}
