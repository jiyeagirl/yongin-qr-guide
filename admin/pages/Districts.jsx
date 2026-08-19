import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, ConfirmDialog, Button, Select, SearchField,
  Textarea, IconButton, Badge, Notice,
} from "../../design-systems/admin.js";
import { DISTRICTS, GU_ORDER, CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { DISTRICT_FIELDS } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { RecordForm } from "./RecordForm.jsx";

/* A-ST-01 상점가 관리 — 32개소.
 *
 * ── 정의서 항목과 운영 항목을 갈라 놓는다 ───────────────────────────────────
 * 정의서 1-1 이 정하는 것은 넷뿐이다 (상점가명 · 주소 · 전체 점포수 · 온누리 가맹 점포수).
 * 그런데 명세서 A-ST-01 은 여기에 두 가지를 더 요구한다 — **구역 주소 목록**과 **노출 순서**.
 *
 * 둘은 공공데이터 항목이 아니다. 구역 주소는 상점가 xlsx 의 `구역 주소` 시트에서 오고
 * (명세서 3-2 — 폴리곤 대신 이 목록이 구역의 실질적 정의다), 노출 순서는 우리가 정하는
 * 운영값이다. 그래서 **항목표 아래 따로 둔다.** 섞어 놓으면 담당자가 "이것도 공공데이터에서
 * 오는 값인가"를 구분할 수 없고, 정의서를 고쳐야 하는 것으로 오해한다.
 *
 * ── 노출 순서를 숫자로 입력받지 않는다 ──────────────────────────────────────
 * 32곳에 1~32 를 손으로 매기면 하나를 올릴 때마다 나머지를 다시 적어야 한다.
 * ▲▼ 로 한 칸씩 옮기고, 저장은 전체 순서를 한 번에 다시 매긴다.
 *
 * 기본 차례는 QR 지점에서 가까운 순이다 (data/districts.js 가 그렇게 정렬해 둔다).
 * 손대지 않은 상태에서는 시민 화면과 같은 차례로 보인다 — 관리자에서 본 순서와
 * 시민 화면의 순서가 처음부터 다르면, 순서를 바꿔도 무엇이 달라졌는지 알 수 없다.
 */

const GU_OPTIONS = [{ value: "", label: "전체 구" }].concat(GU_ORDER.map(g => ({ value: g, label: g })));

/* 노출 순서 값. 아직 손대지 않은 곳은 원본 배열의 자리를 그대로 쓴다 */
const BASE_ORDER = DISTRICTS.reduce((o, d, i) => { o[d.id] = i; return o; }, {});
const orderKey = d => (d.order != null ? d.order : (BASE_ORDER[d.id] != null ? BASE_ORDER[d.id] : 999));

export function Districts({ onToast }) {
  const { rows, upsert, remove, patchMany } = useCollection("districts", DISTRICTS);
  const [q, setQ] = React.useState("");
  const [gu, setGu] = React.useState("");
  const [zones, setZones] = React.useState("");   /* 다이얼로그 안 구역 주소 목록 */

  const ed = useRecordEditor({
    fieldsFor: () => DISTRICT_FIELDS,
    initial: () => ({ gu: GU_ORDER[0] }),
    onSave: values => upsert({ ...values, zones: zones.trim() || null }),
    onRemove: remove,
    onToast, label: "상점가",
  });

  /* 다이얼로그가 열릴 때 구역 주소를 채운다. draft 안에 넣지 않는 이유는
     그것이 정의서 항목표(RecordForm)를 통과하는 값이 아니기 때문이다 */
  const openEdit = row => { setZones(row.zones || ""); ed.openEdit(row); };
  const openNew = () => { setZones(""); ed.openNew(); };

  const ordered = React.useMemo(() => [...rows].sort((a, b) => orderKey(a) - orderKey(b)), [rows]);

  const list = ordered.filter(d => {
    if (gu && d.gu !== gu) return false;
    if (!q.trim()) return true;
    return `${d.name} ${d.gu} ${d.area} ${d.addr}`.includes(q.trim());
  });

  /* 한 칸 옮기고 전체 순서를 다시 매긴다. 필터가 걸린 상태에서는 옮기지 않는다 —
     화면에 안 보이는 곳들 사이로 끼워 넣는 셈이라 결과를 예측할 수 없다 */
  const filtered = !!(gu || q.trim());
  const move = (id, delta) => {
    const idx = ordered.findIndex(d => d.id === id);
    const to = idx + delta;
    if (idx < 0 || to < 0 || to >= ordered.length) return;
    const next = ordered.slice();
    const [it] = next.splice(idx, 1);
    next.splice(to, 0, it);
    patchMany(next.map((d, i) => [d.id, { order: i }]));
  };

  return (
    <>
      <PageHeader title="상점가 관리" count={`${list.length}곳`}
        note="용인시 골목형 상점가. 입력 항목은 정의서 1-1 을 따르며 기준일자를 갖지 않습니다(3-2)."
        action={<Button variant="primary" icon="plus" onClick={openNew}>상점가 등록</Button>} />

      <Toolbar>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")}
          placeholder="상점가명 · 소재지 검색" style={{ width: 320 }} />
        <Select value={gu} options={GU_OPTIONS} onChange={e => setGu(e.target.value)} />
      </Toolbar>

      {filtered ? (
        <Notice tone="neutral" size="sm" style={{ marginBottom: "var(--space-4)" }}>
          검색이나 구 필터가 걸린 동안에는 노출 순서를 바꿀 수 없습니다. 보이지 않는 상점가 사이로
          끼워 넣게 되어 결과를 예측할 수 없기 때문입니다.
        </Notice>
      ) : null}

      <DataTable
        caption="등록된 골목형 상점가 목록"
        rows={list} rowKey="id" onRowClick={openEdit}
        empty={{ title: "조건에 맞는 상점가가 없습니다." }}
        columns={[
          { key: "name", label: "상점가명", sortable: true,
            render: d => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {d.name}
                {d.id === CURRENT_DISTRICT_ID ? <Badge tone="brand" size="sm">현재</Badge> : null}
              </span>
            ) },
          { key: "gu", label: "구", width: 80, sortable: true },
          { key: "area", label: "소재지", sortable: true },
          { key: "stores", label: "전체 점포수", width: 110, align: "right", sortable: true,
            render: d => `${Number(d.stores).toLocaleString("ko-KR")}곳` },
          { key: "onnuri", label: "온누리 가맹", width: 110, align: "right", sortable: true,
            render: d => `${Number(d.onnuri).toLocaleString("ko-KR")}곳` },
          { key: "order", label: "노출 순서", width: 110, align: "center",
            render: d => (
              <span style={{ display: "inline-flex", gap: 2 }}>
                <IconButton name="chevron-up" label={`${d.name} 위로`} size={32}
                  onClick={() => move(d.id, -1)} style={{ opacity: filtered ? 0.35 : 1 }} />
                <IconButton name="chevron-down" label={`${d.name} 아래로`} size={32}
                  onClick={() => move(d.id, 1)} style={{ opacity: filtered ? 0.35 : 1 }} />
              </span>
            ) },
          { key: "manage", label: "관리", width: 96, align: "right",
            render: d => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(d)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <Modal open={!!ed.draft} size="lg" onClose={ed.close}
        title={ed.draft && ed.draft.isNew ? "상점가 등록" : "상점가 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={ed.close}>취소</Button>
            <Button variant="primary" onClick={ed.save}>저장</Button>
          </>
        }>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            extra={
              /* 정의서 항목이 아니다. 항목표 아래에 선을 긋고 따로 둔다 */
              <div style={{ gridColumn: "1 / -1", paddingTop: "var(--space-4)",
                borderTop: "var(--stroke-hairline) solid var(--border-default)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
                    color: "var(--text-heading)" }}>구역 주소 목록</span>
                  <Badge tone="info" size="sm">운영 항목</Badge>
                </div>
                <Textarea value={zones} rows={4} onChange={e => setZones(e.target.value)}
                  placeholder={"처인구 포곡읍 둔전로 42\n처인구 포곡읍 둔전로 55\n처인구 포곡읍 둔전2로 8"} />
                <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  한 줄에 하나씩. 점포의 소속 판정이 이 목록의 도로명주소 매칭으로 이루어집니다
                  (명세서 3-2 — 구역 폴리곤을 쓰지 않습니다). 공공데이터 항목이 아니라
                  상점가 xlsx 의 「구역 주소」 시트에서 옮겨 오는 값입니다.
                </p>
              </div>
            } />
        ) : null}
      </Modal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="상점가를 삭제합니다. 소속 점포는 함께 지워지지 않습니다."
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default Districts;
