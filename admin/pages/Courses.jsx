import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Button, Select, Switch, Badge, Pagination,
  Notice, Repeater, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { DISTRICTS, CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { COURSE_ROWS, STORE_ROWS } from "../data/sources.js";
import { COURSE_FIELDS, COURSE_STOP_COLUMNS, DISTRICT_OPTIONS, storeOptionsOf, missingInRows } from "../data/fields.js";
import { useCollection, readCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M09 골목 한바퀴 코스 목록 · M10 코스 등록·수정 — 3건.
 *
 * ── 이 화면이 왜 생겼나 (2026-08-25, 사용자 요청) ────────────────────────────
 * 코스는 지금까지 **자료가 아니라 계산**이었다. 300~500m 밴드에서 세 축(업종 · 온누리 ·
 * 조건 없음)으로 갈라 각각 가까운 순 넷을 잇는다 (U-DC-03, dunjeon.js 의 COURSE_PLAN).
 * 시민용 명세서 6장이 그 자리를 열어 두었다 — "자동 생성 **또는 관리자 큐레이션**. 현재
 * 화면은 자동 생성 쪽으로 서 있다. 큐레이션으로 결정되면 이 규칙 한 블록만 서버 응답으로
 * 바꾼다." 이 화면이 그 결정이다.
 *
 * 규칙이 뽑는 코스는 **가깝다**는 것 말고는 아무 뜻이 없다. 「이 골목에서 이 넷을 이 차례로
 * 돌면 좋다」는 판단은 담당자와 상인회가 하는 것이고, 그 판단을 넣을 자리가 없어서 규칙이
 * 대신하고 있었다.
 *
 * ── 저장하는 것은 **점포의 id 와 그 차례**뿐이다 ────────────────────────────
 * 이름·업종·좌표·거리를 함께 굳히지 않는다. 그것들은 점포 표가 답하고, 굳혀 두면 점포를
 * 고쳤을 때 코스만 옛 값을 들고 남는다. 도보 시간과 총 거리도 없다 — **QR 지점에서 재는
 * 값**이라 시민 화면이 그 자리에서 계산한다 (coursePlan.js). 여기서 받아 두면 담당자가 적은
 * 「12분」과 화면이 잰 「9분」이 함께 서게 되고, 어느 쪽이 맞는지 화면이 답하지 못한다.
 *
 * ── 코스에 넣는 점포는 **고른 상점가의 것**만이다 ──────────────────────────
 * 335곳 전체를 늘어놓으면 다른 상점가의 가게가 코스에 들어갈 수 있고, 그 코스는 시민
 * 화면에서 걸을 수 없는 코스가 된다. 상점가를 바꾸면 이미 고른 줄이 그 상점가에 없는
 * 가게일 수 있으므로 **지우지 않고 알린다** (아래 strayCount) — 담당자가 무엇을 잃는지
 * 보고 나서 정한다.
 *
 * ── 점포는 **검색해서 고른다** (2026-08-25 오후, 사용자 요청) ────────────────
 * 한 상점가에 335곳이라 고르개 하나에 넣으면 담당자가 목록을 손가락으로 훑는다.
 * 「김밥」처럼 상호의 한 토막으로 찾을 수 있어야 한다 (design-systems 의 OptionPicker).
 *
 * ── 차례는 **끌어서** 바꾼다 (2026-08-25 오후, 사용자 요청) ──────────────────
 * 시민 화면 S08 이 코스 순서를 바꾸는 방식과 같다. 같은 일을 두 화면이 다른 손짓으로
 * 하면 담당자가 자기가 만든 화면을 쓸 때 한 번 더 배워야 한다 (`Repeater` 의 `ordered`).
 *
 * ── 더미 데이터의 한계를 화면이 적는다 ──────────────────────────────────────
 * 점포 335곳이 전부 둔전 소속이다 (data/sources.js). 그래서 다른 상점가를 고르면 고를
 * 점포가 하나도 없는데, 그 사실을 적지 않으면 빈 칸 앞에서 담당자가 화면이 고장난
 * 줄로 읽는다.
 */

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});
const DISTRICT_FILTER = [{ value: "", label: "전체 골목형 상점가" }].concat(DISTRICT_OPTIONS);

/* 코스 하나에 넣는 곳수. **넷으로 고정이다** (2026-08-25 오후, 사용자 요청).
   전에는 「최소 셋」이었다 — 시민 화면이 셋보다 적은 코스를 그리지 않는다는 데서 온
   수인데(dunjeon.js 의 `.filter(c => c.stops.length >= 3)`), 그것은 **버리는 기준**이지
   코스의 길이가 아니다. 시민 화면이 실제로 그리는 코스는 넷짜리다 (①②③④ · COURSE_PLAN
   이 가까운 순 넷을 잇는다). 하한만 적어 두면 셋짜리와 여섯짜리 코스가 섞여 저장되고,
   둘러보기 탭에서 코스 카드마다 길이가 달라진다.

   그래서 이 수는 하한이 아니라 **틀**이다 (2026-08-25 오후, 사용자 요청): 빈 줄 넷이
   처음부터 서 있고 [점포 추가]도 휴지통도 없다 (`Repeater` 의 `fixedRows`). 담당자가
   하는 일은 넷을 고르는 것이지 **넷이라는 수를 손으로 맞추는 것**이 아니다. */
const COURSE_STOPS = 4;

/* 넷을 채워 연다 — 모자라면 빈 줄로, 넘치면 잘라서. 옛 자료나 서버가 다른 길이를 들고
   와도 화면에서는 늘 넷이다. 자르는 쪽은 그 값을 화면이 보여주지 못한 채 저장하게 되므로
   **저장할 때가 아니라 열 때** 한다 — 담당자가 무엇을 들고 저장하는지 보고 있어야 한다 */
const stopsOfFour = stops => {
  const out = (Array.isArray(stops) ? stops : []).slice(0, COURSE_STOPS);
  while (out.length < COURSE_STOPS) out.push({ storeId: "" });
  return out;
};

export function Courses({ onToast }) {
  const { rows, upsert, patch, patchMany } = useCollection("courses", COURSE_ROWS, null, "골목 한바퀴 코스");
  const [district, setDistrict] = React.useState("");
  const list0 = useListState([district]);

  /* 점포는 **덮개 위의 지금 값**을 읽는다 — 점포 관리에서 상호를 고치거나 한 곳을 지웠으면
     여기 고르개에도 그대로 반영되어야 한다 (`readCollection` 은 목록 화면들이 서로의 값을
     들여다볼 때 쓰는 길이다. Districts 가 점포수를 셀 때와 같다) */
  const storeRows = readCollection("stores", STORE_ROWS);
  const storeById = React.useMemo(
    () => storeRows.reduce((o, s) => { o[s.id] = s; return o; }, {}), [storeRows]);

  const ed = useRecordEditor({
    fieldsFor: () => COURSE_FIELDS,
    /* 새 코스는 **지금 걸어 둔 상점가**로 시작한다. 필터를 걸어 그 상점가를 보고 있다가
       [코스 등록]을 누른 것이므로, 빈 칸을 다시 고르게 할 이유가 없다.
       필터가 [전체]면 점포가 실제로 있는 상점가로 연다 (점포 관리의 새 점포와 같은 값) —
       목록의 첫 줄로 열면 고를 점포가 없는 상점가에서 시작할 수 있다 */
    initial: () => ({
      districtId: district || CURRENT_DISTRICT_ID, visible: true,
      /* 등록 창도 **빈 줄 넷으로 열린다** — [점포 추가]가 없으니 여기서 세워 두지 않으면
         고를 자리 자체가 없다 */
      stops: stopsOfFour([]),
    }),
    onSave: values => upsert(values),
    /* `onRemove` 가 여기 있었다 (2026-08-25 오후) — [삭제]가 없어졌다 */
    onToast, label: "골목 한바퀴 코스",
    /* 항목 하나만 봐서는 알 수 없는 검사 둘.
       「넷인가」는 검사에서 빠졌다 (2026-08-25 오후) — 넷이 아닌 상태를 만들 길이 화면에
       없어졌다. 빈 줄은 아래 `missingInRows` 가 「n번째 줄의 점포를 골라 주세요」로 잡는다 */
    extraValidate: v => {
      const stops = v.stops || [];
      const gone = missingInRows(COURSE_STOP_COLUMNS, stops);
      if (gone) return { stops: gone };
      /* 같은 가게를 두 번 들르는 코스는 코스가 아니다. 넷 중 둘이 같으면 시민 화면의
         ①②③④ 중 두 자리에 같은 이름이 서고, 지도에서는 핀 하나에 순번 둘이 겹친다 */
      const seen = new Set();
      for (let i = 0; i < stops.length; i += 1) {
        const id = stops[i].storeId;
        if (seen.has(id)) {
          const s = storeById[id];
          return { stops: `${i + 1}번째 줄의 ${s ? s.name : id} 이(가) 앞줄에 이미 있습니다.` };
        }
        seen.add(id);
      }
      return {};
    },
  });

  /* 수정 창도 늘 넷으로 연다 (위 stopsOfFour). 씨앗 자료는 전부 넷이지만, 넷이 아닌
     코스가 어디선가 들어와도 담당자가 마주하는 것은 늘 같은 틀이어야 한다 — 줄을 더하고
     빼는 단추가 없으므로 그때 고칠 길이 화면에 없다 */
  const openEdit = row => ed.openEdit({ ...row, stops: stopsOfFour(row.stops) });

  const draft = ed.draft ? ed.draft.values : null;

  /* 검색 선택지 — 고른 상점가의 점포만. 상점가를 바꾸면 그 자리에서 다시 만들어진다 */
  const stopColumns = React.useMemo(() => {
    const options = storeOptionsOf(storeRows, draft ? draft.districtId : "");
    return COURSE_STOP_COLUMNS.map(c => (c.type === "picker" ? { ...c, options } : c));
  }, [storeRows, draft && draft.districtId]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* 고른 상점가에 없는 줄이 몇인가. 상점가를 바꿨을 때만 생긴다 — 그 줄들은 선택지에
     없어 **빈 칸으로 보이는데 값은 남아 있다.** 지우지 않고 세어서 알린다 */
  const strayCount = React.useMemo(() => {
    if (!draft) return 0;
    return (draft.stops || []).filter(r => {
      const s = r.storeId && storeById[r.storeId];
      return s && s.districtId !== draft.districtId;
    }).length;
  }, [draft, storeById]);

  const pickableCount = React.useMemo(
    () => (draft ? storeRows.filter(s => s.districtId === draft.districtId).length : 0),
    [storeRows, draft && draft.districtId],   // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filtered = rows.filter(c => {
    if (district && c.districtId !== district) return false;
    if (!list0.term) return true;
    /* **코스명만 본다** (2026-08-26, 사용자 요청). 소속 상점가는 왼쪽 고르개가 하고,
       설명 줄까지 훑으면 이름과 한 글자도 겹치지 않는 코스가 목록에 남는다 */
    return c.name.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  const bulkVisible = on => {
    patchMany(list0.selected.map(id => [id, { visible: on }]), `골목 한바퀴 코스 ${on ? "노출" : "숨김"}`);
    onToast(`${list0.selected.length}건을 ${on ? "노출" : "숨김"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  /* 목록의 「코스」 칸 — 수만 적지 않고 **차례대로 이름을 적는다.** 이 화면에서
     코스가 코스인 이유가 그 목록이고, 「4곳」만 서 있으면 어느 코스가 어디를 도는지
     알려면 세 개를 다 열어 봐야 한다. 길면 뒤를 줄이되 **몇 곳인지는 남긴다** */
  const stopsOf = c => {
    const names = (c.stops || []).map(r => {
      const s = storeById[r.storeId];
      return s ? s.name : null;
    });
    if (!names.length) return null;
    const head = names.slice(0, 2).filter(Boolean).join(", ");
    return names.length > 2 ? `${head} 외 ${names.length - 2}곳` : head;
  };

  return (
    <>
      <PageHeader title="골목 한바퀴 코스 관리" count={`${filtered.length}건`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>코스 등록</Button>} />

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
        <ListSearch state={list0} placeholder="코스명 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 골목 한바퀴 코스 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        /* 넷이 아니면 목록에서 바로 보여야 그 줄을 열어 채우게 된다 (좌표 없는 점포를
           표시하는 것과 같은 자리다). 옛 자료에는 넷이 아닌 코스가 있을 수 있다 —
           화면이 넷만 저장하게 된 것은 이번 판부터다 */
        rowTone={c => ((c.stops || []).length !== COURSE_STOPS ? "warning" : null)}
        empty={{ title: "조건에 맞는 코스가 없습니다." }}
        columns={[
          { key: "name", label: "코스명", width: 190, sortable: true },
          { key: "districtId", label: "골목형 상점가", width: 190, sortable: true,
            render: c => DISTRICT_NAME[c.districtId] || EMPTY_MARK },
          { key: "stops", label: "코스", sortable: true,
            sortValue: c => (c.stops || []).length,
            render: c => (
              <Cell>
                <Badge tone={(c.stops || []).length !== COURSE_STOPS ? "danger" : "neutral"} size="sm">
                  {(c.stops || []).length}곳
                </Badge>
                {stopsOf(c) || <span style={{ color: "var(--text-muted)" }}>{EMPTY_MARK}</span>}
              </Cell>
            ) },
          { key: "visible", label: "노출 여부", width: 104, align: "center",
            render: c => (
              <Switch checked={c.visible} aria-label={`${c.name} 노출 여부`}
                onChange={() => patch(c.id, { visible: !c.visible }, c.name)} />
            ) },
          /* 「관리」 열이 여기 있었다 — 안에 [삭제] 하나뿐이라 열째 없앴다
             (2026-08-25 오후, 사용자 요청). **[코스 등록]은 남는다** — 코스는 원천 자료가
             아니라 담당자가 짜는 것이다. 내리는 일은 [노출 여부]가 한다 */
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "골목 한바퀴 코스 등록" : "골목 한바퀴 코스 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            extra={
              <>
                {/* 고를 것이 없는 고르개 앞에 담당자를 세우지 않는다. 더미 데이터가
                    둔전 한 곳뿐이라는 것은 **우리 쪽 사정**이지만, 이 순간 담당자가
                    겪는 것은 「눌러도 아무것도 안 나오는 칸」이다 */}
                {pickableCount === 0 ? (
                  <Notice tone="warning" size="sm" title="이 골목형 상점가에 등록된 점포가 없습니다"
                    style={{ gridColumn: "1 / -1" }}>
                    코스는 소속 점포 중에서 고릅니다. 점포 정보 관리에서 이 상점가의 점포를
                    먼저 등록해 주세요.
                  </Notice>
                ) : null}

                {/* 상점가를 바꾸면 이미 고른 줄이 남는다 — 지우지 않고 알린다.
                    조용히 지우면 담당자가 「고쳤더니 코스가 비었다」를 겪고, 무엇이
                    없어졌는지 화면 어디에도 없다 */}
                {strayCount ? (
                  <Notice tone="warning" size="sm"
                    title={`다른 골목형 상점가의 점포가 ${strayCount}곳 남아 있습니다`}
                    style={{ gridColumn: "1 / -1" }}>
                    상점가를 바꾸기 전에 고른 점포입니다. 아래 목록에서 지우거나 이 상점가의
                    점포로 다시 골라 주세요.
                  </Notice>
                ) : null}

                <Repeater
                  title="코스" ordered
                  columns={stopColumns}
                  rows={draft.stops || []}
                  onChange={v => ed.set("stops", v)}
                  newRow={() => ({ storeId: "" })}
                  /* 넷이 늘 서 있고 더하거나 지우지 않는다 — [점포 추가]도 휴지통도 없다.
                     그래서 지울 때 이름을 부르던 `nameKey` 도, [추가] 단추 글자(`addLabel`)도
                     여기서는 쓸 데가 없어졌다 */
                  fixedRows={COURSE_STOPS} error={ed.errors.stops}
                  /* 한 줄로 줄였다 (2026-08-25 오후, 사용자 요청). 적혀 있던 나머지는
                     전부 **화면에 이미 서 있는 것**이다 — 순번은 줄마다 붙어 있고,
                     곳수는 머리의 「4건」이며, 구간 거리와 도보 시간은 이 화면에 없는
                     값이라 담당자가 여기서 할 일과 상관이 없다. */
                  note="손잡이 아이콘을 통해 차례를 조정할 수 있습니다." />
              </>
            } />
        ) : null}
      </EditorModal>

      {/* 삭제 확인 창이 여기 있었다 (2026-08-25 오후 삭제). 그 각주의 마지막 줄 —
          「잠시 내려 두는 것이라면 [노출 여부]를 해제해주세요」 — 이 이제 유일한 길이다 */}
    </>
  );
}

export default Courses;
