import React from "react";
import { validate } from "../data/fields.js";

/* 등록·수정·삭제의 상태 한 벌 — 목록 화면 아홉 개가 같은 것을 쓴다.
 *
 * 화면마다 따로 두면 useState 가 아홉 벌 생기고, 그중 하나는 반드시 다르게 동작한다.
 * 실제로 갈릴 만한 자리가 넷 있다:
 *
 *   1. 저장 실패(필수 항목 누락) 때 다이얼로그를 닫느냐 — **닫지 않는다.**
 *      닫으면 담당자가 채운 것이 통째로 날아가고, 무엇이 잘못됐는지도 못 본다
 *   2. 오류를 언제 지우느냐 — **그 칸을 고치는 순간.** 저장을 다시 눌러야 사라지면
 *      고쳐놓고도 빨간 글씨가 남아 고친 것이 맞는지 알 수 없다
 *   3. 새 등록의 초기값 — **빈 객체가 아니라 initial()** 이다. 유형처럼 반드시 하나를
 *      골라야 하는 칸은 미리 첫 값을 넣어두지 않으면 폼이 어떤 항목을 보일지 정하지 못한다
 *   4. **수정 중 이탈 시 확인** (명세서 1장 공통 규격). 아래.
 *
 * ── 이탈 확인은 "고친 것이 있을 때만" 뜬다 ──────────────────────────────────
 * 열어보기만 하고 [취소]를 누르는 일이 실제로는 더 잦다 — 담당자가 목록에서 한 줄을
 * 눌러 값을 확인하고 닫는 것이 이 화면의 가장 흔한 동작이다. 거기에 매번 "정말
 * 닫을까요?"가 뜨면 사흘 뒤에는 아무도 그 문구를 읽지 않는다.
 *
 * 그래서 **처음 값과 지금 값을 견주어** 달라졌을 때만 묻는다. 견주는 대상이 항목표가
 * 아니라 draft.values 전체인 것은 1:N 목록(구역 주소·프로그램·부스)도 함께 봐야 하기
 * 때문이다 — 주소를 세 줄 적어놓고 닫는 것도 잃을 것이 있는 이탈이다.
 *
 * fieldsFor(values) 가 값에 따라 항목을 바꾼다 — 공공시설은 유형에 따라 폼이 통째로 갈린다.
 */
/* ── 삭제 기계가 여기 있었다 (2026-08-26 삭제, 사용자 요청) ────────────────────
 * `onRemove` prop 과 `pending` 상태, `askRemove` · `cancelRemove` · `confirmRemove`.
 * **화면 열여섯 중 어느 하나도 더 이상 부르지 않는다** — 정보 관리 다섯이 v1.15 에서,
 * QR 지점과 계정 관리가 2026-08-26 에 [삭제]를 닫았다. 부르는 곳 없는 기계를 남겨 두면
 * 다음 사람이 「여기 있으니 써도 되는 것」으로 읽는다.
 *
 * `leaving`(이탈 확인)은 그대로다 — 그쪽은 지우는 일이 아니라 **고치다 만 것을 버리는**
 * 일이고, 화면 전부가 쓴다.
 */
export function useRecordEditor({
  fieldsFor, initial, onSave, onToast, label = "항목",
  /* 항목 하나만 봐서는 알 수 없는 검사 — 기간 역전(V-07), 아이디 중복, 최소 1건 같은 것들.
     항목표에 적을 수가 없어 화면이 넘긴다. { key: "메시지" } 를 돌려주면 그 칸에 붙는다 */
  extraValidate,
}) {
  const [draft, setDraft] = React.useState(null);      /* { values, base, isNew } */
  const [errors, setErrors] = React.useState({});
  const [leaving, setLeaving] = React.useState(false); /* 이탈 확인 중 */

  const openNew = React.useCallback(() => {
    setErrors({});
    const values = initial ? initial() : {};
    setDraft({ values, base: values, isNew: true });
  }, [initial]);

  const openEdit = React.useCallback(row => {
    setErrors({});
    /* 원본 행을 복사해 넘긴다. 그대로 넘기면 입력할 때마다 목록의 행이 바뀌어,
       취소를 눌러도 되돌아오지 않는다 */
    const values = { ...row };
    setDraft({ values, base: values, isNew: false });
  }, []);

  const dirty = !!draft && JSON.stringify(draft.values) !== JSON.stringify(draft.base);

  /* 실제로 닫는다. 확인 다이얼로그를 거치지 않는 유일한 길이라 저장 성공 뒤에도 이것을 쓴다 */
  const discard = React.useCallback(() => {
    setDraft(null); setErrors({}); setLeaving(false);
  }, []);

  /* 담당자가 [취소]·[X]·ESC 로 닫으려 할 때. 고친 것이 없으면 그냥 닫는다 */
  const close = React.useCallback(() => {
    setDraft(cur => {
      if (!cur) return null;
      if (JSON.stringify(cur.values) !== JSON.stringify(cur.base)) { setLeaving(true); return cur; }
      setErrors({});
      return null;
    });
  }, []);

  const set = React.useCallback((key, value) => {
    setDraft(cur => (cur ? { ...cur, values: { ...cur.values, [key]: value } } : cur));
    setErrors(cur => {
      if (!cur[key]) return cur;
      const next = { ...cur };
      delete next[key];
      return next;
    });
  }, []);

  /* 여러 칸을 한 번에 — 주소 검색이 주소·위도·경도 셋을 함께 돌려준다 (V-02) */
  const setMany = React.useCallback((part) => {
    setDraft(cur => (cur ? { ...cur, values: { ...cur.values, ...part } } : cur));
    setErrors(cur => {
      const next = { ...cur };
      Object.keys(part).forEach(k => delete next[k]);
      return next;
    });
  }, []);

  const save = React.useCallback(() => {
    if (!draft) return;
    const fields = fieldsFor(draft.values);
    const bad = validate(fields, draft.values, extraValidate);
    if (Object.keys(bad).length) {
      setErrors(bad);
      if (onToast) onToast("입력을 확인해 주세요.");
      return;
    }
    onSave(draft.values, draft.isNew);
    if (onToast) onToast(draft.isNew ? `${label}을(를) 등록했습니다.` : `${label} 정보를 저장했습니다.`);
    discard();
  }, [draft, fieldsFor, onSave, onToast, label, discard, extraValidate]);

  return {
    draft, errors, leaving, dirty,
    openNew, openEdit, close, discard, set, setMany, save,
    cancelLeave: () => setLeaving(false),
    fields: draft ? fieldsFor(draft.values) : [],
  };
}

export default useRecordEditor;
