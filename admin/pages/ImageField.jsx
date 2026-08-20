import React from "react";
import { Button, Badge, Icon } from "../../design-systems/admin.js";

/* 이미지 업로드 (검증 규칙 V-06 — jpg · png · webp, 최대 5MB).
 *
 * 지금 이 시스템에서 이미지를 받는 자리는 축제 부스 배치도 하나뿐이다 (명세서 2-8).
 * 조아용은 업로드가 아니라 **고르는** 것이고(2-6), 점포·시설 사진은 명세서에 없다.
 * 자리가 하나뿐이라 디자인 시스템에 올리지 않고 관리자 화면 쪽에 둔다 — 두 번째 자리가
 * 생기면 그때 옮긴다.
 *
 * ── data URL 로 들고 있는다 ─────────────────────────────────────────────────
 * 올릴 서버가 없다. 파일을 base64 로 읽어 값 자체에 넣으면 새로고침에도 살아남고
 * (덮개가 sessionStorage 에 있다) 미리보기도 그대로 된다. 5MB 제한이 여기서 두 번째
 * 뜻을 갖는다 — sessionStorage 가 5MB 안팎이라 그보다 큰 파일은 애초에 담기지 않는다.
 * 실연동 때는 이 자리가 파일 업로드 API 가 되고 값은 URL 이 된다.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageField({ label, value, onChange, error, note, badge, span = 2 }) {
  const input = React.useRef(null);
  const [local, setLocal] = React.useState(null);

  const pick = file => {
    if (!file) return;
    if (!TYPES.includes(file.type)) { setLocal("jpg · png · webp 만 올릴 수 있습니다 (V-06)."); return; }
    if (file.size > MAX_BYTES) {
      setLocal(`${(file.size / 1024 / 1024).toFixed(1)}MB 입니다. 5MB 까지 올릴 수 있습니다 (V-06).`);
      return;
    }
    setLocal(null);
    const reader = new FileReader();
    reader.onload = () => onChange && onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  const msg = local || error;

  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 6 }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
          {label}
        </span>
        {badge || <Badge tone="neutral" size="sm">선택</Badge>}
      </div>

      <input ref={input} type="file" accept={TYPES.join(",")} style={{ display: "none" }}
        onChange={e => pick(e.target.files && e.target.files[0])} />

      {value ? (
        <div>
          <img src={value} alt={`${label} 미리보기`}
            style={{ display: "block", maxWidth: "100%", maxHeight: 260, objectFit: "contain",
              background: "var(--surface-sunken)", borderRadius: "var(--radius-md)",
              border: "var(--stroke-hairline) solid var(--border-default)" }} />
          <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-2)" }}>
            <Button variant="outline" size="sm" icon="upload"
              onClick={() => input.current && input.current.click()}>다른 이미지</Button>
            <Button variant="ghost" size="sm" icon="trash-2" onClick={() => onChange && onChange(null)}
              style={{ color: "var(--state-danger)" }}>지우기</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)",
          padding: "var(--space-4)", background: "var(--surface-sunken)",
          border: `var(--stroke-hairline) dashed ${msg ? "var(--state-danger)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-md)" }}>
          <Icon name="image" size={20} color="var(--text-muted)" />
          <Button variant="outline" size="sm" icon="upload"
            onClick={() => input.current && input.current.click()}>이미지 선택</Button>
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
            jpg · png · webp · 최대 5MB
          </span>
        </div>
      )}

      {msg || note ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", lineHeight: 1.5,
          color: msg ? "var(--state-danger)" : "var(--text-muted)" }}>
          {msg || note}
        </p>
      ) : null}
    </div>
  );
}

export default ImageField;
