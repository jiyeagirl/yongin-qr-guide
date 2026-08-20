import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Modal, Button, Select, Input, Badge, Notice, Pagination,
  InfoList, Textarea, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { REPORTS, isOpen, CONTACT_KEEP_DAYS } from "../data/reports.js";
import {
  REPORT_STATES, REPORT_TYPES, REPORT_TARGET_TYPES, REPORT_NEEDS_REPLY,
} from "../data/fields.js";
import { readAccounts } from "../data/account.js";
import { useCollection } from "../data/store.js";
import { useListState, ListSearch, PageSizeSelect, SearchHint } from "./useListState.js";

/* M13 오류신고 관리 (명세서 5장).
 *
 * ── 여기만 등록 버튼이 없다 ─────────────────────────────────────────────────
 * 다른 목록은 담당자가 자료를 넣는 곳이지만, 이 목록은 **시민이 만든다** (S10).
 * 관리자가 할 수 있는 일은 상태를 옮기고 답을 적는 것뿐이다. 그래서 [등록]도 [삭제]도 없다 —
 * 접수된 신고를 관리자가 지울 수 있으면 그 목록은 더 이상 접수 기록이 아니다.
 * 잘못 들어온 건은 지우는 대신 「반려」나 「중복」으로 옮긴다.
 *
 * ── 회신 없이 닫을 수 없다 ──────────────────────────────────────────────────
 * 명세서 5-2: `reply_content` 는 ◐ 이고 "처리완료 또는 반려 전환 시 필수"다.
 * 답 없이 닫힌 신고는 시민 쪽에서 보면 무시된 것과 구별되지 않는다.
 * (지금은 시민에게 답을 돌려보낼 통로가 없다. 아래 안내가 그 사실을 적는다.)
 *
 * ── 같은 대상에 세 건이 쌓이면 세운다 ───────────────────────────────────────
 * 명세서 5장의 규칙인데, 이유는 **판단이 달라지기 때문**이다. 한 건이면 신고한 사람의
 * 착각일 수 있지만 세 명이 같은 말을 하면 자료가 틀린 것이다. 그때 담당자가 할 일은
 * "답을 적는다"가 아니라 "자료를 고친다"로 바뀐다.
 *
 * ── 회신처는 개인정보다 ─────────────────────────────────────────────────────
 * 명세서 5장: "회신처는 개인정보이므로 처리 완료 후 90일 보관 뒤 자동 파기."
 * 실제 파기는 서버 배치가 하는 일이고, 화면이 할 수 있는 것은 담당자에게 **이 값이
 * 곧 사라진다**는 것과 목록에 함부로 뿌리지 않는 것뿐이다. 그래서 목록 표에는 회신처
 * 열이 없고 상세에서만 보인다.
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
  const [assignee, setAssignee] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const list0 = useListState([state, kind, targetType, assignee, from, to]);
  const [open, setOpen] = React.useState(null);
  const [draft, setDraft] = React.useState({});
  const [error, setError] = React.useState(null);

  const accounts = readAccounts().filter(a => a.active !== false);
  const ASSIGNEE_FILTER = [{ value: "", label: "전체 담당자" }, { value: "-", label: "담당자 없음" }]
    .concat(accounts.map(a => ({ value: a.name, label: a.name })));
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
      if (assignee === "-" && r.assignee) return false;
      if (assignee && assignee !== "-" && r.assignee !== assignee) return false;
      if (from && r.at < from) return false;
      if (to && r.at > to) return false;
      if (!list0.term) return true;
      return `${r.body} ${r.target || ""} ${r.id}`.includes(list0.term);
    })
    .sort((a, b) => (STATE_ORDER[a.state] - STATE_ORDER[b.state]) || b.at.localeCompare(a.at)),
  [rows, state, kind, targetType, assignee, from, to, list0.term]);

  const paged = list0.paginate(filtered);
  const openCount = rows.filter(isOpen).length;

  const openOne = r => { setOpen(r); setDraft({ ...r }); setError(null); };
  const close = () => { setOpen(null); setDraft({}); setError(null); };

  const save = () => {
    if (!open) return;
    /* ◐ 조건부 — 처리완료·반려로 옮기려면 회신 내용이 있어야 한다 (명세서 5-2) */
    if (REPORT_NEEDS_REPLY.includes(draft.state) && !String(draft.reply || "").trim()) {
      setError(`「${draft.state}」(으)로 옮기려면 회신 내용을 적어야 합니다.`);
      return;
    }
    patch(open.id, {
      state: draft.state, assignee: draft.assignee || null,
      memo: draft.memo || null, reply: String(draft.reply || "").trim() || null,
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
      <PageHeader title="오류신고 관리" count={`${filtered.length}건`}
        note={`시민용 오류 신고(S10)로 접수된 건입니다. 미처리 ${openCount}건 · 처리 항목은 명세서 5-2 를 따릅니다.`} />

      <Toolbar>
        <ListSearch state={list0} placeholder="내용 · 대상 · 접수번호 검색" width={260} />
        <Select value={state} options={opt(REPORT_STATES, "전체 상태")} onChange={e => setState(e.target.value)} />
        <Select value={kind} options={opt(REPORT_TYPES, "전체 신고 유형")} onChange={e => setKind(e.target.value)} />
        <Select value={targetType} options={opt(REPORT_TARGET_TYPES, "전체 대상 유형")}
          onChange={e => setTargetType(e.target.value)} />
        <Select value={assignee} options={ASSIGNEE_FILTER} onChange={e => setAssignee(e.target.value)} />
        {/* 접수 기간 (명세서 5장 목록 필터). 두 칸을 붙여 하나의 조건으로 보이게 둔다 */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 156 }} />
          <span style={{ color: "var(--text-muted)" }}>~</span>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 156 }} />
        </span>
        <PageSizeSelect state={list0} />
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
          { key: "at", label: "접수일", width: 104, sortable: true },
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
              { label: "회신처", value: open.contact },
            ]} />

            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)",
              background: "var(--surface-sunken)", borderRadius: "var(--radius-md)",
              fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              {open.body}
            </div>

            {open.contact ? (
              <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
                회신처는 개인정보입니다. 처리 완료 후 {CONTACT_KEEP_DAYS}일이 지나면 자동으로 파기되며,
                목록 표에는 표시하지 않습니다 (명세서 5장).
              </p>
            ) : null}

            {/* 5-2 관리자 처리 항목 */}
            <div style={{ marginTop: "var(--space-5)", display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)" }}>
              <Select label="처리 상태" value={draft.state || "접수"}
                options={REPORT_STATES.map(v => ({ value: v, label: v }))}
                onChange={e => { setDraft(d => ({ ...d, state: e.target.value })); setError(null); }} />
              <Select label="담당자" value={draft.assignee || ""} options={ASSIGNEE_OPTIONS}
                onChange={e => setDraft(d => ({ ...d, assignee: e.target.value }))} />
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <Textarea label="내부 메모" value={draft.memo || ""} rows={2} maxLength={500}
                onChange={e => setDraft(d => ({ ...d, memo: e.target.value }))}
                placeholder="확인 경위, 연락한 곳, 판단 근거."
                hint="시민에게 공개되지 않습니다." />
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <Textarea label="회신 내용" value={draft.reply || ""} rows={3} maxLength={500}
                error={error || undefined}
                onChange={e => { setDraft(d => ({ ...d, reply: e.target.value })); setError(null); }}
                placeholder="확인 결과와 조치 내용을 적습니다."
                hint={`「${REPORT_NEEDS_REPLY.join("」 · 「")}」(으)로 옮기려면 반드시 적어야 합니다 (명세서 5-2).`} />
            </div>

            <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-4)" }}>
              지금은 회신 내용이 관리자 화면에만 남습니다. 회신처로 알림을 보내는 기능은 서버 연동 후 열립니다.
            </Notice>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Reports;
