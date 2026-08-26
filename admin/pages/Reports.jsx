import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, Button, Select, Badge, Pagination,
  InfoList, Textarea, EMPTY_MARK,
} from "../../design-systems/admin.js";
/* `isOpen`(접수·확인중인가)을 함께 가져왔었다 — 누적 강조가 세던 조건이라 함께 나갔다.
   그 함수는 좌측 메뉴 [오류신고 관리] 옆의 미처리 배지가 계속 쓴다 (`AdminApp.jsx`) */
import { REPORTS } from "../data/reports.js";
import {
  REPORT_STATES, REPORT_TYPES, REPORT_TARGET_TYPES, REPORT_CLOSING_STATES,
} from "../data/fields.js";
import { readAccounts } from "../data/account.js";
import { useCollection } from "../data/store.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";

/* M13 오류신고 관리 (명세서 5장).
 *
 * ── 여기만 등록 버튼이 없다 ─────────────────────────────────────────────────
 * 다른 목록은 담당자가 자료를 넣는 곳이지만, 이 목록은 **시민이 만든다** (S10).
 * 관리자가 할 수 있는 일은 상태를 옮기고 답을 적는 것뿐이다. 그래서 [등록]도 [삭제]도 없다 —
 * 접수된 신고를 관리자가 지울 수 있으면 그 목록은 더 이상 접수 기록이 아니다.
 * 잘못 들어온 건은 지우는 대신 「반려」나 「중복」으로 옮긴다.
 *
 * ── 회신을 하지 않는다 (2026-08-24, 사용자 요청) ────────────────────────────
 * 「회신처」와 「회신 내용」 두 칸이 여기 있었다. **둘 다 뺐다.**
 *
 * 시민 쪽은 처음부터 그랬다 — S10 신고 폼은 연락처 칸을 열지 않고(2026-08-18 결정),
 * 접수 화면이 "개별 답변은 어려운 점 양해 부탁드립니다"라고 적는다. 그러니 이 화면의
 * 회신처는 **들어올 리 없는 값**이었고(더미에만 있었다), 회신 내용은 **아무 데도 가지
 * 않는 글**이었다. 담당자가 정성껏 답을 적으면 그것은 관리자 화면에만 남는다.
 *
 * 닫을 때 근거를 남기라는 요구(명세서 5-2 의 ◐)는 **내부 메모로 옮겼다.** 없앤 것은
 * 답장이지 기록이 아니다 — 처리완료·반려는 이 신고를 더 보지 않겠다는 결정이라,
 * 왜 그렇게 정했는지가 없으면 석 달 뒤 같은 신고가 다시 들어왔을 때 처음부터 다시 본다.
 *
 * ── 누적 강조를 없앴다 (2026-08-25 오후, 사용자 요청) ───────────────────────
 * 같은 대상에 미처리 세 건이 쌓이면 **줄이 붉게 서고 접수번호 옆에 「3건 누적」 배지**가
 * 붙었으며, 상세를 열면 붉은 안내 상자가 「자료가 틀렸을 가능성이 큽니다」라고 적었다
 * (명세서 5장의 규칙이었다). 셋 다 없앴다.
 *
 * 이 표시가 하던 말은 **담당자가 이미 목록에서 읽는 것**이다 — 같은 대상 이름이 세 줄
 * 나란히 서 있는 것이 곧 그 사실이고, 대상으로 걸러 보면 몇 건인지도 그 자리에서 보인다.
 * 그 위에 붉은 줄과 배지를 얹으면 **끌 수 없는 표시가 목록에 상주한다**: 붉은색은
 * 「지금 손대라」는 말인데 신고 셋이 쌓인 것 자체는 담당자가 없앨 수 있는 상태가 아니고,
 * 처리 상태 칸이 이미 색으로 말하고 있어 한 줄에 서로 다른 두 색이 서게 된다.
 * 강조를 미처리만 세도록 좁혀 본 것이 하루 전인데(그 전에는 다 처리하고도 붉게 남았다),
 * 좁혀도 남는 문제가 그것이다.
 *
 * ── 개인정보 보관 문제가 함께 없어졌다 ──────────────────────────────────────
 * 명세서 5장의 "회신처는 개인정보이므로 처리 완료 후 90일 보관 뒤 자동 파기"는 화면이
 * 지킬 수 없는 조항이었다 — 파기는 서버 배치의 일이고 화면이 할 수 있는 것은 그 사실을
 * 적어 두는 것뿐이었다. 애초에 받지 않으니 **보관할 것도 파기할 것도 없다.**
 *
 * ── 미처리를 위에 둔다 ──────────────────────────────────────────────────────
 * 기본 차례가 접수일 역순이 아니라 **상태 먼저, 그 다음 최신순**이다. 순수 최신순이면
 * 오늘 들어온 처리완료 건이 사흘 묵은 미처리 건 위에 온다. 담당자가 이 화면을 여는 이유는
 * 목록을 훑기 위해서가 아니라 남은 일을 찾기 위해서다.
 */

const STATE_TONE = { 접수: "danger", 확인중: "warning", 처리완료: "success", 반려: "neutral", 중복: "neutral" };
const STATE_ORDER = { 접수: 0, 확인중: 1, 처리완료: 2, 반려: 3, 중복: 4 };

const opt = (list, all) => [{ value: "", label: all }].concat(list.map(v => ({ value: v, label: v })));

/* 대상 유형 → 그 자료를 고치는 화면 (명세서 5장 "상세에서 대상 데이터로 바로 이동")
   ── 화면 이름을 여기 적어 둔다 (2026-08-25, 사용자 요청) ────────────────────────
   전에는 대상 유형(점포 · 공공시설)에 「관리로 이동」을 붙여 버튼 글자를 지어냈다.
   그렇게 나온 「점포 관리로 이동」은 **왼쪽 메뉴에 없는 이름**이다 — 거기 서 있는 것은
   「점포 정보 관리」다. 누르면 가는 자리의 이름을 그 자리의 이름 그대로 적는다
   (AdminApp 의 NAV 라벨과 한 글자도 다르지 않아야 한다. 「상점가」가 아니라
   「골목형 상점가 정보 관리」인 것도 그래서다). */
const TARGET_PAGE = {
  공공시설: { page: "facilities", label: "공공시설 정보 관리" },
  점포: { page: "stores", label: "점포 정보 관리" },
  상점가: { page: "districts", label: "골목형 상점가 정보 관리" },
  축제: { page: "festivals", label: "축제 정보 관리" },
};

/* 누적 강조의 문턱값(`DUP_THRESHOLD = 3`)이 여기 있었다 (2026-08-25 오후 삭제 — 머리말) */

export function Reports({ onToast, onNavigate }) {
  const { rows, patch } = useCollection("reports", REPORTS, null, "오류신고");
  const [state, setState] = React.useState("");
  const [kind, setKind] = React.useState("");
  const [targetType, setTargetType] = React.useState("");
  const list0 = useListState([state, kind, targetType]);
  const [open, setOpen] = React.useState(null);
  const [draft, setDraft] = React.useState({});
  const [error, setError] = React.useState(null);

  /* 담당자는 **상세에서 지정하는 값**으로만 남는다. 목록 필터에서는 뺐다 (위 Toolbar 주석) */
  const accounts = readAccounts().filter(a => a.active !== false);
  const ASSIGNEE_OPTIONS = [{ value: "", label: "— 담당자 없음 —" }]
    .concat(accounts.map(a => ({ value: a.name, label: a.name })));

  /* 같은 대상에 남은 건을 세던 `dupCount` 와 `dupOf` 가 여기 있었다
     (2026-08-25 오후 삭제 — 머리말) */

  const filtered = React.useMemo(() => rows
    .filter(r => {
      if (state && r.state !== state) return false;
      if (kind && r.kind !== kind) return false;
      if (targetType && r.targetType !== targetType) return false;
      if (!list0.term) return true;
      /* **내용만 본다** (2026-08-26, 사용자 요청). 「내용 + 대상 + 접수번호」였다.
         대상 유형은 왼쪽 고르개가 이미 가르고, 대상 이름으로 훑는 일은 **그 자료를
         다루는 화면**의 몫이다 (상세의 [○○ 정보 관리로 이동]이 그 길이다).
         접수번호는 뺐지만 닿는 길이 없어지지는 않는다 — 「접수번호」 열이 정렬 가능한
         열이고 차례가 늘 같은 형식(rp-016)이라 눈으로 훑어 찾는다. */
      return r.body.includes(list0.term);
    })
    .sort((a, b) => (STATE_ORDER[a.state] - STATE_ORDER[b.state]) || b.at.localeCompare(a.at)),
  [rows, state, kind, targetType, list0.term]);

  const paged = list0.paginate(filtered);

  const openOne = r => { setOpen(r); setDraft({ ...r }); setError(null); };
  const close = () => { setOpen(null); setDraft({}); setError(null); };

  const save = () => {
    if (!open) return;
    /* ◐ 조건부 — 신고를 닫으려면 근거가 있어야 한다 (명세서 5-2. 회신 내용이 받던 자리를
       내부 메모가 이어받았다 — 머리말 참조) */
    if (REPORT_CLOSING_STATES.includes(draft.state) && !String(draft.memo || "").trim()) {
      /* 닫는 상태 둘(처리완료·반려)이 다 「로」를 받는다 — 조사를 고르는 자리가 아니다 */
      setError(`${draft.state}로 변경하려면 내부 메모를 입력해 주세요.`);
      return;
    }
    patch(open.id, {
      state: draft.state, assignee: draft.assignee || null,
      memo: String(draft.memo || "").trim() || null,
    }, open.id);
    onToast(`${open.id} 처리 내용을 저장했습니다.`);
    close();
  };

  /* ── 화면까지만 데려다 놓는다 (2026-08-25, 사용자 요청) ───────────────────────
     대상 한 건의 수정 창을 곧장 여는 길을 만들었다가 같은 판에서 걷어냈다. 신고가
     가리키는 자료와 이 화면의 목록이 늘 맞물리는 것이 아니다 — **대상 유형이 「기타」인
     신고**가 있고, 유형은 적혀 있어도 **대상 ID 가 비어 있는 신고**가 있다. 그러면 같은
     버튼이 어떤 신고에서는 창을 열고 어떤 신고에서는 목록에 내려놓는데, 그 갈림을
     담당자가 누르기 전에 알 방법이 화면에 없다.

     버튼은 하나의 일만 한다 — **그 자료를 다루는 화면을 연다.** 어느 줄을 고칠지는
     담당자가 그 화면에서 정한다. */
  const goTarget = () => {
    const t = TARGET_PAGE[open && open.targetType];
    if (!t) return;
    close();
    if (onNavigate) onNavigate(t.page);
  };

  return (
    <>
      {/* 제목 아래 설명을 두지 않는다 (2026-08-20, 사용자 요청). 「시민용 오류 신고 화면으로
          접수된 건입니다」는 이 화면을 여는 사람이 이미 아는 말이고, 뒤에 붙던 「미처리 N건」은
          **좌측 메뉴 [오류신고 관리] 옆 배지가 늘 적는 같은 숫자**다 — 한 화면에 두 번 적으면
          둘이 다를 때를 의심하게 된다 (대시보드에서 같은 이유로 뺐다). */}
      <PageHeader title="오류신고 관리" count={`${filtered.length}건`} />

      <Toolbar>
        <Select value={state} options={opt(REPORT_STATES, "전체 상태")} onChange={e => setState(e.target.value)} />
        <Select value={kind} options={opt(REPORT_TYPES, "전체 신고 유형")} onChange={e => setKind(e.target.value)} />
        <Select value={targetType} options={opt(REPORT_TARGET_TYPES, "전체 대상 유형")}
          onChange={e => setTargetType(e.target.value)} />
        <ListSearch state={list0} placeholder="내용 검색" />
        {/* ── 필터를 셋으로 줄였다 (2026-08-20, 사용자 요청) ──────────────────
               고르개가 여섯이라 필터 줄이 두 줄로 접혔고, 그 두 줄이 표보다 먼저 읽혔다.
               뺀 둘은 이 화면에서 짚어낼 것이 없는 축이다:

               담당자     계정이 하나뿐이라(9장) 고를 것이 사실상 없다. 담당자를 나눠 맡는
                          날이 오면 그때 세운다
               접수 기간   날짜 두 칸이 필터 줄에서 가장 넓은데, 담당자가 이 화면을 여는
                          이유는 "언제 것"이 아니라 "남은 일"이다. 차례가 이미 미처리 먼저다.
                          (「접수일 열을 정렬해 찾는다」로 근거를 바꿨다 — 2026-08-26 에
                          검색이 내용만 보게 되면서, 그 전까지 적어 두었던 「접수번호
                          검색으로 바로 닿는다」가 성립하지 않는다) */}
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="접수된 오류신고 목록"
        rows={paged.rows} rowKey="id" onRowClick={openOne}
        /* ── 열 폭을 적은 그대로 쓴다 (2026-08-26, 사용자 요청) ────────────────
           「내용」 열이 **칸에 맞춰** 잘리게 하려고 켠다. 기본(auto)에서는 칸의 폭이
           내용에서 나오므로 「칸에 맞춰 자르기」가 순환 참조가 되어 320px 상수로 잘랐고,
           그 값은 1440px 화면에 맞춰 고른 수였다 — 넓은 화면에서는 열이 700px 이 넘는데
           글자는 여전히 320px 에서 끊겼다. 이 표는 「내용」 말고 **일곱 열이 전부 폭을
           적고 있어** 고정 배치가 딱 맞는다: 적은 폭이 그대로 서고 남는 자리를 내용이
           전부 가져간다 */
        fixed
        /* 줄을 붉게 세우던 `rowTone` 이 여기 있었다 (2026-08-25 오후 삭제 — 머리말) */
        empty={{ title: "조건에 맞는 접수 건이 없습니다." }}
        columns={[
          /* 「n건 누적」 배지가 이 칸에 붙어 있었다 (2026-08-25 오후 삭제 — 머리말).
             배지가 없어지면서 폭도 176 에서 112 로 돌아간다 — 접수번호(rp-016)는 글자 수가
             늘 같아 딱 그만큼이면 된다 */
          { key: "id", label: "접수번호", width: 112, sortable: true,
            render: r => <span style={{ whiteSpace: "nowrap" }}>{r.id}</span> },
          /* 접수일은 통째로만 읽힌다. 104px 에서는 「2026-」 / 「10-15」 로 갈렸다 —
             `.admin-web` 의 overflow-wrap:break-word 가 붙임표를 끊을 자리로 보기 때문이다.
             날짜가 들어갈 만큼 넓히고 그 칸에서는 줄바꿈을 막는다 (열 하나가 두 줄이 되면
             그 행 전체가 두 줄이 되어 목록을 훑는 눈이 걸린다) */
          { key: "at", label: "접수일", width: 124, sortable: true,
            render: r => <span style={{ whiteSpace: "nowrap" }}>{r.at}</span> },
          { key: "targetType", label: "대상 유형", width: 100, sortable: true },
          { key: "target", label: "대상", width: 200,
            render: r => r.target || EMPTY_MARK },
          { key: "kind", label: "신고 유형", width: 120, sortable: true },
          /* 폭을 적지 않는 **유일한 열**이다 — 고정 배치에서 남는 자리를 전부 가져간다.
             1920px 화면에서는 700px 이 넘고 1440px 에서는 260px 남짓이라, 화면이 넓을수록
             더 읽힌다. 하한은 `DataTable` 의 `FLEX_MIN`(240) 이 잡고 그보다 좁아지면
             표가 가로로 스크롤된다 */
          { key: "body", label: "내용",
            /* 표에서는 한 줄로 자른다. 전문은 눌러서 본다 — 신고 내용은 길이가 제각각이라
               그대로 두면 한 행이 다섯 줄이 되고 목록을 훑을 수 없다.
               **`maxWidth: 320` 상수가 `width: 100%` 가 됐다** (2026-08-26, 사용자 요청) —
               자르는 자리를 화면이 아니라 칸이 정한다 (위 `fixed` 주석) */
            render: r => (
              <span style={{ display: "block", width: "100%", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.body}</span>
            ) },
          { key: "assignee", label: "담당자", width: 130, sortable: true,
            render: r => r.assignee || EMPTY_MARK },
          { key: "state", label: "상태", width: 96, align: "center", sortable: true,
            render: r => <Badge tone={STATE_TONE[r.state]} size="sm">{r.state}</Badge>,
            sortValue: r => STATE_ORDER[r.state] },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <Modal open={!!open} size="lg" onClose={close}
        title={open ? `${open.id} · ${open.kind}` : ""}
        description={open ? `${open.at} 접수 · ${open.targetType}` : undefined}
        footer={open ? (
          <>
            {TARGET_PAGE[open.targetType] ? (
              <Button variant="outline" icon="arrow-right" onClick={goTarget} style={{ marginRight: "auto" }}>
                {TARGET_PAGE[open.targetType].label}로 이동
              </Button>
            ) : null}
            <Button variant="ghost" onClick={close}>닫기</Button>
            <Button variant="primary" onClick={save}>저장</Button>
          </>
        ) : null}>
        {open ? (
          <>
            {/* 누적 안내 상자가 여기 있었다 (2026-08-25 오후 삭제 — 머리말) */}
            {/* 5-1 시민 제출 항목 — **읽기 전용**이다. 관리자가 고칠 수 있으면
                그 목록은 더 이상 접수 기록이 아니다.

                ── 신고 내용이 같은 표 안으로 들어왔다 (2026-08-25, 사용자 요청) ──────
                전에는 표 **밖**, 그 아래 회색 상자에 글만 덩그러니 놓였다. 이름표가 없으니
                **그것이 신고 내용이라는 것을 화면이 말해 주지 않았다** — 담당자는 위 세 줄이
                접수 기록이고 그 밑은 뭔가 다른 것이라고 읽거나, 아예 안내문으로 보고 건너뛴다.
                이 창에서 가장 먼저 읽어야 하는 글이 그 취급을 받고 있었다.

                넷 다 **시민이 제출한 한 벌**이라 한 표에 들어가는 것이 맞다. 표의 행은
                이름표가 값 위에 얹히고 내용만큼 늘어나므로(`InfoList` 머리말) 문장 하나가
                들어와도 모양이 깨지지 않는다. 차례는 제출 순서가 아니라 **읽는 순서**다 —
                무엇에 대한 신고인지(대상 · 대상 ID · 접수 지점)를 알고 나서 내용을 읽는다. */}
            <InfoList items={[
              { label: "대상", value: open.target },
              { label: "대상 ID", value: open.targetId },
              { label: "접수 지점", value: open.qrCode },
              /* 시민이 적은 글이라 **줄바꿈을 지운다** — 여러 줄로 적어 보낸 것을 한 줄로
                 이어 붙이면 문단이 뒤섞인다. 더미 자료는 다 한 줄이지만 실제 제출은 아니다 */
              { label: "신고 내용",
                /* 비었으면 감싸지 않고 넘긴다 — 빈 <span> 은 표에게 「값이 있다」로 보여
                   「-」가 서야 할 자리에 빈 줄이 선다 (`InfoList` 의 isEmpty) */
                value: open.body ? <span style={{ whiteSpace: "pre-line" }}>{open.body}</span> : null },
              /* 「회신처」가 여기 있었다 (2026-08-24 삭제) — 회신을 하지 않으므로
                 시민 쪽 신고 폼이 애초에 연락처를 받지 않는다 (머리말) */
            ]} />

            {/* 5-2 관리자 처리 항목 */}
            <div style={{ marginTop: "var(--space-5)", display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)" }}>
              <Select label="처리 상태" value={draft.state || "접수"}
                options={REPORT_STATES.map(v => ({ value: v, label: v }))}
                onChange={e => { setDraft(d => ({ ...d, state: e.target.value })); setError(null); }} />
              <Select label="담당자" value={draft.assignee || ""} options={ASSIGNEE_OPTIONS}
                onChange={e => setDraft(d => ({ ...d, assignee: e.target.value }))} />
            </div>

            {/* 「회신 내용」 칸이 이 아래 있었다 (2026-08-24 삭제). ◐ 조건부 요구는
                내부 메모가 이어받았다 — 그래서 이 칸이 rows 2 에서 3 으로 늘고 오류를 받는다. */}
            <div style={{ marginTop: "var(--space-4)" }}>
              <Textarea label="내부 메모" value={draft.memo || ""} rows={3} maxLength={500}
                error={error || undefined}
                onChange={e => { setDraft(d => ({ ...d, memo: e.target.value })); setError(null); }}
                /* 안내 문구가 여기 있었다 (2026-08-25 삭제) — 「공개되지 않습니다」는
                   칸 이름이 「내부 메모」라 이미 하는 말이고, 닫을 때 적으라는 요구는
                   실제로 막히는 순간 error 가 그 자리에서 적는다 */
                placeholder="확인 경위, 연락한 곳, 판단 근거." />
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Reports;
