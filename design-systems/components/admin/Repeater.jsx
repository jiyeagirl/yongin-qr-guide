import React from "react";
import { Input } from "../core/Input.jsx";
import { Select } from "../core/Select.jsx";
import { Switch } from "../core/Switch.jsx";
import { Button } from "../core/Button.jsx";
import { IconButton } from "../core/IconButton.jsx";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";

/* 1:N 항목 편집기 — 한 레코드에 딸린 여러 줄을 그 자리에서 넣고 뺀다.
 *
 * 명세서에 1:N 이 셋 있다:
 *   2-2 구역 주소 목록   상점가당 최소 1건 (개발 쪽으로 감)
 *   2-4 프로그램 일정    축제당 0~n 건    (M08)
 *   2-5 부스 위치        축제당 0~n 건    (M08)
 *
 * ── 왜 텍스트 상자에 줄바꿈으로 받지 않는가 ─────────────────────────────────
 * 처음에는 구역 주소를 여러 줄 textarea 로 받았다. 항목이 주소 하나뿐일 때는 그것으로
 * 충분했는데, 명세서 2-2 가 한 줄에 **네 개**를 요구한다 — 도로명주소 · 시작번호 ·
 * 끝번호 · 제외 구간 여부. 이것을 한 줄 문자열로 받으면 구분자를 정해야 하고
 * ("둔전로 42-88 제외"?), 담당자가 그 문법을 틀리는 순간 조용히 다른 뜻이 된다.
 *
 * 칸을 나눠 두면 문법이 없다. 빈 칸은 빈 칸이고, 토글은 켜졌거나 꺼졌다.
 *
 * ── 표처럼 보이지만 DataTable 이 아니다 ─────────────────────────────────────
 * DataTable 은 **읽는** 표다 (정렬·빈 상태·행 클릭). 여기는 전부 입력칸이라 정렬할
 * 것도 없고, 행을 눌러 열 상세도 없다. 둘을 한 컴포넌트로 묶으면 쓰지 않는 갈래가
 * 절반이 되고, 그 절반은 아무도 눌러보지 않은 채 남는다.
 */

/* ── 한 줄이 두 줄이 될 수 있다 (2026-08-24) ──────────────────────────────────
 * 축제 프로그램이 다섯 칸이 되면서(시작 일시 · 종료 일시 · 프로그램명 · 위치 · 설명)
 * 한 줄에 다 세우면 각 칸이 120px 로 쪼그라들었다 — 일시 고르개 둘이 그 줄에서 420px 을
 * 먼저 가져간다. 짧은 값(일시 · 이름 · 위치)은 나란히 훑는 것이 맞고, 문장 하나(설명)는
 * 그럴 이유가 없다.
 *
 * 그래서 칼럼에 `row2: true` 를 달면 **그 항목만 아랫줄로 내려간다.** 아랫줄은 열 이름
 * 줄이 가리키지 못하므로(윗줄 칸과 폭이 다르다) 칸 앞에 이름표를 직접 붙인다.
 * 한 항목이 두 줄이 되면 어디까지가 한 항목인지 흐려지므로 항목 사이에 가는 줄을 긋는다.
 */
const LABEL_W = 56;

/* 칸 안 예시에는 「예)」를 붙인다 — 흐린 글씨는 이미 값이 들어 있는 것처럼 보인다
   (FormField 와 같은 규칙) */
const phOf = c => (c.placeholder ? `예) ${c.placeholder}` : undefined);

export function Repeater({
  title, note, badge, columns = [], rows = [], onChange,
  newRow = () => ({}), addLabel = "행 추가",
  minRows = 0, error, span = 2,
}) {
  const list = Array.isArray(rows) ? rows : [];
  const top = columns.filter(c => !c.row2);
  const bottom = columns.filter(c => c.row2);

  const set = (i, key, value) => {
    if (!onChange) return;
    onChange(list.map((r, n) => (n === i ? { ...r, [key]: value } : r)));
  };
  const add = () => onChange && onChange(list.concat(newRow()));
  const drop = i => onChange && onChange(list.filter((_, n) => n !== i));

  /* 열 이름 줄. 비었을 때도 그린다 — 아래 예시 줄이 어느 칸에 무엇을 넣는 자리인지
     말해 주는 것이 이 줄이다. 오른쪽 40px 은 삭제 버튼 자리를 비워 둔 것이다.
     **윗줄 칸만 가리킨다** — 아랫줄 칸은 자기 이름표를 앞에 달고 있다. */
  const head = (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
      paddingRight: 40, fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
      {top.map(c => (
        <span key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
          {c.label}{c.required ? <b style={{ color: "var(--state-danger)" }}> *</b> : null}
        </span>
      ))}
    </div>
  );

  /* 칸 하나. `disabled` 면 예시 줄용이다 (값 없이 모양만 보여준다) */
  const cell = (c, row, i, off) => {
    if (c.type === "select") {
      return (
        <Select options={c.options} disabled={off} tabIndex={off ? -1 : undefined}
          aria-hidden={off ? "true" : undefined} aria-label={off ? undefined : c.label}
          value={off
            ? (c.options && c.options[0] ? (c.options[0].value ?? c.options[0]) : "")
            : (row[c.key] == null ? "" : row[c.key])}
          onChange={off ? () => {} : e => set(i, c.key, e.target.value)} />
      );
    }
    if (c.type === "switch") {
      return (
        <div style={{ minHeight: "var(--tap-comfortable)", display: "flex", alignItems: "center" }}>
          <Switch checked={off ? false : !!row[c.key]} disabled={off}
            aria-hidden={off ? "true" : undefined} aria-label={off ? undefined : c.label}
            onChange={off ? undefined : () => set(i, c.key, !row[c.key])} />
        </div>
      );
    }
    return (
      <Input type={c.type === "number" ? "number" : c.type || "text"}
        value={off ? "" : (row[c.key] == null ? "" : row[c.key])}
        readOnly={off} disabled={off} tabIndex={off ? -1 : undefined}
        aria-hidden={off ? "true" : undefined} aria-label={off ? undefined : c.label}
        placeholder={phOf(c)} min={c.min} max={c.max} maxLength={c.maxLength}
        onChange={off ? undefined : e => set(i, c.key, e.target.value)} />
    );
  };

  /* 아랫줄 — 이름표 + 칸. 열 이름 줄이 가리키지 못하는 자리라 이름을 직접 단다.
     오른쪽 40px 은 윗줄 삭제 버튼과 폭을 맞추기 위한 것이다. */
  const lower = (row, i, off) => (bottom.length ? (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", paddingRight: 40 }}>
      {bottom.map(c => (
        <React.Fragment key={c.key}>
          <span style={{ flex: `0 0 ${LABEL_W}px`, fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
            {c.label}{c.required ? <b style={{ color: "var(--state-danger)" }}> *</b> : null}
          </span>
          <div style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>{cell(c, row, i, off)}</div>
        </React.Fragment>
      ))}
    </div>
  ) : null);

  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 6 }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
          {title}
        </span>
        {badge}
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-caption)", color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums" }}>
          {list.length}건{minRows ? ` · 최소 ${minRows}건` : ""}
        </span>
      </div>

      {list.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {/* 열 이름은 한 번만 적는다. 줄마다 label 을 붙이면 세 줄짜리 목록이
              화면 절반을 먹는다 */}
          {head}

          {/* 한 항목이 두 줄일 수 있다 — 그때는 가는 줄로 항목을 가른다 (머리말) */}
          {list.map((row, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)",
              paddingTop: i && bottom.length ? "var(--space-2)" : 0,
              borderTop: i && bottom.length ? "var(--stroke-hairline) solid var(--border-default)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {top.map(c => (
                  <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                    {cell(c, row, i, false)}
                  </div>
                ))}
                <IconButton name="trash-2" label={`${i + 1}번째 줄 삭제`} size={36}
                  onClick={() => drop(i)} style={{ flex: "0 0 auto", color: "var(--state-danger)" }} />
              </div>
              {lower(row, i, false)}
            </div>
          ))}
        </div>
      ) : (
        /* ── 비었을 때는 글로 설명하지 않고 **한 줄을 그려 보인다** (2026-08-20) ──
           전에는 회색 상자에 "프로그램 일정이 없으면 시민 화면에 그 구획이 그려지지
           않습니다" 같은 문장이 있었다. 그 문장은 [추가]를 눌렀을 때 **무엇이 생기는지**를
           말해 주지 않는다 — 담당자가 알고 싶은 것은 그것이다. 열 이름과 비활성 칸 한 줄을
           그려 두면 누르기 전에 이미 답이 나와 있다.

           칸은 disabled 이고 안의 글자가 「예)」로 시작한다 — 데이터가 아니라는 말을 그 두
           글자가 한다. 머리의 「0건」도 같은 말을 한다. */
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {head}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {/* 고르는 칸의 예시는 **첫 선택지**다. 빈 값으로 두면 예시 줄에서 그 칸만
                비어 보여, 고르는 칸이라는 사실이 오히려 흐려진다 (cell 의 off 갈래) */}
            {top.map(c => (
              <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                {cell(c, {}, -1, true)}
              </div>
            ))}
            {/* 삭제 버튼 자리를 비워 둔다 — 열 이름 줄의 paddingRight:40 과 맞춰야 칸이
                어긋나지 않는다. 여기 「예시」라고 적었던 것을 뺐다 (2026-08-20): 칸 안이
                이미 「예)」로 시작해 같은 말을 두 번 하고 있었다. */}
            <span aria-hidden="true" style={{ flex: "0 0 36px" }} />
          </div>
          {lower({}, -1, true)}
          {/* 눈으로 보는 사람에게는 위 한 줄이 곧 설명이다. 읽어주는 도구에는 그 줄이
              비활성 칸 더미로만 들리므로, 같은 뜻을 한 문장으로 남긴다 */}
          <VisuallyHidden>
            아직 없습니다. 위 줄은 {addLabel} 을 눌렀을 때 생기는 칸을 보여주는 예시입니다.
          </VisuallyHidden>
        </div>
      )}

      <div style={{ marginTop: "var(--space-3)" }}>
        <Button variant="outline" size="sm" icon="plus" onClick={add}>{addLabel}</Button>
      </div>

      {error ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--state-danger)", lineHeight: 1.5 }}>
          {error}
        </p>
      ) : null}
      {note ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

/* ── 여기 있던 `ConditionalBadge` 를 없앴다 (2026-08-20, 사용자 요청) ──────────
   「조건부 · 자료 확보 시」라고 적던 이름표다. 자료를 받을지 아직 모른다는 것은 **우리 쪽
   사정**이고, 이 칸을 채우는 사람에게 그것은 "있으면 넣고 없으면 비운다"와 똑같이 행동한다 —
   즉 그냥 선택 항목이다. 우리 사정을 화면에 적으면 담당자는 그 배지가 자기에게 무엇을
   요구하는지 알아내려 애쓴다.

   `badge` 슬롯 자체는 남아 있다 (제목 옆에 무엇이든 세울 수 있는 자리다). */

export default Repeater;
