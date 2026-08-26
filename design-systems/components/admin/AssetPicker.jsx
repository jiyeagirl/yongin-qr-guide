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

/* ── 칸 아래 안내 줄을 없앴다 (2026-08-26, 사용자 요청) ──────────────────────
   *"사전 등록된 조아용 이미지 내에서 선택가능합니다. 파일 업로드는 지원하지 않습니다."*
   (v1.1~v1.10 은 「사전 등록된 에셋 중에서 고릅니다 …」였고 v1.11 에서 이 문장이 됐다.)

   **두 문장 다 화면이 이미 하고 있는 말이다.** 앞 문장은 그림 여덟 장이 격자로 서 있는
   것이 그대로 답하고 — 고를 수 있는 것이 화면에 전부 나와 있다 — 뒷 문장은 **없는 단추에
   대한 설명**이다. 올리는 자리가 화면에 없는데 「지원하지 않습니다」를 적으면, 담당자는
   그 줄을 읽고 나서야 없다는 것을 알게 되는 것이 아니라 **어딘가에 있을 것 같은데 막혔다**고
   읽는다. 명세서 화면 문구 원칙의 두 조항이 그대로 걸린다 — 「칸이 이미 하고 있는 말」과
   「화면에서 할 수 없는 일을 화면이 설명하지 않는다」.

   `note` 도 함께 뺐다 — 이 문장을 갈아끼우라고 열어 둔 자리인데 부르는 쪽이 한 번도 쓰지
   않았고, 문장 자체가 없어지면서 갈아끼울 것도 없어졌다. 이름 줄의 겹침 안내(`badge`)는
   그대로다: 그쪽은 늘 있는 설명이 아니라 **방금 고른 것에 대한 말**이다. */
export function AssetPicker({
  label = "조아용 이미지", required = true, value, onChange, assets = [], usedBy = {},
  base = "", span = 2, error,
}) {
  /* ── 겹침 안내는 **이름 줄**에 선다 (2026-08-25, 사용자 요청) ─────────────────
     종전에는 격자 **아래**에 한 줄로 적었다. 그러면 그 밑에 안내 줄(`hint`)이 하나 더
     있어 격자 아래가 늘 두 줄이었고, 색만 다른 두 줄이 나란히 서면 어느 쪽이 **지금
     일어난 일**인지 흐려진다 — 하나는 늘 있는 설명이고 하나는 방금 고른 것에 대한
     경고다.

     위로 올리면 그 둘이 갈린다. 무엇보다 이 말은 **누르기 전에** 알아야 하는 말이고,
     눈은 썸네일과 그 위 이름 줄에 가 있다. `FormField` 의 `badge` 슬롯이 그 자리다. */
  const clash = !!(value && (usedBy[value] || []).length);

  return (
    <FormField label={label} required={required} span={span} error={error}
      badge={clash ? (
        /* 어느 축제가 쓰는지는 적지 않는다 (2026-08-25) — 고르개의 「n건 사용 중」 배지가
           이미 세어 두었다. 겹쳐도 막지 않으므로 여기서 할 말은 둘뿐이다:
           겹친다 · 다른 것을 고르라 */
        <span style={{ fontSize: "var(--fs-caption)", color: "var(--state-warning)", lineHeight: 1.55 }}>
          이미 다른 축제에서 사용 중인 이미지입니다. 다른 이미지를 선택해주세요.
        </span>
      ) : null}>
      {/* 격자 하나가 곧 이 칸이다 — 겹침 안내가 이름 줄로 올라가면서 감싸던 <div> 를
          걷어냈다 (2026-08-25). 안쪽에 든 것이 하나뿐인 상자는 자리만 차지한다 */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid",
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
    </FormField>
  );
}

export default AssetPicker;
