import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, ConfirmDialog, Button, Select, SearchField,
  Pagination, CategoryIcon, CATEGORY_LABELS, yesNoMark, EMPTY_MARK, Notice,
} from "../../design-systems/admin.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { PAGE_SIZE, STORE_AS_OF } from "../../screens/main/config.js";
import { STORE_FIELDS, BIZ_MAJOR } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { RecordForm } from "./RecordForm.jsx";

/* A-ST-02 점포 관리.
 *
 * ── 335곳이 이 화면의 전제다 ────────────────────────────────────────────────
 * 다른 관리 화면은 목록이 짧아(시설 18, 상점가 32, 축제 6) 필터가 편의 기능이지만,
 * 여기서는 필터가 없으면 화면이 쓸모없다. 담당자가 오는 이유는 대개 **한 곳**을 고치기
 * 위해서이고(문의가 들어온 그 가게), 335줄에서 그것을 찾는 방법이 검색뿐이다.
 *
 * ── 쪽 나누기를 시민용과 같은 20으로 둔다 ───────────────────────────────────
 * config.PAGE_SIZE 를 그대로 쓴다. 관리자라고 100개씩 뿌리면 브라우저가 버티기는 하지만,
 * 담당자가 Ctrl+F 로 찾게 되어 우리가 만든 검색이 무시된다. 무엇보다 두 화면의 쪽 수가
 * 다르면 "17쪽 중 3쪽"을 말로 주고받을 때 서로 다른 것을 가리킨다.
 *
 * ── 중분류 열이 없다 ────────────────────────────────────────────────────────
 * 정의서 1-2 에서 뺐다 (2026-08-19). 데이터에는 `biz` 로 남아 있고 검색은 그것도 훑지만,
 * 표에도 폼에도 적지 않는다 — 소분류와 겹치는 자리가 너무 많다(45종 중 13종이 글자까지 같다).
 *
 * ── 일괄 업로드는 서버가 필요하다 ───────────────────────────────────────────
 * 버튼을 감추지 않고, 눌렀을 때 **어떤 열을 기대하는지**를 보여준다. 담당자가 준비할 것을
 * 지금 알 수 있고, 연동 때 그 화면에 파일 선택만 붙으면 된다. 비활성 버튼을 두지 않는
 * 규칙(확정 결정사항 3)은 시민 화면의 것이지만 취지는 여기서도 같다 — 눌리는 것은
 * 무엇이든 해야 한다.
 */

const MAJOR_OPTIONS = [{ value: "", label: "전체 대분류" }]
  .concat(BIZ_MAJOR.map(v => ({ value: v, label: v })));

const ONNURI_OPTIONS = [
  { value: "", label: "온누리 전체" },
  { value: "y", label: "가맹" },
  { value: "n", label: "미가맹" },
];

export function Stores({ onToast }) {
  const { rows, upsert, remove } = useCollection("stores", STORES);
  const [q, setQ] = React.useState("");
  const [major, setMajor] = React.useState("");
  const [onnuri, setOnnuri] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [bulk, setBulk] = React.useState(false);

  const ed = useRecordEditor({
    fieldsFor: () => STORE_FIELDS,
    initial: () => ({ onnuri: false }),
    onSave: values => upsert(values),
    onRemove: remove,
    onToast, label: "점포",
  });

  const list = React.useMemo(() => rows.filter(s => {
    if (major && s.bizL !== major) return false;
    if (onnuri === "y" && !s.onnuri) return false;
    if (onnuri === "n" && s.onnuri) return false;
    if (!q.trim()) return true;
    /* 중분류(biz)도 훑는다. 표에는 안 적지만 담당자가 "노래방"으로 찾을 수 있어야 한다 */
    return `${s.name} ${s.branch || ""} ${s.addr} ${s.biz || ""} ${s.bizS || ""}`.includes(q.trim());
  }), [rows, q, major, onnuri]);

  /* 조건이 바뀌면 첫 쪽으로. 그러지 않으면 12쪽을 보다 검색어를 넣었을 때
     결과가 3쪽뿐이라 빈 화면이 뜬다 */
  React.useEffect(() => { setPage(1); }, [q, major, onnuri]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader title="점포 관리" count={`${list.length.toLocaleString("ko-KR")}곳`}
        note={`둔전골목형상점가 · 상가(상권)정보 ${STORE_AS_OF} 기준 · 입력 항목은 정의서 1-2 를 따릅니다.`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>점포 등록</Button>} />

      <Toolbar actions={
        <Button variant="outline" size="sm" icon="upload" onClick={() => setBulk(true)}>일괄 업로드</Button>
      }>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")}
          placeholder="상호명 · 주소 · 업종 검색" style={{ width: 320 }} />
        <Select value={major} options={MAJOR_OPTIONS} onChange={e => setMajor(e.target.value)} />
        <Select value={onnuri} options={ONNURI_OPTIONS} onChange={e => setOnnuri(e.target.value)} />
      </Toolbar>

      <DataTable
        caption="등록된 점포 목록"
        rows={shown} rowKey="id" onRowClick={ed.openEdit}
        empty={{ title: "조건에 맞는 점포가 없습니다.", description: "검색어나 업종 필터를 지워 보세요." }}
        columns={[
          { key: "name", label: "상호명", sortable: true },
          { key: "branch", label: "지점명", width: 110, render: s => s.branch || EMPTY_MARK },
          { key: "cat", label: "업종 칩", width: 120, hint: "화면 분류",
            render: s => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <CategoryIcon type={s.cat} size={16} />{CATEGORY_LABELS[s.cat] || "기타"}
              </span>
            ) },
          { key: "bizL", label: "상권업종대분류명", width: 150, sortable: true, hint: "원천 분류" },
          { key: "bizS", label: "상권업종소분류명", width: 150, render: s => s.bizS || EMPTY_MARK },
          { key: "onnuri", label: "온누리", width: 80, align: "center", sortable: true,
            render: s => yesNoMark(s.onnuri, "가맹", "미가맹") },
          { key: "addr", label: "도로명주소", sortable: true },
          { key: "manage", label: "관리", width: 96, align: "right",
            render: s => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(s)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      {pageCount > 1 ? (
        <div style={{ marginTop: "var(--space-5)" }}>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      ) : null}

      <Modal open={!!ed.draft} size="lg" onClose={ed.close}
        title={ed.draft && ed.draft.isNew ? "점포 등록" : "점포 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={ed.close}>취소</Button>
            <Button variant="primary" onClick={ed.save}>저장</Button>
          </>
        }>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set} />
        ) : null}
      </Modal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="점포를 삭제합니다." onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />

      {/* ── 일괄 업로드 (A-ST-02) ────────────────────────────────────────
             지금 할 수 있는 일은 **열 규격을 알려주는 것**이다. 파일을 받아도 보낼 곳이 없다. */}
      <Modal open={bulk} title="점포 일괄 업로드" size="md" onClose={() => setBulk(false)}
        description="상가(상권)정보 원본에서 아래 열만 남겨 CSV 로 저장해 주세요."
        footer={<Button variant="ghost" onClick={() => setBulk(false)}>닫기</Button>}>
        <ol style={{ paddingLeft: "1.2em", display: "flex", flexDirection: "column", gap: 6,
          fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.6 }}>
          {STORE_FIELDS.map(f => (
            <li key={f.key}>
              {f.label}
              <span style={{ marginLeft: 6, fontSize: "var(--fs-caption)",
                color: f.required ? "var(--state-danger)" : "var(--text-muted)" }}>
                {f.required ? "필수" : "선택"}
              </span>
            </li>
          ))}
        </ol>
        <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-4)" }}>
          업로드 실행은 서버 연동 후 열립니다. 자동 매칭에 실패한 주소는 검수 큐(A-ST-03)로
          넘어가며, 그 화면은 후속 과제입니다.
        </Notice>
      </Modal>
    </>
  );
}

export default Stores;
