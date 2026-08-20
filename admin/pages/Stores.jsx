import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, Button, Select, Switch, Badge,
  Pagination, CategoryIcon, CATEGORY_LABELS, Notice, EMPTY_MARK, OnnuriBadge,
} from "../../design-systems/admin.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { STORE_FIELDS, BIZ_MAJOR, DISTRICT_OPTIONS, deriveChip } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, PageSizeSelect, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M05 점포 목록 · M06 점포 등록·수정.
 *
 * ── 335곳이 이 화면의 전제다 ────────────────────────────────────────────────
 * 다른 관리 화면은 목록이 짧아(시설 18, 상점가 32, 축제 6) 필터가 편의 기능이지만,
 * 여기서는 필터가 없으면 화면이 쓸모없다. 담당자가 오는 이유는 대개 **한 곳**을 고치기
 * 위해서이고(신고가 들어온 그 가게), 335줄에서 그것을 찾는 방법이 검색뿐이다.
 *
 * ── 중분류 열이 돌아왔다 ────────────────────────────────────────────────────
 * 한때 뺐던 항목인데 명세서 2-2 가 이유를 들어 되살렸다 — 업종 칩의 카페/디저트가
 * "음식 대분류 중 비알코올 **중분류**"로 정의되어 있어, 중분류가 없으면 카페와 음식점을
 * 가를 수 없다. 폼에는 넣되 **표에는 여전히 적지 않는다** — 소분류와 글자까지 같은 값이
 * 45종 중 13종이라 두 열이 나란히 같은 글자를 반복한다. 저장하는 것과 보여주는 것은 다르다.
 *
 * ── 업종 칩은 자동 산출이지만 고칠 수 있다 ──────────────────────────────────
 * 명세서 2-2 의 `chip_category` 는 ⚙ 이면서 "자동 산출 후 수기 변경 가능"이다. 그래서
 * 폼에서 읽기 전용으로 두지 않고, **산출값을 미리 넣어 둔 채 고칠 수 있게** 한다.
 * 대·중·소분류를 고치면 산출값이 따라 바뀌되, 담당자가 직접 고른 뒤에는 따라가지 않는다 —
 * 손으로 정한 값을 자동 규칙이 덮으면 그 화면은 못 믿을 화면이 된다.
 *
 * ── 일괄 업로드가 빠졌다 (2026-08-20, 명세서 개정) ──────────────────────────
 * 명세서 범위 문단이 "데이터 일괄 적재, 매칭, 갱신, 검수는 개발 쪽에서 처리한다"로 바뀌면서
 * M05 의 기능란에서 일괄 업로드가 사라졌다. 5,000행을 한 번에 넣는 일은 결과를 화면에서
 * 되돌릴 수 없고, 실패한 행을 손보는 일도 결국 매칭이라 여기서 끝나지 않았다.
 *
 * 남은 것은 **한 곳씩 고치는 일**이다 — 신고가 들어온 그 가게를 찾아 상호를 고치거나,
 * 폐업을 확인해 노출을 끄거나, 빠진 가게를 하나 등록하는 것. 335곳에서 그 한 곳을
 * 찾는 방법이 검색이라 필터가 이 화면의 전부다.
 */

const MAJOR_OPTIONS = [{ value: "", label: "전체 대분류" }]
  .concat(BIZ_MAJOR.map(v => ({ value: v, label: v })));

const ONNURI_OPTIONS = [
  { value: "", label: "온누리 전체" },
  { value: "y", label: "가맹" },
  { value: "n", label: "미가맹" },
];

const DISTRICT_FILTER = [{ value: "", label: "전체 상점가" }].concat(DISTRICT_OPTIONS);

/* 등록일시 (⚙). 더미는 "기준월에서 뺀 개월 수"(agoMonths)만 갖고 있어 여기서 날짜로 편다.
   실데이터에서는 서버가 준 created_at 이 그대로 들어온다. */
const BASE_YEAR = 2026, BASE_MONTH = 6;
export function createdAtOf(s) {
  if (s.createdAt) return s.createdAt;
  if (s.agoMonths == null) return null;
  let y = BASE_YEAR, m = BASE_MONTH - Number(s.agoMonths);
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function Stores({ onToast }) {
  const { rows, upsert, remove, patch, patchMany } = useCollection("stores", STORES, null, "점포");
  const [major, setMajor] = React.useState("");
  const [onnuri, setOnnuri] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const list0 = useListState([major, onnuri, district]);

  const ed = useRecordEditor({
    fieldsFor: () => STORE_FIELDS,
    initial: () => ({ onnuri: false, onnuriType: [], visible: true, districtId: CURRENT_DISTRICT_ID }),
    onSave: values => upsert(values),
    onRemove: remove,
    onToast, label: "점포",
  });

  /* 분류를 고치면 업종 칩 산출값이 따라간다. **담당자가 칩을 직접 고른 뒤에는 멈춘다** —
     chipManual 플래그가 그 기억이다 */
  const setField = (key, value) => {
    if (key === "cat") { ed.setMany({ cat: value, chipManual: true }); return; }
    if (["bizL", "biz", "bizS"].includes(key) && !ed.draft.values.chipManual) {
      const next = { ...ed.draft.values, [key]: value };
      ed.setMany({ [key]: value, cat: deriveChip(next) });
      return;
    }
    ed.set(key, value);
  };

  const filtered = React.useMemo(() => rows.filter(s => {
    if (major && s.bizL !== major) return false;
    if (district && (s.districtId || CURRENT_DISTRICT_ID) !== district) return false;
    if (onnuri === "y" && !s.onnuri) return false;
    if (onnuri === "n" && s.onnuri) return false;
    if (!list0.term) return true;
    /* 중분류(biz)도 훑는다. 표에는 안 적지만 담당자가 "노래방"으로 찾을 수 있어야 한다 */
    return `${s.name} ${s.branch || ""} ${s.addr} ${s.biz || ""} ${s.bizS || ""}`.includes(list0.term);
  }), [rows, list0.term, major, onnuri, district]);

  const paged = list0.paginate(filtered);

  const bulkVisible = on => {
    patchMany(list0.selected.map(id => [id, { visible: on }]), `점포 ${on ? "노출" : "숨김"}`);
    onToast(`${list0.selected.length}건을 ${on ? "노출" : "숨김"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  return (
    <>
      {/* 제목 아래 설명을 두지 않는다 (2026-08-20, 사용자 요청). 적혀 있던 것은
          「입력 항목은 명세서 2-2 를 따릅니다」와 시민 화면 기준일 고지였는데, 둘 다
          이 화면에서 할 일을 돕는 말이 아니다 — 명세서 번호는 만드는 쪽의 사정이고,
          기준일은 [데이터 기준일 관리]가 다루는 값이라 여기서는 읽기만 하던 줄이었다. */}
      <PageHeader title="점포 정보 관리" count={`${filtered.length.toLocaleString("ko-KR")}곳`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>점포 등록</Button>} />

      <Toolbar actions={list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkVisible(true)}>노출</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkVisible(false)}>숨김</Button>
        </>
      ) : null}>
        <ListSearch state={list0} placeholder="상호명 · 주소 · 업종 검색" />
        <Select value={district} options={DISTRICT_FILTER} onChange={e => setDistrict(e.target.value)} />
        <Select value={major} options={MAJOR_OPTIONS} onChange={e => setMajor(e.target.value)} />
        <Select value={onnuri} options={ONNURI_OPTIONS} onChange={e => setOnnuri(e.target.value)} />
        <PageSizeSelect state={list0} />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 점포 목록"
        rows={paged.rows} rowKey="id" onRowClick={ed.openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        empty={{ title: "조건에 맞는 점포가 없습니다.", description: "검색어나 업종 필터를 지워 보세요." }}
        columns={[
          { key: "name", label: "상호명", sortable: true },
          { key: "branch", label: "지점명", width: 110, render: s => s.branch || EMPTY_MARK },
          { key: "cat", label: "업종 칩", width: 130, sortable: true,
            render: s => (
              <Cell>
                <CategoryIcon type={s.cat} size={16} />{CATEGORY_LABELS[s.cat] || "기타"}
                {s.chipManual ? <Badge tone="info" size="sm">수기</Badge> : null}
              </Cell>
            ) },
          { key: "bizL", label: "상권업종대분류명", width: 150, sortable: true },
          { key: "bizS", label: "상권업종소분류명", width: 150, render: s => s.bizS || EMPTY_MARK },
          { key: "onnuri", label: "온누리", width: 110, align: "center", sortable: true,
            render: s => (s.onnuri
              ? <OnnuriBadge size="sm">{(s.onnuriType || []).length ? (s.onnuriType || []).map(t => (t === "paper" ? "지류" : "디지털")).join("·") : "가맹"}</OnnuriBadge>
              : <span style={{ color: "var(--text-muted)" }}>{EMPTY_MARK}</span>) },
          { key: "addr", label: "도로명주소", sortable: true },
          { key: "views", label: "조회", width: 90, align: "right", sortable: true,
            render: s => <span style={{ fontVariantNumeric: "tabular-nums" }}>{Number(s.views || 0).toLocaleString("ko-KR")}</span> },
          { key: "visible", label: "노출 여부", width: 104, align: "center",
            render: s => (
              <Switch checked={s.visible !== false} aria-label={`${s.name} 노출 여부`}
                onChange={() => patch(s.id, { visible: s.visible === false }, s.name)} />
            ) },
          { key: "manage", label: "관리", width: 96, align: "center",
            render: s => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(s)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "점포 등록" : "점포 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={{ ...ed.draft.values, createdAt: createdAtOf(ed.draft.values) }}
            errors={ed.errors} onChange={setField}
            onAddress={(key, picked) => ed.setMany({ [key]: picked.addr, lat: picked.lat, lng: picked.lng })}
            extra={
              <div style={{ gridColumn: "1 / -1" }}>
                <Notice tone="neutral" size="sm">
                  업종 칩은 대·중·소분류에서 자동으로 정해집니다. 위에서 직접 고르면 그때부터
                  분류를 고쳐도 따라가지 않습니다 — 손으로 정한 값을 규칙이 덮지 않기 위해서입니다.
                  폐업을 확인했다면 삭제하지 말고 [노출 여부]를 꺼 주세요.
                </Notice>
              </div>
            } />
        ) : null}
      </EditorModal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="점포를 삭제합니다." onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default Stores;
