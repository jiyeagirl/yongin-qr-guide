import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, Button, Select, SearchField,
  Badge, Textarea, InfoList, EMPTY_MARK, Notice,
} from "../../design-systems/admin.js";
import { INQUIRIES, STATES, KINDS } from "../data/inquiries.js";
import { useCollection } from "../data/store.js";

/* A-IN-01 문의 및 오류신고 관리.
 *
 * ── 여기만 등록 버튼이 없다 ─────────────────────────────────────────────────
 * 다른 여섯 화면은 담당자가 자료를 넣는 곳이지만, 이 목록은 **시민이 만든다** (S10).
 * 관리자가 할 수 있는 일은 상태를 옮기고 답을 적는 것뿐이다. 그래서 [등록]도 [삭제]도 없다 —
 * 접수된 신고를 관리자가 지울 수 있으면 그 목록은 더 이상 접수 기록이 아니다.
 *
 * ── 상태를 자유롭게 오가게 두지 않는다 ──────────────────────────────────────
 * 접수 → 처리중 → 완료 한 방향이다. 완료로 옮기려면 답변이 있어야 한다 —
 * 답 없이 닫힌 신고는 시민 쪽에서 보면 무시된 것과 구별되지 않는다.
 * (지금은 시민에게 답을 돌려보낼 통로가 없다. 아래 안내가 그 사실을 적는다.)
 *
 * ── 미처리를 위에 둔다 ──────────────────────────────────────────────────────
 * 기본 차례가 접수일 역순이 아니라 **상태 먼저, 그 다음 최신순**이다. 순수 최신순이면
 * 오늘 들어온 완료 건이 사흘 묵은 미처리 건 위에 온다. 담당자가 이 화면을 여는 이유는
 * 목록을 훑기 위해서가 아니라 남은 일을 찾기 위해서다.
 * (시민용 S12 축제 목록에서 같은 판단을 했다 — 상태 먼저, 그 다음 거리.)
 */

const STATE_TONE = { 접수: "danger", 처리중: "warning", 완료: "neutral" };
const STATE_ORDER = { 접수: 0, 처리중: 1, 완료: 2 };

const STATE_OPTIONS = [{ value: "", label: "전체 상태" }].concat(STATES.map(v => ({ value: v, label: v })));
const KIND_OPTIONS = [{ value: "", label: "전체 유형" }].concat(KINDS.map(v => ({ value: v, label: v })));

export function Inquiries({ onToast }) {
  const { rows, patch } = useCollection("inquiries", INQUIRIES);
  const [state, setState] = React.useState("");
  const [kind, setKind] = React.useState("");
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(null);   /* 열어 본 신고 */
  const [reply, setReply] = React.useState("");

  const list = React.useMemo(() => rows
    .filter(r => {
      if (state && r.state !== state) return false;
      if (kind && r.kind !== kind) return false;
      if (!q.trim()) return true;
      return `${r.body} ${r.target || ""} ${r.id}`.includes(q.trim());
    })
    .sort((a, b) => (STATE_ORDER[a.state] - STATE_ORDER[b.state]) || b.at.localeCompare(a.at)),
  [rows, state, kind, q]);

  const openOne = row => { setOpen(row); setReply(row.reply || ""); };
  const close = () => { setOpen(null); setReply(""); };

  const setState2 = next => {
    if (!open) return;
    if (next === "완료" && !reply.trim()) {
      onToast("답변을 적어야 완료로 옮길 수 있습니다.");
      return;
    }
    patch(open.id, { state: next, reply: reply.trim() || null });
    onToast(`${open.id} 상태를 「${next}」(으)로 바꿨습니다.`);
    close();
  };

  const saveReply = () => {
    if (!open) return;
    patch(open.id, { reply: reply.trim() || null, state: open.state === "접수" ? "처리중" : open.state });
    onToast("답변을 저장했습니다.");
    close();
  };

  const openCount = rows.filter(r => r.state !== "완료").length;

  return (
    <>
      <PageHeader title="문의·오류신고" count={`${list.length}건`}
        note={`시민용 오류 신고(S10)로 접수된 건입니다. 미처리 ${openCount}건.`} />

      <Toolbar>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")}
          placeholder="내용 · 대상 검색" style={{ width: 320 }} />
        <Select value={state} options={STATE_OPTIONS} onChange={e => setState(e.target.value)} />
        <Select value={kind} options={KIND_OPTIONS} onChange={e => setKind(e.target.value)} />
      </Toolbar>

      <DataTable
        caption="접수된 문의 및 오류신고 목록"
        rows={list} rowKey="id" onRowClick={openOne}
        empty={{ title: "조건에 맞는 접수 건이 없습니다." }}
        columns={[
          { key: "id", label: "접수번호", width: 110, sortable: true },
          { key: "at", label: "접수일", width: 110, sortable: true },
          { key: "kind", label: "유형", width: 150, sortable: true },
          { key: "target", label: "대상", width: 220, render: r => r.target || EMPTY_MARK },
          { key: "body", label: "내용",
            /* 표에서는 한 줄로 자른다. 전문은 눌러서 본다 — 신고 내용은 길이가 제각각이라
               그대로 두면 한 행이 다섯 줄이 되고 목록을 훑을 수 없다 */
            render: r => (
              <span style={{ display: "block", maxWidth: 380, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.body}</span>
            ) },
          { key: "state", label: "상태", width: 90, align: "center", sortable: true,
            render: r => <Badge tone={STATE_TONE[r.state]} size="sm">{r.state}</Badge>,
            sortValue: r => STATE_ORDER[r.state] },
        ]} />

      <Modal open={!!open} size="md" onClose={close}
        title={open ? `${open.id} · ${open.kind}` : ""}
        description={open ? `${open.at} 접수` : undefined}
        footer={open ? (
          <>
            <Button variant="ghost" onClick={close}>닫기</Button>
            {open.state !== "완료" ? (
              <>
                <Button variant="outline" onClick={saveReply}>답변 저장</Button>
                <Button variant="primary" onClick={() => setState2("완료")}>완료 처리</Button>
              </>
            ) : (
              /* 완료된 건도 되돌릴 수 있어야 한다 — 답이 틀렸다는 것을 나중에 알게 되는 일이 있다 */
              <Button variant="outline" onClick={() => setState2("처리중")}>처리중으로 되돌리기</Button>
            )}
          </>
        ) : null}>
        {open ? (
          <>
            <InfoList items={[
              { label: "대상", value: open.target },
              { label: "회신처", value: open.contact },
              { label: "처리 상태", value: <Badge tone={STATE_TONE[open.state]} size="sm">{open.state}</Badge> },
            ]} />

            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)",
              background: "var(--surface-sunken)", borderRadius: "var(--radius-md)",
              fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              {open.body}
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <Textarea label="답변" value={reply} rows={3} onChange={e => setReply(e.target.value)}
                placeholder="확인 결과와 조치 내용을 적습니다."
                hint="완료로 옮기려면 답변이 있어야 합니다. 답 없이 닫힌 신고는 시민 쪽에서 무시된 것과 구별되지 않습니다." />
            </div>

            <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-4)" }}>
              지금은 답변이 관리자 화면에만 남습니다. 회신처로 알림을 보내는 기능은 서버 연동 후 열립니다.
            </Notice>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Inquiries;
