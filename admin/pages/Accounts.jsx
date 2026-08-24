import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, Button, Badge, Switch,
  Pagination, Modal, SegmentedTabs, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { ACCOUNT_FIELDS, checkPassword, V } from "../data/fields.js";
import { SEED_ACCOUNTS, isLastAccount, isProtectedAccount, SUPER_ID } from "../data/account.js";
import {
  useResetRequests, sortResets, resetTime, isOpenReset, RESET_OPEN, RESET_DONE,
} from "../data/passwordResets.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import {
  removedTab, removedColumns, removedEmpty, undoToast, DEACTIVATE_ON_RESTORE,
  VIEW_ALL, VIEW_REMOVED,
} from "./RemovedItems.jsx";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M15 계정 관리 — **최종 관리자(`admin`)만 들어오는 화면이다.**
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
 *
 * ── 세 번째 탭이 초기화 요청을 받는다 (2026-08-24, 사용자 요청) ────────────
 * 명세서 9장은 "로그인 화면에서 초기화를 요청하면 최종 관리자가 계정 관리에서 새 비밀번호를
 * 넣어 준다"고 적었는데, **받는 자리가 없었다** — 로그인 화면의 [요청 보내기]는 "접수했습니다"를
 * 띄우고 아무 데도 남기지 않았고, 최종 관리자는 전화를 받기 전에는 요청이 온 줄을 몰랐다.
 *
 * 자리를 이 화면에 둔 이유는 **요청을 처리하는 일이 곧 이 표의 일**이기 때문이다. 요청 줄을
 * 누르면 그 계정의 수정 창이 열리고 거기서 비밀번호를 넣는다 — 화면을 따로 만들면 담당자가
 * 아이디를 외워 이 표로 건너와 다시 찾아야 한다. 「휴지통 화면을 만들지 않는다」와 같은
 * 판단이다 (RemovedItems 머리말).
 *
 * 요청은 지우지 않고 [처리 완료]로 닫는다 (`data/passwordResets.js`).
 */

/* 안내창의 둘째 문단. 「하나도 남지 않으면」과는 다른 이야기라 따로 적는다.
   화면에서 두 통로를 다 잠가 두었으므로 지금은 뜨지 않는 문구다 — 잠금이 풀렸을 때
   담당자가 이유 없이 막히지 않도록 안내창 쪽에도 답을 남겨 둔다 */
const SUPER_NOTE = `계정 관리 화면에 들어올 수 있는 계정은 최종 관리자(${SUPER_ID})뿐입니다. `
  + "이 계정이 없어지면 계정을 더하거나 지울 사람이 남지 않습니다.";

const VIEW_RESET = "reset";

export function Accounts({ account, onToast }) {
  const { rows, removed, upsert, remove, restore, patch } = useCollection("accounts", SEED_ACCOUNTS, null, "계정");
  const resets = useResetRequests();
  const [view, setView] = React.useState(VIEW_ALL);
  /* 탭이 바뀌면 검색어와 쪽 번호를 비운다 — 계정 목록에서 「김」을 찾다 요청 탭으로
     건너가면 요청이 하나도 없는 것처럼 보인다. 두 목록이 세는 것이 다르기 때문이다 */
  const list0 = useListState([view]);
  const [blocked, setBlocked] = React.useState(null);

  const openResets = resets.rows.filter(isOpenReset);

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

      /* 비밀번호를 실제로 바꿨으면 그 계정의 대기 요청을 함께 닫는다.
         손으로 [처리 완료]를 또 누르게 하면 언젠가 그 한 번을 빠뜨리고, 그때 배지는
         이미 처리한 일을 가리키게 된다 — 아무도 믿지 않는 숫자가 된다.
         **바뀌었을 때만**이다: 이름 한 글자를 고치려고 연 창이 요청을 닫으면 안 된다 */
      if (prev && pw !== prev.pw) {
        openResets.filter(r => r.loginId === rest.id)
          .forEach(r => resets.patch(r.id, { status: RESET_DONE, doneBy: account.id }, r.loginId));
      }
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

  /* 「전체 | 삭제된 항목 | 비밀번호 초기화 요청」 — 탭이 바꾸는 것은 **거르기 전의
     목록**뿐이다 (RemovedItems). 검색은 세 뷰에 똑같이 걸린다. 지운 것이 스무 건을 넘는
     목록에서 검색이 안 되면 되돌릴 줄을 손으로 찾아야 하고, 뷰마다 검색이 붙었다
     떨어지면 그것도 배울 거리가 된다. */
  const inRemoved = view === VIEW_REMOVED;
  const inReset = view === VIEW_RESET;

  const filtered = inReset
    ? sortResets(resets.rows).filter(r => (!list0.term
      || `${r.loginId} ${r.note || ""}`.includes(list0.term)))
    : (inRemoved ? removed : rows).filter(a => (!list0.term
      || `${a.id} ${a.name} ${a.email || ""} ${a.phone || ""}`.includes(list0.term)));
  const paged = list0.paginate(filtered);

  /* 요청 줄이 가리키는 계정. 오타나 이미 지운 계정이면 없다 — 그 사실이 표에 배지로 뜬다 */
  const accountOf = r => rows.find(a => a.id === r.loginId);

  /* 요청 줄을 누르면 그 계정의 수정 창이 열린다 (비밀번호 칸이 비어 있는 그 창이다).
     여는 것으로 끝이고 요청은 저장하는 쪽에서 닫힌다 — 열어만 보고 닫는 일이 더 잦다 */
  const openFromReset = r => {
    const found = accountOf(r);
    if (!found) {
      setBlocked({ name: r.loginId, plain: true,
        why: "이 아이디로 등록된 계정이 없습니다. 비밀번호를 바꿔 줄 대상이 없습니다.",
        note: "아이디를 잘못 적었거나 이미 삭제된 계정입니다. 삭제한 계정이라면 [삭제된 항목] 탭에서 되돌릴 수 있고, 오타라면 요청한 담당자에게 확인한 뒤 [처리 완료]로 닫아 주세요." });
      return;
    }
    openEdit(found);
  };

  const closeReset = (r, done) => {
    resets.patch(r.id, { status: done ? RESET_DONE : RESET_OPEN, doneBy: done ? account.id : null },
      r.loginId);
    onToast(done ? `${r.loginId} 요청을 처리 완료로 표시했습니다.` : `${r.loginId} 요청을 대기로 되돌렸습니다.`);
  };

  const undo = a => {
    restore(a.id, a.name, DEACTIVATE_ON_RESTORE);
    /* 계정은 사용자 화면과 무관하다 — 켜면 일어나는 일이 "노출"이 아니라 "로그인"이다 */
    onToast(undoToast(`${a.name} 계정`, { field: "사용 여부", tail: "다시 로그인할 수 있습니다" }));
  };

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
      <PageHeader title="계정 관리" count={inReset ? `${filtered.length}건` : `${filtered.length}개`}
        note={`최종 관리자(아이디: ${SUPER_ID})만 접근할 수 있는 화면입니다. 관리자 페이지를 사용할 계정을 등록하거나 삭제할 수 있습니다.`}
        action={inReset ? null
          : <Button variant="primary" icon="user-plus" onClick={ed.openNew}>계정 등록</Button>}
        /* 탭 줄이 셋이라 ViewTabs(전체 | 삭제된 항목) 대신 직접 짠다 — 공공시설이 유형
           탭 줄 끝에 [삭제된 항목]을 이어 붙이는 것과 같은 모양이다. 요청 탭의 숫자는
           **대기 건수**다: 처리한 것까지 세면 줄어들지 않는 숫자가 되어 아무 말도 못 한다 */
        tabs={
          <SegmentedTabs value={view} onChange={setView}
            items={[
              { id: VIEW_ALL, label: "전체" },
              removedTab(removed.length),
              { id: VIEW_RESET,
                label: openResets.length ? `비밀번호 초기화 요청 ${openResets.length}` : "비밀번호 초기화 요청" },
            ]} />
        } />

      <Toolbar>
        <ListSearch state={list0}
          placeholder={inReset ? "아이디 · 사유 검색" : "아이디 · 이름 · 이메일 검색"} />
        <SearchHint state={list0} />
      </Toolbar>

      {inReset ? (
        <DataTable
          caption="비밀번호 초기화 요청 목록"
          rows={paged.rows} rowKey="id"
          onRowClick={openFromReset}
          /* 대기 중인 줄만 눈에 띈다. 처리한 줄은 지난 기록이라 가라앉아 있어야 한다 */
          rowTone={r => (isOpenReset(r) ? "warning" : null)}
          empty={{
            title: "받은 요청이 없습니다.",
            description: "담당자가 로그인 화면에서 [비밀번호를 잊으셨나요?]로 요청하면 여기에 쌓입니다. 브라우저 탭을 닫으면 이 목록도 비워집니다.",
          }}
          columns={[
            { key: "loginId", label: "아이디", width: 190, sortable: true,
              render: r => (
                <Cell>
                  {r.loginId}
                  {accountOf(r) ? null : <Badge tone="danger" size="sm">등록되지 않은 아이디</Badge>}
                  {/* 같은 사람이 다시 보낸 것을 줄 하나로 합쳤다는 사실을 여기서 적는다.
                      적지 않으면 첫 요청의 사유가 조용히 바뀐 것으로 보인다 */}
                  {r.again > 1 ? <Badge tone="neutral" size="sm">{r.again}번째 요청</Badge> : null}
                </Cell>
              ) },
            { key: "at", label: "요청 일시", width: 130, sortable: true,
              render: r => (
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{resetTime(r.at)}</span>
              ) },
            { key: "note", label: "사유", render: r => r.note || EMPTY_MARK },
            { key: "status", label: "상태", width: 104, align: "center", sortable: true,
              render: r => (isOpenReset(r)
                ? <Badge tone="warning" size="sm">대기</Badge>
                : <Badge tone="neutral" size="sm">처리 완료</Badge>) },
            { key: "manage", label: "관리", width: 210, align: "center",
              render: r => (isOpenReset(r) ? (
                <Cell>
                  <Button variant="outline" size="sm" icon="key-round"
                    onClick={e => { e.stopPropagation(); openFromReset(r); }}>비밀번호 변경</Button>
                  <Button variant="ghost" size="sm" icon="check"
                    onClick={e => { e.stopPropagation(); closeReset(r, true); }}>처리 완료</Button>
                </Cell>
              ) : (
                <Button variant="ghost" size="sm" icon="rotate-ccw"
                  onClick={e => { e.stopPropagation(); closeReset(r, false); }}>대기로</Button>
              )) },
          ]} />
      ) : (
        <DataTable
          caption="관리자 계정 목록"
          rows={paged.rows} rowKey="id"
          /* 지운 줄은 열 수 없다 — 고쳐 봐야 목록에 없는 값이고, 되돌리기가 먼저다 */
          onRowClick={inRemoved ? undefined : openEdit}
          rowTone={a => (a.active === false ? "warning" : null)}
          empty={inRemoved ? removedEmpty("계정") : { title: "조건에 맞는 계정이 없습니다." }}
          columns={(cols => (inRemoved ? removedColumns(cols, undo) : cols))([
            { key: "id", label: "아이디", width: 160, sortable: true },
            { key: "name", label: "이름", width: 210, sortable: true,
              render: a => (
                <Cell>
                  {a.name}
                  {isProtectedAccount(a.id) ? <Badge tone="info" size="sm">최종 관리자</Badge> : null}
                  {a.id === account.id ? <Badge tone="brand" size="sm">나</Badge> : null}
                  {/* 이 계정으로 온 초기화 요청이 대기 중이라는 표시. 요청 탭에 가지 않아도
                      목록에서 보인다 — 비밀번호를 바꿔 주는 일은 어차피 이 줄에서 한다 */}
                  {openResets.some(r => r.loginId === a.id)
                    ? <Badge tone="warning" size="sm">비밀번호 초기화 요청</Badge> : null}
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
          ])} />
      )}

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      {/* 표 아래 안내 상자가 있었다 (2026-08-24 삭제, 사용자 요청). 로그인 잠금 · 세션 ·
          최종 관리자 보호 · 마지막 계정 보호 · 비밀번호 초기화 통로를 한 문단에 몰아
          적고 있었는데, 그중 담당자가 **읽어서 할 일이 달라지는 것은 하나도 없었다** —
          막히는 자리는 이미 막힌 컨트롤과 안내창이 그 자리에서 답한다. 화면의 규칙을
          적어 두는 자리는 명세서 9장이고, 표 아래가 아니다. */}

      {/* ── 폼 아래 설명 문단을 두지 않는다 (2026-08-24, 사용자 요청) ──────────
            "비밀번호는 영문·숫자·특수문자 중 두 종류 이상을…"(등록)과 "비워 두면 기존
            비밀번호를 그대로 둡니다…"(수정)가 붙어 있었다. 둘 다 **칸이 이미 하고 있는
            말**이다 — 비밀번호 칸 안에 범위가 적혀 있고, 아이디 칸은 수정 화면에서 읽기
            전용 모양으로 서 있으며, 규칙을 어기면 그 칸 아래에 오류가 뜬다. 담당자는
            폼을 여는 순간 값을 넣으려는 것이지 규칙을 다시 읽으려는 것이 아니다
            (RecordForm 의 「폼 아래 설명 문단을 기본으로 달지 않는다」와 같은 이유).

            대기 중인 초기화 요청은 문단 대신 **머리줄**이 적는다. 한 문장으로 늘어놓으면
            그것도 넘겨 읽는 문단이 되고, 여기서 알아야 하는 것은 사실 하나뿐이다 —
            이 창이 그 요청에 답하는 창이라는 것 */}
      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "계정 등록" : "계정 수정"}
        description={ed.draft && !ed.draft.isNew
          ? `${ed.draft.values.name} · ${ed.draft.values.id}${openResets.some(r => r.loginId === ed.draft.values.id)
            ? " · 비밀번호 초기화 요청 대기" : ""}`
          : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set} />
        ) : null}
      </EditorModal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="계정을 삭제합니다."
        /* 여기도 기본 각주를 쓰지 않는다 — 계정에는 「폐업·폐쇄」도 「사용자 화면」도 없다.
           대신 권하는 것이 [노출 여부]가 아니라 [사용 여부]다. 마지막 줄만 같다. */
        footnote="이 계정으로 로그인할 수 없게 됩니다. 지난 변경 이력에 남은 이름은 그대로 유지됩니다. 잠시 쓰지 않을 뿐이라면 삭제 대신 [사용 여부] 토글을 꺼 주세요. 삭제한 계정은 목록 위 [삭제된 항목]에서 되돌릴 수 있습니다."
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
              {/* 「소스 수정뿐입니다」 꼬리는 **잠금 안내에만** 붙는다 (2026-08-24).
                  전에는 무조건 붙였는데, 요청 탭에서 온 「등록되지 않은 아이디」 안내에는
                  되돌릴 상태라는 것이 아예 없어 그 문장이 무엇을 가리키는지 알 수 없다 */}
              {blocked.note
                || "쓸 수 있는 계정이 하나도 남지 않으면 관리자 화면에 아무도 들어갈 수 없게 됩니다."}
              {blocked.plain ? null : " 서버가 없는 지금은 그것을 되돌리는 방법이 소스 수정뿐입니다."}
            </p>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Accounts;
