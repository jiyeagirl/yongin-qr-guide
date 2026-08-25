import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, Button, Select, Switch, Badge,
  Pagination, CategoryIcon, CATEGORY_LABELS, Notice, EMPTY_MARK, OnnuriBadge,
  CoordField, fixCoord,
} from "../../design-systems/admin.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { STORE_ROWS } from "../data/sources.js";
import { STORE_FIELDS, BIZ_MAJOR, DISTRICT_OPTIONS, deriveChip } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";
/* 여기서 `./RemovedItems.jsx` 의 「전체 | 삭제된 항목」 탭을 가져왔다 (2026-08-24 삭제).
   삭제가 영구가 되면서 되돌리는 자리가 통째로 없어졌다 — `data/store.js` 머리말 참조 */

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
 * ── 업종 칩은 자동으로 채워지되 담당자가 정한다 ─────────────────────────────
 * 명세서 2-2 의 `chip_category` 는 "자동 산출 후 수기 변경 가능"이다. 산출값을 미리 넣어
 * 둔 채 고칠 수 있게 하고, 대·중·소분류를 고치면 산출값이 따라 바뀌되 담당자가 직접 고른
 * 뒤에는 따라가지 않는다 (아래 `setField` 의 chipManual) — 손으로 정한 값을 자동 규칙이
 * 덮으면 그 화면은 못 믿을 화면이 된다.
 *
 * **배지가 ⚙ 에서 ● 로 왔다** (2026-08-20 ⚙ 읽기 전용 → 2026-08-24 ⚙ 이면서 열림 →
 * 2026-08-25 ●, 사용자 요청). 가운데 단계는 「사람이 넣지 않는 값」이라는 배지와 열려 있는
 * 칸이 한 자리에서 서로 반대되는 말을 했다. 자동으로 채워진다는 사실은 배지가 아니라
 * 칸 밑 한 줄이 적는다 (fields.js 의 `cat`).
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

const DISTRICT_FILTER = [{ value: "", label: "전체 골목형 상점가" }].concat(DISTRICT_OPTIONS);

/* 등록일시를 펴는 `createdAtOf` 가 여기 있었다 (2026-08-25 에 `data/sources.js` 로 옮겼다).
   같은 파일이 「노출 여부」와 「소속 골목형 상점가」의 빈자리도 함께 채운다 — 그 셋은 다
   **원천에 없는 값**이고, 화면마다 다르게 메우다가 목록과 폼이 갈렸다 (저쪽 머리말). */

export function Stores({ onToast }) {
  const { rows, upsert, remove, patch, patchMany } = useCollection("stores", STORE_ROWS, null, "점포");
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
    if (district && s.districtId !== district) return false;
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
          기준일은 [데이터 갱신 현황]이 다루는 값이라 여기서는 읽기만 하던 줄이었다. */}
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
        <Select value={district} options={DISTRICT_FILTER} onChange={e => setDistrict(e.target.value)} />
        <Select value={major} options={MAJOR_OPTIONS} onChange={e => setMajor(e.target.value)} />
        <Select value={onnuri} options={ONNURI_OPTIONS} onChange={e => setOnnuri(e.target.value)} />
        <ListSearch state={list0} placeholder="상호명 · 주소 · 업종 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 점포 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={ed.openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        /* 제목 한 줄이다 (2026-08-24, 사용자 요청). "검색어나 업종 필터를 지워 보세요"가
           붙어 있었는데, 조건을 방금 건 담당자는 그 조건이 무엇인지 알고 있고 그것을 거는
           칸은 바로 위 필터 줄에 값이 들어간 채로 서 있다 */
        empty={{ title: "조건에 맞는 점포가 없습니다." }}
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
          /* ── 주소는 두 줄 안에 들어간다 (2026-08-25, 사용자 요청) ─────────────
             폭을 정해 두지 않았더니 남는 자리를 상호명과 나눠 가졌는데, 앞의 고정 열
             여덟이 940px 을 먼저 가져가 노트북 폭에서는 둘 다 최소치까지 눌렸다 —
             그러면 주소가 낱말마다 끊겨 「처인구 / 포곡읍 / 에버랜드로 / 34」 넉 줄이
             된다. 표는 훑는 물건이라 한 줄이 넉 줄이 되면 한 화면에 스무 곳이 안 들어온다.

             190 은 **가장 흔한 주소가 한 줄에 들어가는 폭**이다(「처인구 포곡읍 둔전로
             42」). 가장 긴 것(「처인구 포곡읍 에버랜드로 34」)이 두 줄이고, 그보다 긴
             주소는 이 자료에 없다. `keep-all` 은 그 두 줄이 **띄어쓰기에서** 갈라지게
             한다 — 없으면 「에버랜드」와 「로」가 갈린다. */
          { key: "addr", label: "도로명주소", width: 190, sortable: true,
            render: s => <span style={{ wordBreak: "keep-all" }}>{s.addr}</span> },
          /* 90 → 80. 머리글(「조회」+ 정렬 꺾쇠)이 차지하는 폭이 바닥이라 더는 못 줄인다.
             다섯 자리 수(「12,345」)도 이 폭에 든다 */
          { key: "views", label: "조회", width: 80, align: "right", sortable: true,
            render: s => <span style={{ fontVariantNumeric: "tabular-nums" }}>{Number(s.views || 0).toLocaleString("ko-KR")}</span> },
          /* 104 는 목록 다섯이 함께 쓰는 값이다 (상점가 · 공공시설 · 축제도 같다).
             여기서만 좁히면 화면을 옮길 때 같은 열이 자리를 바꾼다 — 주소에 쓸 폭은
             조회 칸에서 낸다 */
          { key: "visible", label: "노출 여부", width: 104, align: "center",
            render: s => (
              <Switch checked={s.visible} aria-label={`${s.name} 노출 여부`}
                onChange={() => patch(s.id, { visible: !s.visible }, s.name)} />
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
        /* 「점포 수정」에서 고쳤다 (2026-08-25, 사용자 요청) — 화면 이름이 「점포 정보
           관리」라 창 제목도 같은 말로 받는다. 등록 쪽은 [점포 등록] 단추에서 열리므로
           그 단추와 같은 말로 둔다 */
        title={ed.draft && ed.draft.isNew ? "점포 등록" : "점포 정보 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {/* 값을 손보지 않고 그대로 넘긴다 (2026-08-25) — 전에는 여기서 `createdAt` 을
            끼워 넣었는데, 그러면 **화면에 보이는 값이 폼 안에는 없는** 상태가 된다.
            지금은 표가 이미 채워서 준다 (`data/sources.js`) */}
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values}
            errors={ed.errors} onChange={setField}
            onAddress={(key, picked) => ed.setMany({ [key]: picked.addr, lat: picked.lat, lng: picked.lng })}
            /* 점포도 지도에 핀으로 찍힌다 — 상점가 탭의 335개 마커가 이 좌표다.
               공공시설 폼과 같은 부품, 같은 자리(주소 바로 아래)를 쓴다 */
            slots={{
              coord: (
                <CoordField key="coord" lat={ed.draft.values.lat} lng={ed.draft.values.lng}
                  name={ed.draft.values.name} appKey={KAKAO_APP_KEY}
                  onChange={c => ed.setMany({ lat: fixCoord(c.lat), lng: fixCoord(c.lng) })} />
              ),
            }}
            /* 업종 칩 설명 두 문장을 여기서 뺐다 (2026-08-24, 사용자 요청).
               「대·중·소분류에서 자동으로 정해집니다」는 이제 **칩 칸 자기 밑에** 적혀
               있고, 같은 말을 폼 맨 아래에 한 번 더 적으면 담당자가 두 줄을 견주게 된다
               (명세서 화면 문구 원칙). 「직접 고르면 그때부터 따라가지 않습니다」는 규칙의
               속사정이라 더더욱 여기 있을 이유가 없다 — 담당자가 하는 일은 칩을 고르는
               것이고, 고른 값이 그대로 남는 것은 당연한 쪽이다. */
            extra={
              <div style={{ gridColumn: "1 / -1" }}>
                <Notice tone="neutral" size="sm">
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
