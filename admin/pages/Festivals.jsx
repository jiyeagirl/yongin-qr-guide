import React from "react";
import {
  PageHeader, Toolbar, DataTable, Button, Select, Badge, Switch,
  Pagination, AssetPicker, Repeater, Mascot, RequiredBadge,
  FESTIVAL_STATES, festivalBadge, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { DISTRICTS } from "../../screens/main/data/districts.js";
import { FESTIVAL_ROWS } from "../data/sources.js";
import { TODAY } from "../../screens/main/config.js";
import { FESTIVAL_FIELDS, PROGRAM_COLUMNS, BOOTH_COLUMNS, missingInRows } from "../data/fields.js";
import { CHARACTER_ASSETS, CHARACTER_DEFAULT, ASSET_BASE } from "../data/assets.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";
/* 여기서 `./RemovedItems.jsx` 의 「전체 | 삭제된 항목」 탭을 가져왔다 (2026-08-24 삭제).
   삭제가 영구가 되면서 되돌리는 자리가 통째로 없어졌다 — `data/store.js` 머리말 참조 */

/* M07 축제 목록 · M08 축제 등록·수정 — 6건.
 *
 * ── 상태를 입력받지 않는다 (명세서 2-3) ────────────────────────────────────
 * 진행 예정 · 진행 중 · 완료는 시작일·종료일에서 나오는 값이다. 담당자가 고르게 하면
 * 축제가 끝나도 "진행 중"이 남고, 그것을 내리는 일이 또 하나의 할 일이 된다.
 * **종료일이 지나도 삭제하거나 숨기지 않고 완료 카테고리로 옮겨** 계속 노출한다.
 *
 * 상태 이름이 명세서와 시민 화면에서 조금 다르다 — 명세서는 "진행 예정 · 진행 중 · 완료",
 * 시민 화면은 "예정 · 진행중 · 종료"다. **가리키는 것은 같은 셋**이고, 이름표는 시민 화면의
 * 것을 쓴다: 담당자가 관리자에서 본 낱말과 실제 화면의 낱말이 다르면 같은 축제를 두 이름으로
 * 말하게 된다.
 *
 * ── 「노출 카테고리」 열을 없앴다 (2026-08-24) ───────────────────────────────
 * 명세서 2-3 의 진행 / 완료를 상태 옆에 열로 세워 두었다. 그런데 그 값은 **상태에서
 * 한 글자도 더하지 않는다** — 종료면 완료, 나머지는 전부 진행이다. 담당자가 이미 읽은
 * 배지를 옆 칸에서 다른 낱말로 한 번 더 말하고 있었고, 그 칸이 120px 을 쓰는 동안
 * 정작 손대는 칸(노출 여부·관리)이 오른쪽으로 밀렸다.
 *
 * 카테고리라는 개념 자체가 없어진 것은 아니다. 명세서 2-3 의 표는 그대로이고, 진행 /
 * 완료가 갈리는 자리는 시민 화면에 남아 있다 (둘러보기 탭은 진행만, S12 전체보기는 전부).
 * 이 화면에서 그것을 다시 적지 않을 뿐이다.
 *
 * ── 조아용 이미지가 필수인 이유 ─────────────────────────────────────────────
 * 축제 자료가 이미지 파일로 제공되고 수기 입력이 전제라 카드에 넣을 사진이 없다.
 * 조아용 에셋이 그 자리를 대신하고, 그래서 비워둘 수 없다 (명세서 2-3).
 * 다른 축제가 이미 쓰는 그림에는 표시가 붙는다 — 6건이 모두 같은 그림이면 둘러보기 탭이
 * 단조로워지는데, 등록하는 사람은 자기 축제 하나만 보고 있어 그 사실을 알 방법이 없다.
 *
 * ── 프로그램·부스는 그냥 선택 항목이다 (2026-08-20 변경) ────────────────────
 * 명세서에서 이 둘의 우선순위는 `C`(자료 확보 시)인데, 화면에서는 그 사실을 적지 않는다.
 * 자료를 받을지 아직 모른다는 것은 **우리 쪽 사정**이고, 이 폼을 채우는 사람에게 그것은
 * "있으면 넣고 없으면 비운다"와 똑같이 행동한다 — 즉 선택 항목이다. 「조건부 · 자료 확보 시」
 * 배지와 「아래 두 항목은 조건부입니다」 띠를 걷어냈다.
 *
 * 부스 배치도 이미지(V-06)도 함께 뺐다. 배치도 없이 좌표만으로 부스 목록은 그대로 서고,
 * 이미지 한 장 올리는 일이 이 폼에서 가장 무거운 칸이었는데 정작 그 그림이 시민 화면
 * 어디에 어떻게 놓이는지가 아직 정해지지 않았다.
 */

const STATE_OPTIONS = [{ value: "", label: "전체 상태" }]
  .concat(FESTIVAL_STATES.map(v => ({ value: v, label: v })));

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});

/* 날짜에서 상태를 낸다. ISO 문자열이라 사전 순 비교가 곧 날짜 비교다.
   기준은 config.TODAY — 검수용 상수이며 실서비스에서는 서버 시각이 이 자리를 대신한다. */
function stateOf(f) {
  if (!f.start || !f.end) return "예정";
  if (f.end < TODAY) return "종료";
  if (f.start > TODAY) return "예정";
  return "진행중";
}

/* 명세서 2-3 의 노출 카테고리(진행 / 완료)를 내던 `categoryOf` 가 여기 있었다.
   2026-08-24 에 없앴다 — 아래 머리말 참조. */

/* ── 1:N 목록의 일시 칸은 **연도를 묻지 않는다** (2026-08-26, 사용자 요청) ──────────
   전에는 `datetime-local` 한 칸이 연·월·일과 시각을 함께 받고, 여기서 `min`/`max` 로
   기간 밖의 날을 흐리게 했다. 그런데 **연도는 언제나 위 폼의 시작일과 같은 해**다 —
   답이 정해진 것을 묻는 칸이었다.

   이제 이 함수가 **축제 기간의 날들을 그대로 목록으로 만들어** 넘기고, 칸은 「어느 날」과
   「몇 시」 둘만 묻는다 (`Repeater` 의 `daytime`). 축제가 하루면 고를 것이 하나뿐이라
   사실상 시각만 넣게 되고, 사흘이어도 셋이다. **기간을 넘어가지 못하는 것이 min/max 보다
   강해진다** — 달력은 밖의 날을 흐리게 보여줄 뿐이지만 목록에는 그 날이 없다.

   여러 해에 걸치는 축제(12/28~1/3)도 이 길로 저절로 풀린다. 「연도가 같다」는 것은
   대개 맞지만 늘 맞지는 않은 짐작인데, **날을 통째로 목록으로 만들면 짐작할 것이 없다.**

   기간이 아직 비어 있으면 목록을 넘기지 않는다 — 그때 칸은 종전 `datetime-local` 로
   떨어진다 (고를 날이 하나도 없는 고르개보다는 낫다). */
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/* 날짜를 **UTC 자정으로 못박고 UTC 로만 셈한다.** 하루를 더하는 일과 요일을 내는 일이
   둘 다 시간대에 걸리는 계산이라, 한쪽만 못박으면 브라우저 시간대에 따라 요일이 하루씩
   밀린다. `Date.UTC` 로 만들고 `getUTCDate`/`getUTCDay` 로만 읽으면 걸릴 것이 없다. */
function daysBetween(start, end) {
  const at = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const last = at(end);
  const out = [];
  for (const d = new Date(at(start)); d.getTime() <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    out.push({ value: iso, label: `${+iso.slice(5, 7)}.${+iso.slice(8, 10)} (${DOW[d.getUTCDay()]})` });
    /* 종료일을 시작일보다 앞으로 적어 둔 중간 상태에서는 빈 목록이 나오고, 그때는
       위 규칙대로 종전 칸으로 떨어진다. 400 은 그 밖의 실수를 막는 빗장이다 */
    if (out.length > 400) break;
  }
  return out;
}

function withPeriod(columns, v) {
  if (!v.start || !v.end) return columns;
  const days = daysBetween(v.start, v.end);
  if (!days.length) return columns;
  return columns.map(c => (c.type === "daytime" ? { ...c, days } : c));
}

function periodOf(f) {
  if (!f.start) return EMPTY_MARK;
  const short = s => s.slice(5).replace("-", ".");
  return f.end && f.end !== f.start ? `${short(f.start)} ~ ${short(f.end)}` : short(f.start);
}

export function Festivals({ onToast }) {
  const { rows, upsert, patch, patchMany } = useCollection("festivals", FESTIVAL_ROWS, null, "축제");
  const [state, setState] = React.useState("");
  const list0 = useListState([state]);

  const ed = useRecordEditor({
    fieldsFor: () => FESTIVAL_FIELDS,
    initial: () => ({
      districtId: DISTRICTS[0] ? DISTRICTS[0].id : "",
      pose: CHARACTER_DEFAULT, visible: true, programs: [], booths: [],
    }),
    onSave: values => upsert(values),
    /* `onRemove` 가 여기 있었다 (2026-08-25 오후) — [삭제]가 없어졌다 */
    onToast, label: "축제",
    /* 항목 하나만 봐서는 알 수 없는 검사들 */
    extraValidate: v => {
      const bad = {};
      /* V-07 — 종료일 ≥ 시작일 (같은 날 허용) */
      if (v.start && v.end && v.end < v.start) bad.end = "종료일은 시작일과 같거나 이후여야 합니다.";
      if (!v.pose) bad.pose = "조아용 이미지를 골라 주세요.";
      /* 1:N 목록에도 같은 검사가 걸린다 (2026-08-24). 시각을 글자가 아니라 값으로 받게
         되면서 비로소 견줄 수 있게 된 검사다 — 「10.17 11:00」 이라는 글자끼리는 앞뒤를
         알 수 없었다. 오류는 줄 번호로 가리킨다: Repeater 는 칸마다 오류를 달지 못하고
         목록 하나에 한 줄을 다는데, 그 한 줄이 어느 줄 이야기인지 말해주지 않으면
         스무 줄짜리 목록에서 찾을 수가 없다. */
      const late = x => x.startAt && x.endAt && x.endAt < x.startAt;
      const p = (v.programs || []).findIndex(late);
      if (p >= 0) bad.programs = `${p + 1}번째 줄의 종료 일시가 시작 일시보다 빠릅니다.`;
      const b = (v.booths || []).findIndex(late);
      if (b >= 0) bad.booths = `${b + 1}번째 줄의 종료 일시가 시작 일시보다 빠릅니다.`;

      /* 필수 칸이 비었는지 (2026-08-24). **앞의 검사를 덮지 않는다** — 순서가 뒤집힌
         줄은 두 칸이 다 차 있다는 뜻이라 애초에 여기 걸리지 않지만, 다른 줄에서 둘이
         함께 걸렸을 때 무엇을 먼저 말할지는 정해 두어야 한다. 값이 없는 것이 값이
         어긋난 것보다 먼저다 — 채우고 나서야 앞뒤를 따질 수 있다. */
      const pm = missingInRows(PROGRAM_COLUMNS, v.programs);
      if (pm) bad.programs = pm;
      const bm = missingInRows(BOOTH_COLUMNS, v.booths);
      if (bm) bad.booths = bm;
      /* 「배치도 이미지가 필요합니다」 검사는 뺐다 (2026-08-20) — 배치도 칸 자체가
         없어져, 고칠 수 없는 것을 이유로 저장을 막는 검사가 되기 때문이다 */
      /* 「부스 번호 겹침」 검사도 함께 뺐다 (2026-08-20) — 번호 칸 자체가 없다.
         번호는 배치도 위의 점과 목록을 잇는 열쇠였고, 그 지도가 1차에 없다 */
      return bad;
    },
  });

  /* 어느 그림을 어느 축제가 쓰고 있나 — 지금 고치는 축제는 뺀다 (자기 자신은 겹침이 아니다) */
  const usedBy = React.useMemo(() => {
    const o = {};
    rows.forEach(f => {
      if (ed.draft && f.id === ed.draft.values.id) return;
      if (!f.pose) return;
      o[f.pose] = (o[f.pose] || []).concat(f.name);
    });
    return o;
  }, [rows, ed.draft]);

  /* 제목 아래 「전체 | 삭제된 항목 n」 탭이 있었다 (2026-08-24 삭제) — 삭제가 영구가
     되면서 되돌리는 자리가 없어졌다 (`data/store.js` 머리말) */
  const filtered = rows.filter(f => {
    if (state && stateOf(f) !== state) return false;
    if (!list0.term) return true;
    /* **축제명만 본다** (2026-08-26, 사용자 요청). 소속 상점가는 왼쪽 고르개가 하는
       일이고, 프로그램 본문까지 훑으면 축제명과 아무 글자도 겹치지 않는 축제가
       프로그램 한 줄 때문에 목록에 남는다 — 왜 걸렸는지 표에서 읽을 수 없는 행이다 */
    return f.name.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  /* 고르기와 일괄 처리 (2026-08-24 추가, 사용자 요청. 다른 목록 화면과 같은 규칙) —
     **삭제는 일괄로 두지 않는다.** 여기서 쓰이는 자리는 「지난 축제 여럿을 한 번에
     내리는」 일이다. 상태(진행중·예정·종료)는 오늘 기준 자동 판정이라 손댈 수 없고,
     담당자가 실제로 켜고 끄는 것은 노출뿐이다. */
  const bulkVisible = on => {
    patchMany(list0.selected.map(id => [id, { visible: on }]), `축제 ${on ? "노출" : "숨김"}`);
    onToast(`${list0.selected.length}건을 ${on ? "노출" : "숨김"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  return (
    <>
      {/* 제목 아래 설명을 두지 않는다 (2026-08-20, 사용자 요청) — 「상태는 오늘 기준으로
          자동 판정되며 직접 고를 수 없습니다」가 있었다. 고를 수 없다는 것은 **고르는 칸이
          없다는 사실**이 이미 말하고 있고, 없는 기능을 설명하는 줄이 목록보다 먼저 읽힌다. */}
      <PageHeader title="축제 정보 관리" count={`${filtered.length}건`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>축제 등록</Button>} />

      <Toolbar actions={list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkVisible(true)}>노출</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkVisible(false)}>숨김</Button>
        </>
      ) : null}>
        <Select value={state} options={STATE_OPTIONS} onChange={e => setState(e.target.value)} />
        <ListSearch state={list0} placeholder="축제명 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 축제 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={ed.openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        empty={{ title: "해당 상태의 축제가 없습니다." }}
        columns={[
          { key: "name", label: "축제명", sortable: true },
          { key: "pose", label: "조아용", width: 88, align: "center",
            render: f => (f.pose
              ? <Mascot pose={f.pose} size={32} base={ASSET_BASE} alt="" />
              : <Badge tone="danger" size="sm">없음</Badge>) },
          { key: "districtId", label: "상권명", width: 190, sortable: true,
            render: f => DISTRICT_NAME[f.districtId] || EMPTY_MARK },
          { key: "period", label: "기간", width: 150, render: periodOf, sortValue: f => f.start || "" },
          { key: "time", label: "시간", width: 120, render: f => f.time || EMPTY_MARK },
          { key: "state", label: "상태", width: 90, align: "center",
            render: f => <Badge size="sm" {...festivalBadge(stateOf(f))}>{stateOf(f)}</Badge>,
            sortValue: f => FESTIVAL_STATES.indexOf(stateOf(f)) },
          { key: "visible", label: "노출 여부", width: 104, align: "center",
            render: f => (
              <Switch checked={f.visible} aria-label={`${f.name} 노출 여부`}
                onChange={() => patch(f.id, { visible: !f.visible }, f.name)} />
            ) },
          /* 「관리」 열이 여기 있었다 — 안에 [삭제] 하나뿐이라 열째 없앴다
             (2026-08-25 오후, 사용자 요청). **[축제 등록]은 남는다** — 축제는 원천 자료가
             아니라 담당자가 이 화면에서 만드는 것이라 만들 자리가 있어야 한다. 다만 끝난
             축제를 치우는 일은 지우는 것이 아니라 [노출 여부]를 끄는 일이다: 지난 축제는
             기록이고, 내년에 같은 축제를 열 때 그 줄을 열어 날짜만 고치면 된다 */
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="xl"
        title={ed.draft && ed.draft.isNew ? "축제 등록" : "축제 수정"}
        description={ed.draft && !ed.draft.isNew
          ? `${ed.draft.values.name} · ${stateOf(ed.draft.values)}` : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            extra={
              <>
                <AssetPicker value={ed.draft.values.pose} onChange={v => ed.set("pose", v)}
                  assets={CHARACTER_ASSETS} usedBy={usedBy} base={ASSET_BASE} error={ed.errors.pose} />

                {/* ── 조건부 표시를 걷어냈다 (2026-08-20, 사용자 요청) ────────────
                       전에는 두 목록 위에 「아래 두 항목은 조건부입니다」 띠가 서고 제목마다
                       「조건부 · 자료 확보 시」 배지가 붙었다. 자료를 받을지 아직 모른다는
                       것은 **우리 쪽 사정**이지 이 칸을 채우는 사람이 알아야 할 일이 아니다.
                       담당자에게 이 둘은 그냥 "있으면 넣고 없으면 비우는" 선택 항목이다. */}
                {/* 날짜 고르개를 축제 기간 안으로 묶는다 (2026-08-24). 위 폼의 시작일·종료일이
                    이미 정해져 있으므로, 달력이 그 밖의 날을 흐리게 두면 담당자가 다른 달을
                    잘못 고르는 일 자체가 없어진다. 기간을 아직 안 넣었으면 묶지 않는다 —
                    아무 날도 못 고르는 달력이 되는 쪽이 나쁘다. */}
                {/* 「선택」 배지를 단다 (2026-08-25, 사용자 요청). 두 목록은 명세서의
                    조건부 항목이라(`C` — 자료가 오면 채운다) 축제 하나에 한 줄도 없을 수
                    있는데, 위 폼의 칸들이 전부 필수/선택을 달고 있는 사이에서 이 둘만
                    아무 말이 없었다. 게다가 안에 별표 붙은 열이 있어(시작·종료·이름)
                    **목록 자체가 필수로 읽혔다** — 별표는 「줄을 만들었으면 채우라」는
                    뜻이지 「줄을 만들라」가 아니다. 폼의 다른 칸과 같은 배지, 같은 말을
                    쓴다 (design-systems 의 RequiredBadge). */}
                <Repeater
                  title="프로그램 일정" badge={<RequiredBadge />}
                  columns={withPeriod(PROGRAM_COLUMNS, ed.draft.values)}
                  rows={ed.draft.values.programs || []}
                  onChange={p => ed.set("programs", p)}
                  /* 지울 때 「무엇을」에 해당하는 칸 — 프로그램은 `title` 이다 (부스는 `name`) */
                  nameKey="title"
                  addLabel="프로그램 추가" error={ed.errors.programs}
                  note="작성하신 순서에 따라 사용자 화면에 노출됩니다." />

                {/* 부스는 **글로 안내한다** (2026-08-20). 좌표 칸 둘과 배치도 이미지(V-06),
                    그리고 지도 시절의 「번호」·「유형」까지 뺐다 — 세 칸이 그대로 시민 화면의
                    한 줄이 된다. 자세한 사정은 data/fields.js 의 BOOTH_COLUMNS 주석. */}
                <Repeater
                  title="부스 위치" badge={<RequiredBadge />}
                  columns={withPeriod(BOOTH_COLUMNS, ed.draft.values)}
                  rows={ed.draft.values.booths || []}
                  onChange={b => ed.set("booths", b)}
                  addLabel="부스 추가" error={ed.errors.booths}
                  note="작성하신 순서에 따라 사용자 화면에 노출됩니다." />
              </>
            } />
        ) : null}
      </EditorModal>

      {/* 삭제 확인 창이 여기 있었다 (2026-08-25 오후 삭제). 그 각주가 적던 것 —
          「종료된 축제는 삭제하지 않고 [완료] 카테고리로 이동하여 계속 노출합니다」 —
          은 이제 규칙이 아니라 **유일한 길**이다: 지우는 자리가 없으므로 끝난 축제는
          그대로 완료로 넘어가고, 잘못 등록한 줄은 [노출 여부]를 끈다 */}
    </>
  );
}

export default Festivals;
