import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, Button, Badge, Notice, Switch,
  Pagination, Modal, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { ACCOUNT_FIELDS, checkPassword, V } from "../data/fields.js";
import {
  SEED_ACCOUNTS, isLastAccount, SESSION_HOURS, MAX_ATTEMPTS, LOCK_MINUTES,
} from "../data/account.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M16 계정 관리 — 담당자가 직접 한다.
 *
 * ── 권한을 나누지 않는다 (2026-08-20) ──────────────────────────────────────
 * 전에는 이 화면이 개발자 전용이었다. 관리자 화면을 쓰는 사람이 용인시 담당자뿐이라
 * 그 구분을 없앴다 — 인사이동으로 사람이 바뀌는 일이 개발사를 부를 일은 아니다.
 * 계정 등록·수정·삭제를 담당자가 직접 한다.
 *
 * ── 마지막 계정을 막는다 ────────────────────────────────────────────────────
 * 쓸 수 있는 계정이 하나 남았을 때 그것을 지우거나 끄면 **아무도 들어오지 못한다.**
 * 서버가 없는 지금은 그 상태를 되돌리는 방법이 소스 수정뿐이라 화면에서 막는다.
 * 삭제만 막으면 [사용]을 끄는 것으로 같은 상태가 되므로 둘 다 막는다.
 *
 * ── 아이디를 등록 후 고칠 수 없다 ───────────────────────────────────────────
 * 아이디가 **변경 이력의 주체**로 남기 때문이다. 아이디를 바꾸면 지난 이력의 「누가」가
 * 지금 없는 사람을 가리키거나, 더 나쁘게는 그 아이디를 새로 받은 다른 사람을 가리킨다.
 *
 * ── 비밀번호는 비우면 그대로 둔다 ───────────────────────────────────────────
 * 수정 화면에서 비밀번호 칸에 기존 값을 채워 보여줄 수는 없다(해시라서 읽을 수 없고,
 * 지금은 평문이지만 그것을 화면에 뿌릴 이유가 없다). 그렇다고 필수로 두면 이름 한 글자를
 * 고치려고 비밀번호를 새로 정하게 된다. **비우면 유지**가 두 문제를 함께 푼다.
 */

export function Accounts({ account, onToast }) {
  const { rows, upsert, remove, patch } = useCollection("accounts", SEED_ACCOUNTS, null, "계정");
  const list0 = useListState([]);
  const [blocked, setBlocked] = React.useState(null);

  const ed = useRecordEditor({
    fieldsFor: v => ACCOUNT_FIELDS.map(f => (
      /* 아이디는 등록할 때만 고칠 수 있다 (명세서 9장). 수정 화면에서는 읽기 전용으로
         모양을 바꾼다 — 회색 입력칸으로 두면 안 고쳐지는 것이 고장으로 읽힌다 */
      f.key === "id" && v.id0 ? { ...f, required: "auto", type: "readonly" } : f
    )),
    initial: () => ({ active: true }),
    onSave: values => {
      const { id0, ...rest } = values;
      /* 비밀번호를 비웠으면 기존 값을 그대로 둔다 */
      const prev = rows.find(a => a.id === rest.id);
      const pw = String(rest.pw || "").trim() || (prev ? prev.pw : "");
      upsert({ ...rest, pw });
    },
    onRemove: remove,
    onToast, label: "계정",
    extraValidate: v => {
      const bad = {};
      if (!v.id0) {
        /* 전역 유일 (명세서 9장) */
        if (v.id && rows.some(a => a.id === v.id)) bad.id = "이미 쓰는 아이디입니다.";
        const msg = checkPassword(v.pw);
        if (msg) bad.pw = msg;
      } else if (String(v.pw || "").trim()) {
        const msg = checkPassword(v.pw);
        if (msg) bad.pw = msg;
      }
      if (v.phone && !V.phone.re.test(v.phone)) bad.phone = V.phone.msg;
      return bad;
    },
  });

  /* 수정할 때는 아이디 잠금을 알리는 표시(id0)와 빈 비밀번호를 함께 넣는다 */
  const openEdit = a => ed.openEdit({ ...a, id0: a.id, pw: "" });

  const filtered = rows.filter(a => {
    if (!list0.term) return true;
    return `${a.id} ${a.name} ${a.email || ""} ${a.phone || ""}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  const toggleActive = a => {
    if (a.active !== false && isLastAccount(rows, a.id)) {
      setBlocked({ name: a.name, why: "쓸 수 있는 계정이 이것 하나뿐입니다. 사용 중지할 수 없습니다." });
      return;
    }
    patch(a.id, { active: a.active === false }, a.name);
  };

  const askRemove = a => {
    if (a.id === account.id) {
      setBlocked({ name: a.name, why: "지금 로그인한 계정입니다. 다른 계정으로 들어와 지워 주세요." });
      return;
    }
    if (isLastAccount(rows, a.id)) {
      setBlocked({ name: a.name, why: "쓸 수 있는 계정이 이것 하나뿐입니다. 삭제할 수 없습니다." });
      return;
    }
    ed.askRemove(a);
  };

  return (
    <>
      <PageHeader title="계정 관리" count={`${filtered.length}개`}
        note="관리자 화면에 들어올 수 있는 계정입니다. 모든 계정이 같은 일을 할 수 있습니다."
        action={<Button variant="primary" icon="user-plus" onClick={ed.openNew}>계정 등록</Button>} />

      <Toolbar>
        <ListSearch state={list0} placeholder="아이디 · 이름 · 이메일 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="관리자 계정 목록"
        rows={paged.rows} rowKey="id" onRowClick={openEdit}
        rowTone={a => (a.active === false ? "warning" : null)}
        empty={{ title: "조건에 맞는 계정이 없습니다." }}
        columns={[
          { key: "id", label: "아이디", width: 160, sortable: true },
          { key: "name", label: "이름", width: 170, sortable: true,
            render: a => (
              <Cell>
                {a.name}
                {a.id === account.id ? <Badge tone="brand" size="sm">나</Badge> : null}
              </Cell>
            ) },
          { key: "email", label: "이메일", render: a => a.email || EMPTY_MARK },
          { key: "phone", label: "연락처", width: 150, render: a => a.phone || EMPTY_MARK },
          { key: "active", label: "사용 여부", width: 104, align: "center", sortable: true,
            render: a => (
              <Switch checked={a.active !== false} aria-label={`${a.name} 사용 여부`}
                onChange={() => toggleActive(a)} />
            ) },
          { key: "manage", label: "관리", width: 96, align: "center",
            render: a => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => askRemove(a)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-5)" }}>
        로그인 {MAX_ATTEMPTS}회 실패 시 {LOCK_MINUTES}분 잠기고, 로그인 후 세션은
        {" "}{SESSION_HOURS}시간 유지됩니다. <b>쓸 수 있는 계정이 하나만 남으면 그 계정은
        중지·삭제할 수 없습니다</b> — 아무도 들어오지 못하게 되기 때문입니다.
        서버 연동 전이라 비밀번호가 브라우저 안에 평문으로 있습니다.
      </Notice>

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "계정 등록" : "계정 수정"}
        description={ed.draft && !ed.draft.isNew ? `${ed.draft.values.name} · ${ed.draft.values.id}` : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            note={ed.draft.isNew
              ? "비밀번호는 영문 · 숫자 · 특수문자 중 두 종류 이상을 섞어 10자 이상으로 정합니다."
              : "비밀번호를 비워 두면 기존 비밀번호를 그대로 둡니다. 아이디는 등록 후 바꿀 수 없습니다 — 변경 이력의 주체로 남는 값이기 때문입니다."} />
        ) : null}
      </EditorModal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="계정을 삭제합니다."
        footnote="이 계정으로 로그인할 수 없게 됩니다. 지난 변경 이력에 남은 이름은 그대로 유지됩니다. 잠시 쓰지 않을 뿐이라면 삭제 대신 [사용 여부] 토글을 꺼 주세요."
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />

      <Modal open={!!blocked} size="md" title="할 수 없습니다"
        description={blocked ? blocked.name : undefined}
        onClose={() => setBlocked(null)}
        footer={<Button variant="primary" onClick={() => setBlocked(null)}>확인</Button>}>
        {blocked ? (
          <>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              {blocked.why}
            </p>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-label)",
              color: "var(--text-muted)", lineHeight: 1.6 }}>
              쓸 수 있는 계정이 하나도 남지 않으면 관리자 화면에 아무도 들어갈 수 없게 됩니다.
              서버가 없는 지금은 그것을 되돌리는 방법이 소스 수정뿐입니다.
            </p>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Accounts;
