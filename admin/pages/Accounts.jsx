import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, Button, Badge, Notice, Switch,
  Pagination, Modal, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { ACCOUNT_FIELDS, checkPassword, V } from "../data/fields.js";
import {
  SEED_ACCOUNTS, isLastAccount, isProtectedAccount, SUPER_ID,
  SESSION_HOURS, MAX_ATTEMPTS, LOCK_MINUTES,
} from "../data/account.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M16 계정 관리 — **최종 관리자(`admin`)만 들어오는 화면이다.**
 *
 * ── 이 화면만 갈라진다 (2026-08-24) ────────────────────────────────────────
 * 업무 화면 아홉 개는 v1.1 그대로 모든 계정이 똑같이 본다. 여기만 다른 것은 업무의
 * 경중이 아니라 **자물쇠이기 때문**이다 — 모두가 계정을 지울 수 있으면 서로를 지울 수
 * 있고, 마지막 하나를 쓰던 사람이 떠나면 아무도 못 들어온다. 판정은 `can()` 이 하고
 * (`data/account.js`), 다른 계정에게는 좌측 내비에서 이 항목이 아예 없다.
 *
 * ── 최종 관리자를 지우지도 끄지도 못한다 ────────────────────────────────────
 * `admin` 이 사라지면 계정 관리로 들어올 사람이 없어지므로, 그 계정만은 [삭제]와
 * [사용 여부] 양쪽이 다 막힌다. 표에서 [삭제] 버튼 자리를 비우고 토글을 잠근다 —
 * 눌러 보고 안내창을 만나는 것보다 **처음부터 누를 것이 없는 편**이 낫다. 어느 계정이
 * 왜 그런지는 이름 옆 배지와 표 아래 안내가 적는다.
 *
 * 그래도 `toggleActive` · `askRemove` · `onSave` 셋이 각자 한 번 더 본다. 잠긴 컨트롤은
 * **모양이지 규칙이 아니고**, 이 화면에서 계정을 없애는 길이 셋이라 흩어 두면 언젠가
 * 하나가 빠진다. 판정 자체는 `isProtectedAccount()` 한 곳에 있다.
 *
 * ── 마지막 계정을 막는다 ────────────────────────────────────────────────────
 * 쓸 수 있는 계정이 하나 남았을 때 그것을 지우거나 끄면 **아무도 들어오지 못한다.**
 * 서버가 없는 지금은 그 상태를 되돌리는 방법이 소스 수정뿐이라 화면에서 막는다.
 * 삭제만 막으면 [사용]을 끄는 것으로 같은 상태가 되므로 둘 다 막는다.
 * `admin` 보호가 생긴 뒤에도 이 규칙은 남는다 — 둘이 겹치는 것이 아니다.
 * 마지막 계정 보호는 계정이 **0이 되는 것**만 막고, *누가* 남는지는 정하지 못한다.
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

/* 안내창의 둘째 문단. 「하나도 남지 않으면」과는 다른 이야기라 따로 적는다.
   화면에서 두 통로를 다 잠가 두었으므로 지금은 뜨지 않는 문구다 — 잠금이 풀렸을 때
   담당자가 이유 없이 막히지 않도록 안내창 쪽에도 답을 남겨 둔다 */
const SUPER_NOTE = `계정 관리 화면에 들어올 수 있는 계정은 최종 관리자(${SUPER_ID})뿐입니다. `
  + "이 계정이 없어지면 계정을 더하거나 지울 사람이 남지 않습니다.";

export function Accounts({ account, onToast }) {
  const { rows, upsert, remove, patch } = useCollection("accounts", SEED_ACCOUNTS, null, "계정");
  const list0 = useListState([]);
  const [blocked, setBlocked] = React.useState(null);

  const ed = useRecordEditor({
    fieldsFor: v => ACCOUNT_FIELDS.map(f => {
      /* 아이디는 등록할 때만 고칠 수 있다 (명세서 9장). 수정 화면에서는 읽기 전용으로
         모양을 바꾼다 — 회색 입력칸으로 두면 안 고쳐지는 것이 고장으로 읽힌다 */
      if (f.key === "id" && v.id0) return { ...f, required: "auto", type: "readonly" };
      /* 최종 관리자의 [사용 여부]는 잠근다. 항목을 감추지 않는 이유: 감추면 이 계정에만
         없는 항목이 되어 "왜 없지"가 남는다. 잠긴 토글은 그 자리에서 답이 된다 */
      if (f.key === "active" && isProtectedAccount(v.id0)) {
        return { ...f, disabled: true, hint: "최종 관리자는 사용 중지할 수 없습니다." };
      }
      return f;
    }),
    initial: () => ({ active: true }),
    onSave: values => {
      const { id0, ...rest } = values;
      /* 비밀번호를 비웠으면 기존 값을 그대로 둔다 */
      const prev = rows.find(a => a.id === rest.id);
      const pw = String(rest.pw || "").trim() || (prev ? prev.pw : "");
      /* 잠긴 토글이 넘어오는 값을 여기서도 한 번 더 잡는다 — 폼이 잠긴 것과
         저장이 막힌 것은 다른 이야기다 (`disabled` 는 모양이지 규칙이 아니다) */
      const active = isProtectedAccount(rest.id) ? true : rest.active;
      upsert({ ...rest, pw, active });
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
    if (isProtectedAccount(a.id)) {
      setBlocked({ name: a.name, why: "최종 관리자 계정입니다. 사용 중지할 수 없습니다.",
        note: SUPER_NOTE });
      return;
    }
    if (a.active !== false && isLastAccount(rows, a.id)) {
      setBlocked({ name: a.name, why: "쓸 수 있는 계정이 이것 하나뿐입니다. 사용 중지할 수 없습니다." });
      return;
    }
    patch(a.id, { active: a.active === false }, a.name);
  };

  const askRemove = a => {
    if (isProtectedAccount(a.id)) {
      setBlocked({ name: a.name, why: "최종 관리자 계정입니다. 삭제할 수 없습니다.",
        note: SUPER_NOTE });
      return;
    }
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
        note={`관리자 화면에 들어올 수 있는 계정입니다. 업무 화면은 모든 계정이 똑같이 쓰며, 계정을 더하고 지우는 일만 최종 관리자(${SUPER_ID})가 합니다.`}
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
          { key: "name", label: "이름", width: 210, sortable: true,
            render: a => (
              <Cell>
                {a.name}
                {isProtectedAccount(a.id) ? <Badge tone="info" size="sm">최종 관리자</Badge> : null}
                {a.id === account.id ? <Badge tone="brand" size="sm">나</Badge> : null}
              </Cell>
            ) },
          { key: "email", label: "이메일", render: a => a.email || EMPTY_MARK },
          { key: "phone", label: "연락처", width: 150, render: a => a.phone || EMPTY_MARK },
          { key: "active", label: "사용 여부", width: 104, align: "center", sortable: true,
            render: a => (
              <Switch checked={a.active !== false} disabled={isProtectedAccount(a.id)}
                aria-label={`${a.name} 사용 여부`}
                onChange={() => toggleActive(a)} />
            ) },
          /* 최종 관리자 행은 [삭제] 자리를 비운다. 눌러 보고 「할 수 없습니다」를 만나는
             것보다 처음부터 누를 것이 없는 편이 낫다 — 안내창은 토글 쪽 통로에 남는다 */
          { key: "manage", label: "관리", width: 96, align: "center",
            render: a => (isProtectedAccount(a.id) ? EMPTY_MARK : (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => askRemove(a)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            )) },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-5)" }}>
        로그인 {MAX_ATTEMPTS}회 실패 시 {LOCK_MINUTES}분 잠기고, 로그인 후 세션은
        {" "}{SESSION_HOURS}시간 유지됩니다. <b>최종 관리자({SUPER_ID}) 계정은 중지·삭제할 수
        없고, 이 화면도 그 계정만 열 수 있습니다</b> — 담당자가 바뀌어도 계정을 다시 만들
        사람이 남아 있어야 하기 때문입니다. 그 밖의 계정도 <b>쓸 수 있는 계정이 하나만
        남으면</b> 중지·삭제할 수 없습니다. 다른 계정의 비밀번호를 바꿔 주는 것도 여기서
        합니다 — 담당자는 로그인 화면에서 초기화를 요청합니다.
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
              {blocked.note
                || "쓸 수 있는 계정이 하나도 남지 않으면 관리자 화면에 아무도 들어갈 수 없게 됩니다."}
              {" "}서버가 없는 지금은 그것을 되돌리는 방법이 소스 수정뿐입니다.
            </p>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Accounts;
