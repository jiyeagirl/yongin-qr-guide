import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, ConfirmDialog, Button, Select, SearchField,
  Switch, FacilityIcon, FACILITY_LABELS, FACILITY_TYPES, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { FACILITIES, facilityName } from "../../screens/main/data/facilities.js";
import { FACILITY_FIELDS } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { RecordForm } from "./RecordForm.jsx";

/* A-FC-01 공공시설 관리 — **관리자 목록 화면의 기준이다.**
 *
 * 여기서 정한 골격(머리 → 필터 줄 → 표 → 다이얼로그 폼 → 삭제 확인)을 나머지 다섯 화면이
 * 그대로 복제한다. 시민용에서 S05 시설 상세가 상세 화면의 기준이었던 것과 같은 자리다.
 * 새 관리 화면을 만들 때 이 배치를 다시 정하지 않는다.
 *
 * ── 유형에 따라 폼이 통째로 갈린다 ──────────────────────────────────────────
 * 정의서 2-1~2-4 는 서로 다른 표다. AED 는 2개 항목, 화장실은 10개다. 한 폼에 전부
 * 펼쳐놓고 "해당 없으면 비우세요"로 두면 AED 를 등록하는 담당자가 기저귀 교환대 칸을
 * 보게 되고, 그 칸을 비운 것이 "없음"인지 "해당 없음"인지 데이터로는 구분되지 않는다.
 *
 * ── 유형을 나중에 바꿀 수 없다 ──────────────────────────────────────────────
 * 등록할 때만 고른다. 수정에서 유형을 바꾸면 이미 채운 항목의 절반이 갈 곳을 잃는데
 * (화장실 → AED 로 바꾸면 칸수 넷과 비상벨이 사라진다), 그것을 조용히 버릴지 물어볼지가
 * 또 하나의 결정이 된다. 잘못 등록했다면 지우고 다시 넣는 편이 짧고 분명하다.
 *
 * ── 노출 토글은 표에서 바로 누른다 (A-FC-01 "노출 토글") ────────────────────
 * 다이얼로그를 열어야 끄고 켤 수 있으면, 급히 하나 내려야 할 때(잠긴 화장실 신고가
 * 들어왔을 때) 세 번을 눌러야 한다. 폼 안에 넣지 않은 이유이기도 하다 —
 * 노출 여부는 **정의서 항목이 아니라 운영 상태**다. 원천 자료에 그런 칸이 없다.
 */

const TYPE_OPTIONS = [{ value: "", label: "전체 유형" }]
  .concat(FACILITY_TYPES.map(t => ({ value: t, label: FACILITY_LABELS[t] })));

/* 목록의 "주요 항목" 열에 무엇을 적을지. 유형마다 담당자가 가장 먼저 확인하는 값이 다르다 —
   화장실은 칸수가 아니라 **개방시간**이다(잠겨 있으면 칸수는 소용없다), 대피소는 수용 인원이다. */
function summaryOf(f) {
  if (f.type === "toilet") return f.hours || EMPTY_MARK;
  if (f.type === "rest") return f.hours || EMPTY_MARK;
  if (f.type === "aed") return f.place || EMPTY_MARK;
  if (f.type === "shelter") return f.capacity != null ? `약 ${Number(f.capacity).toLocaleString("ko-KR")}명` : EMPTY_MARK;
  return EMPTY_MARK;
}

/* 저장 직전 보정 — AED·대피소의 명칭을 도로명주소에서 다시 만든다 (U-FC-10).
   규칙은 screens/main/data/facilities.js 의 facilityName 하나뿐이다. 여기 다시 적으면
   주소를 고쳤을 때 관리자 목록과 시민 화면의 이름이 갈린다. */
function derive(row) {
  if (row.type !== "aed" && row.type !== "shelter") return row;
  return { ...row, name: facilityName({ ...row, name: null }) };
}

export function Facilities({ onToast }) {
  const { rows, upsert, remove, patch } = useCollection("facilities", FACILITIES, derive);
  const [type, setType] = React.useState("");
  const [q, setQ] = React.useState("");

  const fieldsFor = React.useCallback(v => FACILITY_FIELDS[v.type] || FACILITY_FIELDS.aed, []);
  const ed = useRecordEditor({
    fieldsFor,
    /* 유형을 미리 골라 둔다 — 비워두면 폼이 어떤 항목을 보일지 정하지 못한다 */
    initial: () => ({ type: "aed", visible: true }),
    onSave: values => upsert(values),
    onRemove: remove,
    onToast, label: "공공시설",
  });

  const list = rows.filter(f => {
    if (type && f.type !== type) return false;
    if (!q.trim()) return true;
    const needle = q.trim();
    return `${f.name} ${f.addr} ${f.place || ""}`.includes(needle);
  });

  /* 등록 다이얼로그에서만 유형을 고른다. 정의서 항목이 아니라 **어느 표를 쓸지**를
     정하는 선택이라, 항목표(RecordForm) 밖에 따로 세운다 */
  const typePicker = ed.draft && ed.draft.isNew ? (
    <div style={{ gridColumn: "1 / -1", paddingBottom: "var(--space-4)",
      borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
      <Select label="시설 유형" value={ed.draft.values.type}
        options={FACILITY_TYPES.map(t => ({ value: t, label: FACILITY_LABELS[t] }))}
        onChange={e => ed.set("type", e.target.value)} />
      <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
        유형에 따라 입력 항목이 달라집니다 (정의서 2-1 ~ 2-4). 등록 후에는 바꿀 수 없습니다.
      </p>
    </div>
  ) : null;

  return (
    <>
      <PageHeader title="공공시설 관리" count={`${list.length}곳`}
        note="AED · 공중화장실 · 쉼터 · 대피소. 입력 항목은 정의서 2-1 ~ 2-4 를 따릅니다."
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>시설 등록</Button>} />

      <Toolbar>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")}
          placeholder="명칭 · 주소 · 설치 위치 검색" style={{ width: 320 }} />
        <Select value={type} options={TYPE_OPTIONS} onChange={e => setType(e.target.value)} />
      </Toolbar>

      <DataTable
        caption="등록된 공공시설 목록"
        rows={list} rowKey="id" onRowClick={ed.openEdit}
        empty={{ title: "조건에 맞는 시설이 없습니다.", description: "검색어나 유형 필터를 지워 보세요." }}
        columns={[
          { key: "name", label: "명칭", sortable: true },
          { key: "type", label: "유형", width: 110, sortable: true,
            render: f => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <FacilityIcon type={f.type} size={16} />{FACILITY_LABELS[f.type]}
              </span>
            ) },
          { key: "addr", label: "도로명주소", sortable: true },
          { key: "summary", label: "주요 항목", render: summaryOf,
            hint: "유형별 대표값" },
          { key: "visible", label: "노출", width: 92, align: "center",
            render: f => (
              <Switch checked={f.visible !== false}
                label={<span style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
                  {f.visible === false ? "숨김" : "노출"}
                </span>}
                onChange={() => patch(f.id, { visible: f.visible === false })} />
            ) },
          { key: "manage", label: "관리", width: 96, align: "right",
            render: f => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(f)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <Modal open={!!ed.draft} size="lg" onClose={ed.close}
        title={ed.draft && ed.draft.isNew ? "공공시설 등록" : "공공시설 수정"}
        description={ed.draft && !ed.draft.isNew
          ? `${FACILITY_LABELS[ed.draft.values.type] || ""} · ${ed.draft.values.name || ""}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={ed.close}>취소</Button>
            <Button variant="primary" onClick={ed.save}>저장</Button>
          </>
        }>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors}
            onChange={ed.set} before={typePicker} />
        ) : null}
      </Modal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="시설을 삭제합니다." onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default Facilities;
