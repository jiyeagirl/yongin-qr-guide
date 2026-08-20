import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, Button, Select, Badge, Notice, Switch,
  Pagination, Modal, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { ACCOUNT_FIELDS, checkPassword, V } from "../data/fields.js";
import {
  SEED_ACCOUNTS, ROLE_LABEL, isLastDeveloper, SESSION_HOURS, MAX_ATTEMPTS, LOCK_MINUTES,
} from "../data/account.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, PageSizeSelect, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M16 계정 관리 (명세서 9장) — 개발자 전용.
 *
 * ── 개발자 전용인 이유 ──────────────────────────────────────────────────────
 * 권한의 크기가 아니라 **잘못 건드렸을 때 벌어지는 일**이다. 계정을 잘못 만지면 아무도
 * 들어오지 못하고, 서버가 없는 지금은 그것을 되돌리는 방법이 소스 수정뿐이다.
 *
 * ── 마지막 개발자 계정을 막는다 ─────────────────────────────────────────────
 * 명세서 9장 동작 규칙. 막지 않으면 자기 계정의 권한을 시청 담당자로 낮추는 것만으로
 * 이 화면과 공공데이터 동기화와 API 쿼터에 아무도 들어가지 못하는 상태가 만들어진다.
 * **비활성화도 같이 막는다** — 삭제만 막으면 끄는 것으로 같은 상태가 된다.
 *
 * ── 아이디를 등록 후 고칠 수 없다 ───────────────────────────────────────────
 * 명세서 9장이 그렇게 정했고, 이유는 아이디가 **변경 이력의 주체**로 남기 때문이다.
 * 아이디를 바꾸면 지난 이력의 「누가」가 지금 없는 사람을 가리키거나, 더 나쁘게는
 * 그 아이디를 새로 받은 다른 사람을 가리킨다.
 *
 * ── 비밀번호는 비우면 그대로 둔다 ───────────────────────────────────────────
 * 수정 화면에서 비밀번호 칸에 기존 값을 채워 보여줄 수는 없다(해시라서 읽을 수 없고,
 * 지금은 평문이지만 그것을 화면에 뿌릴 이유가 없다). 그렇다고 필수로 두면 이름 한 글자를
 * 고치려고 비밀번호를 새로 정하게 된다. **비우면 유지**가 두 문제를 함께 푼다.
 */

const ROLE_FILTER = [
  { value: "", label: "전체 권한" },
  { value: "CITY", label: "시청 담당자" },
  { value: "DEVELOPER", label: "개발자" },
];

export function Accounts({ account, onToast }) {
  const { rows, upsert, remove, patch } = useCollection("accounts", SEED_ACCOUNTS, null, "계정");
  const [role, setRole] = React.useState("");
  const list0 = useListState([role]);
  const [blocked, setBlocked] = React.useState(null);

  const ed = useRecordEditor({
    fieldsFor: v => ACCOUNT_FIELDS.map(f => (
      /* 아이디는 등록할 때만 고칠 수 있다 (명세서 9장). 수정 화면에서는 읽기 전용으로
         모양을 바꾼다 — 회색 입력칸으로 두면 안 고쳐지는 것이 고장으로 읽힌다 */
      f.key === "id" && v.id0 ? { ...f, required: "auto", type: "readonly" } : f
    )),
    initial: () => ({ role: "CITY", active: true }),
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
      /* 마지막 개발자를 시청 담당자로 낮추지 못하게 한다 */
      if (v.id0 && v.role !== "DEVELOPER" && isLastDeveloper(rows, v.id)) {
        bad.role = "마지막 개발자 계정입니다. 다른 개발자 계정을 먼저 만들어 주세요.";
      }
      return bad;
    },
  });

  /* 수정할 때는 아이디 잠금을 알리는 표시(id0)와 빈 비밀번호를 함께 넣는다 */
  const openEdit = a => ed.openEdit({ ...a, id0: a.id, pw: "" });

  const filtered = rows.filter(a => {
    if (role && a.role !== role) return false;
    if (!list0.term) return true;
    return `${a.id} ${a.name} ${a.email || ""} ${a.phone || ""}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  const toggleActive = a => {
    if (a.active !== false && isLastDeveloper(rows, a.id)) {
      setBlocked({ name: a.name, why: "마지막 개발자 계정은 사용 중지할 수 없습니다." });
      return;
    }
    patch(a.id, { active: a.active === false }, a.name);
  };

  const askRemove = a => {
    if (a.id === account.id) {
      setBlocked({ name: a.name, why: "지금 로그인한 계정입니다. 다른 개발자 계정으로 들어와 지워 주세요." });
      return;
    }
    if (isLastDeveloper(rows, a.id)) {
      setBlocked({ name: a.name, why: "마지막 개발자 계정은 삭제할 수 없습니다." });
      return;
    }
    ed.askRemove(a);
  };

  return (
    <>
      <PageHeader title="계정 관리" count={`${filtered.length}개`}
        note={`개발자 계정만 볼 수 있는 화면입니다. 입력 항목은 명세서 9장을 따릅니다.`}
        action={<Button variant="primary" icon="user-plus" onClick={ed.openNew}>계정 등록</Button>} />

      <Toolbar>
        <ListSearch state={list0} placeholder="아이디 · 이름 · 이메일 검색" />
        <Select value={role} options={ROLE_FILTER} onChange={e => setRole(e.target.value)} />
        <PageSizeSelect state={list0} />
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
          { key: "role", label: "권한", width: 130, sortable: true,
            render: a => (
              <Badge tone={a.role === "DEVELOPER" ? "warning" : "neutral"} size="sm">
                {ROLE_LABEL[a.role] || a.role}
              </Badge>
            ) },
          { key: "email", label: "이메일", render: a => a.email || EMPTY_MARK },
          { key: "phone", label: "연락처", width: 150, render: a => a.phone || EMPTY_MARK },
          { key: "active", label: "사용", width: 100, align: "center", sortable: true,
            render: a => (
              <Switch checked={a.active !== false}
                label={<span style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
                  {a.active === false ? "중지" : "사용"}
                </span>}
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
        <b>권한 범위</b> — 시청 담당자는 등록·수정·삭제, 오류신고 처리, 통계 조회, 운영 설정까지
        모두 할 수 있습니다. 개발자 전용은 <b>계정 관리와 API 쿼터 설정</b> 두 가지뿐이며,
        잘못 건드리면 서비스가 멈추거나 비용이 발생하는 항목이라 분리했습니다 (명세서 9장).
      </Notice>
      <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-3)" }}>
        <b>동작 규칙</b> — 로그인 {MAX_ATTEMPTS}회 실패 시 {LOCK_MINUTES}분 잠금 ·
        세션 {SESSION_HOURS}시간 · 마지막 개발자 계정은 비활성화·삭제 불가.
        서버 연동 전이라 비밀번호가 브라우저 안에 평문으로 있습니다 — 실서비스에서는
        서버가 해시로 보관하고 이 화면은 값을 읽지 않습니다.
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
        footnote="이 계정으로 로그인할 수 없게 됩니다. 지난 변경 이력에 남은 이름은 그대로 유지됩니다. 잠시 쓰지 않을 뿐이라면 삭제 대신 [사용] 토글을 꺼 주세요."
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
              개발자 계정이 하나도 남지 않으면 계정 관리와 API 쿼터 설정에 아무도 들어갈 수 없게 됩니다. 서버가 없는 지금은 그것을 되돌리는 방법이
              소스 수정뿐입니다 (명세서 9장).
            </p>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Accounts;
