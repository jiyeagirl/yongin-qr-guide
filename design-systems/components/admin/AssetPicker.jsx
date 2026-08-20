import React from "react";
import { Mascot } from "../brand/Mascot.jsx";
import { Badge } from "../core/Badge.jsx";
import { FormField } from "./FormGrid.jsx";

/* 조아용 이미지 선택 (명세서 2-6).
 *
 * ── 왜 파일 업로드가 아닌가 ─────────────────────────────────────────────────
 * 명세서가 네 가지를 못 박았고, 넷 다 이유가 다르다:
 *
 *   "파일 업로드가 아니라 사전 등록된 에셋 목록에서 선택한다"
 *      관리자가 임의 이미지를 올리면 톤이 무너지고 저작권 확인 부담이 생긴다.
 *   "썸네일 그리드로 제시한다. 파일명이나 코드값을 입력하게 하지 않는다"
 *      `joayong-thumbsup` 을 보고 어떤 그림인지 아는 사람은 만든 사람뿐이다.
 *   "기본값을 지정해 미선택 상태가 나오지 않게 한다"
 *      필수 항목인데 기본값이 없으면 저장할 때마다 걸린다.
 *   "다른 축제가 이미 쓰고 있는 이미지에 표시를 남긴다"
 *      **이것이 이 컴포넌트를 만든 진짜 이유다.** 축제 6건이 모두 같은 그림이면
 *      둘러보기 탭이 단조로워지는데, 등록하는 사람은 자기 축제 하나만 보고 있어
 *      그 사실을 알 방법이 없다. 화면이 알려주지 않으면 아무도 모른다.
 *
 * ── 겹쳐도 막지 않는다 ──────────────────────────────────────────────────────
 * 표시만 남기고 선택은 허용한다. 축제가 에셋 종류보다 많아지는 날이 오고, 그때 막혀
 * 있으면 등록 자체가 안 된다. 알려주는 것과 막는 것은 다르다.
 */

export function AssetPicker({
  label = "조아용 이미지", required = true, value, onChange, assets = [], usedBy = {},
  base = "", span = 2, error, note,
}) {
  return (
    <FormField label={label} required={required} span={span} error={error}
      hint={note || "사전 등록된 에셋 중에서 고릅니다. 파일 업로드는 지원하지 않습니다."}>
      <div>
        <ul style={{ listStyle: "none", display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: "var(--space-3)" }}>
          {assets.map(a => {
            const on = a.id === value;
            const used = (usedBy[a.id] || []).filter(Boolean);
            return (
              <li key={a.id}>
                <button type="button" onClick={() => onChange && onChange(a.id)}
                  aria-pressed={on}
                  style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 4, padding: "var(--space-3) var(--space-2)", cursor: "pointer",
                    background: on ? "var(--brand-primary-soft)" : "var(--surface-card)",
                    border: `${on ? "var(--stroke-bold)" : "var(--stroke-hairline)"} solid ${on ? "var(--brand-primary)" : "var(--border-default)"}`,
                    borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)",
                    transition: "background var(--dur-fast), border-color var(--dur-fast)" }}>
                  <Mascot pose={a.pose} size={56} base={base} alt="" />
                  <span style={{ fontSize: "var(--fs-micro)", fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)",
                    color: on ? "var(--brand-primary)" : "var(--text-body)", wordBreak: "keep-all", textAlign: "center" }}>
                    {a.label}
                  </span>
                  {/* 이미 쓰이는 중이라는 표시. 몇 건인지까지 적는다 — "쓰임"만으로는
                      한 곳이 쓰는 것과 네 곳이 쓰는 것이 같아 보인다 */}
                  {used.length ? (
                    <Badge tone="warning" size="sm">{used.length}건 사용 중</Badge>
                  ) : <span style={{ height: 18 }} />}
                </button>
              </li>
            );
          })}
        </ul>

        {value && (usedBy[value] || []).length ? (
          <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
            color: "var(--state-warning)", lineHeight: 1.55 }}>
            이 그림은 이미 {(usedBy[value] || []).join(" · ")} 이(가) 쓰고 있습니다.
            둘러보기 탭에서 카드가 같은 그림으로 나란히 서게 됩니다 — 다른 그림을 고르는 편이 좋습니다.
          </p>
        ) : null}
      </div>
    </FormField>
  );
}

export default AssetPicker;
