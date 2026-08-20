import React from "react";
import { Input } from "../core/Input.jsx";
import { Select } from "../core/Select.jsx";
import { Switch } from "../core/Switch.jsx";
import { Button } from "../core/Button.jsx";
import { IconButton } from "../core/IconButton.jsx";
import { Badge } from "../core/Badge.jsx";

/* 1:N 항목 편집기 — 한 레코드에 딸린 여러 줄을 그 자리에서 넣고 뺀다.
 *
 * 명세서에 1:N 이 셋 있다:
 *   2-2 구역 주소 목록   상점가당 최소 1건 (M04)
 *   2-7 프로그램 일정    축제당 0~n 건    (M09 · 조건부 `C`)
 *   2-8 부스 위치        축제당 0~n 건    (M09 · 조건부 `C`)
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

export function Repeater({
  title, note, badge, columns = [], rows = [], onChange,
  newRow = () => ({}), addLabel = "행 추가", empty = "아직 없습니다.",
  minRows = 0, error, span = 2,
}) {
  const list = Array.isArray(rows) ? rows : [];

  const set = (i, key, value) => {
    if (!onChange) return;
    onChange(list.map((r, n) => (n === i ? { ...r, [key]: value } : r)));
  };
  const add = () => onChange && onChange(list.concat(newRow()));
  const drop = i => onChange && onChange(list.filter((_, n) => n !== i));

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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
            paddingRight: 40, fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
            {columns.map(c => (
              <span key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                {c.label}{c.required ? <b style={{ color: "var(--state-danger)" }}> *</b> : null}
              </span>
            ))}
          </div>

          {list.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {columns.map(c => (
                <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                  {c.type === "select" ? (
                    <Select options={c.options} value={row[c.key] == null ? "" : row[c.key]}
                      onChange={e => set(i, c.key, e.target.value)} />
                  ) : c.type === "switch" ? (
                    <div style={{ minHeight: "var(--tap-comfortable)", display: "flex", alignItems: "center" }}>
                      <Switch checked={!!row[c.key]} label={row[c.key] ? (c.onLabel || "예") : (c.offLabel || "아니오")}
                        onChange={() => set(i, c.key, !row[c.key])} />
                    </div>
                  ) : (
                    <Input type={c.type === "number" ? "number" : c.type || "text"}
                      value={row[c.key] == null ? "" : row[c.key]}
                      placeholder={c.placeholder} min={c.min} max={c.max} maxLength={c.maxLength}
                      onChange={e => set(i, c.key, e.target.value)} />
                  )}
                </div>
              ))}
              <IconButton name="trash-2" label={`${i + 1}번째 줄 삭제`} size={36}
                onClick={() => drop(i)} style={{ flex: "0 0 auto", color: "var(--state-danger)" }} />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ padding: "var(--space-4)", background: "var(--surface-sunken)",
          borderRadius: "var(--radius-md)", fontSize: "var(--fs-caption)",
          color: "var(--text-muted)", lineHeight: 1.55 }}>
          {empty}
        </p>
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

/* 조건부(`C`) 구획에 붙이는 이름표. 명세서가 "자료 제공 범위 확정 후 반영 여부 결정"이라고
   적은 항목들이라, 담당자가 이것을 지금 반드시 채워야 하는 칸으로 읽으면 안 된다. */
export function ConditionalBadge() {
  return <Badge tone="warning" size="sm">조건부 · 자료 확보 시</Badge>;
}

export default Repeater;
