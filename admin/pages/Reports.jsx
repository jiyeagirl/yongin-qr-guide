import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Modal, Button, Select, Badge, Notice, Pagination,
  InfoList, Textarea, EMPTY_MARK,
} from "../../design-systems/admin.js";
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
 * ── 같은 대상에 세 건이 쌓이면 세운다 ───────────────────────────────────────
 * 명세서 5장의 규칙인데, 이유는 **판단이 달라지기 때문**이다. 한 건이면 신고한 사람의
 * 착각일 수 있지만 세 명이 같은 말을 하면 자료가 틀린 것이다. 그때 담당자가 할 일은
 * "답을 적는다"가 아니라 "자료를 고친다"로 바뀐다.
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

/* 대상 유형 → 그 자료를 고치는 화면 (명세서 5장 "상세에서 대상 데이터로 바로 이동") */
const TARGET_PAGE = { 공공시설: "facilities", 점포: "stores", 상점가: "districts", 축제: "festivals" };

const DUP_THRESHOLD = 3;

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

  /* 같은 대상에 몇 건이 쌓였나. targetId 가 없는 건(기타 문의)은 세지 않는다 —
     대상이 없는 신고끼리는 "같은 대상"이라는 말이 성립하지 않는다 */
  const dupCount = React.useMemo(() => {
    const o = {};
    rows.forEach(r => { if (r.targetId) o[r.targetId] = (o[r.targetId] || 0) + 1; });
    return o;
  }, [rows]);

  const filtered = React.useMemo(() => rows
    .filter(r => {
      if (state && r.state !== state) return false;
      if (kind && r.kind !== kind) return false;
      if (targetType && r.targetType !== targetType) return false;
      if (!list0.term) return true;
      return `${r.body} ${r.target || ""} ${r.id}`.includes(list0.term);
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
      setError(`「${draft.state}」(으)로 옮기려면 내부 메모에 근거를 적어야 합니다.`);
      return;
    }
    patch(open.id, {
      state: draft.state, assignee: draft.assignee || null,
      memo: String(draft.memo || "").trim() || null,
    }, open.id);
    onToast(`${open.id} 처리 내용을 저장했습니다.`);
    close();
  };

  const goTarget = () => {
    const page = TARGET_PAGE[open && open.targetType];
    if (!page) return;
    close();
    if (onNavigate) onNavigate(page);
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
        <ListSearch state={list0} placeholder="내용 · 대상 · 접수번호 검색" />
        {/* ── 필터를 셋으로 줄였다 (2026-08-20, 사용자 요청) ──────────────────
               고르개가 여섯이라 필터 줄이 두 줄로 접혔고, 그 두 줄이 표보다 먼저 읽혔다.
               뺀 둘은 이 화면에서 짚어낼 것이 없는 축이다:

               담당자     계정이 하나뿐이라(9장) 고를 것이 사실상 없다. 담당자를 나눠 맡는
                          날이 오면 그때 세운다
               접수 기간   날짜 두 칸이 필터 줄에서 가장 넓은데, 담당자가 이 화면을 여는
                          이유는 "언제 것"이 아니라 "남은 일"이다. 차례가 이미 미처리 먼저이고,
                          특정 날짜는 접수번호(YYYYMMDD-n) 검색으로 바로 닿는다 */}
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="접수된 오류신고 목록"
        rows={paged.rows} rowKey="id" onRowClick={openOne}
        /* 같은 대상에 세 건 이상이면 세운다 (명세서 5장) */
        rowTone={r => (r.targetId && dupCount[r.targetId] >= DUP_THRESHOLD ? "danger" : null)}
        empty={{ title: "조건에 맞는 접수 건이 없습니다." }}
        columns={[
          { key: "id", label: "접수번호", width: 104, sortable: true },
          /* 접수일은 통째로만 읽힌다. 104px 에서는 「2026-」 / 「10-15」 로 갈렸다 —
             `.admin-web` 의 overflow-wrap:break-word 가 붙임표를 끊을 자리로 보기 때문이다.
             날짜가 들어갈 만큼 넓히고 그 칸에서는 줄바꿈을 막는다 (열 하나가 두 줄이 되면
             그 행 전체가 두 줄이 되어 목록을 훑는 눈이 걸린다) */
          { key: "at", label: "접수일", width: 124, sortable: true,
            render: r => <span style={{ whiteSpace: "nowrap" }}>{r.at}</span> },
          { key: "targetType", label: "대상 유형", width: 100, sortable: true },
          { key: "target", label: "대상", width: 200,
            render: r => (
              <Cell>
                {r.target || EMPTY_MARK}
                {r.targetId && dupCount[r.targetId] >= DUP_THRESHOLD ? (
                  <Badge tone="danger" size="sm">{dupCount[r.targetId]}건 누적</Badge>
                ) : null}
              </Cell>
            ) },
          { key: "kind", label: "신고 유형", width: 120, sortable: true },
          { key: "body", label: "내용",
            /* 표에서는 한 줄로 자른다. 전문은 눌러서 본다 — 신고 내용은 길이가 제각각이라
               그대로 두면 한 행이 다섯 줄이 되고 목록을 훑을 수 없다 */
            render: r => (
              <span style={{ display: "block", maxWidth: 320, overflow: "hidden",
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
                {open.targetType} 관리로 이동
              </Button>
            ) : null}
            <Button variant="ghost" onClick={close}>닫기</Button>
            <Button variant="primary" onClick={save}>저장</Button>
          </>
        ) : null}>
        {open ? (
          <>
            {open.targetId && dupCount[open.targetId] >= DUP_THRESHOLD ? (
              <Notice tone="danger" size="sm" title={`같은 대상에 ${dupCount[open.targetId]}건이 쌓였습니다`}
                style={{ marginBottom: "var(--space-4)" }}>
                한 사람의 착각이 아니라 자료가 틀렸을 가능성이 큽니다. 답을 적기 전에
                대상 자료를 먼저 확인해 주세요.
              </Notice>
            ) : null}

            {/* 5-1 시민 제출 항목 — **읽기 전용**이다. 관리자가 고칠 수 있으면
                그 목록은 더 이상 접수 기록이 아니다 */}
            <InfoList items={[
              { label: "대상", value: open.target },
              { label: "대상 ID", value: open.targetId },
              { label: "접수 지점", value: open.qrCode },
              /* 「회신처」가 여기 있었다 (2026-08-24 삭제) — 회신을 하지 않으므로
                 시민 쪽 신고 폼이 애초에 연락처를 받지 않는다 (머리말) */
            ]} />

            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)",
              background: "var(--surface-sunken)", borderRadius: "var(--radius-md)",
              fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              {open.body}
            </div>

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
                placeholder="확인 경위, 연락한 곳, 판단 근거."
                hint={`사용자에게 공개되지 않습니다. 「${REPORT_CLOSING_STATES.join("」 · 「")}」(으)로 옮기려면 반드시 적어야 합니다.`} />
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Reports;
