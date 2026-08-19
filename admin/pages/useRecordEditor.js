import React from "react";
import { validate } from "../data/fields.js";

/* 등록·수정·삭제의 상태 한 벌 — 목록 화면 여섯 개가 같은 것을 쓴다.
 *
 * 화면마다 따로 두면 useState 가 여섯 벌 생기고, 그중 하나는 반드시 다르게 동작한다.
 * 실제로 갈릴 만한 자리가 셋 있다:
 *
 *   1. 저장 실패(필수 항목 누락) 때 다이얼로그를 닫느냐 — **닫지 않는다.**
 *      닫으면 담당자가 채운 것이 통째로 날아가고, 무엇이 잘못됐는지도 못 본다
 *   2. 오류를 언제 지우느냐 — **그 칸을 고치는 순간.** 저장을 다시 눌러야 사라지면
 *      고쳐놓고도 빨간 글씨가 남아 고친 것이 맞는지 알 수 없다
 *   3. 새 등록의 초기값 — **빈 객체가 아니라 initial()** 이다. 유형처럼 반드시 하나를
 *      골라야 하는 칸은 미리 첫 값을 넣어두지 않으면 폼이 어떤 항목을 보일지 정하지 못한다
 *
 * fieldsFor(values) 가 값에 따라 항목을 바꾼다 — 공공시설은 유형에 따라 폼이 통째로 갈린다.
 */
export function useRecordEditor({ fieldsFor, initial, onSave, onRemove, onToast, label = "항목" }) {
  const [draft, setDraft] = React.useState(null);      /* { values, isNew } */
  const [errors, setErrors] = React.useState({});
  const [pending, setPending] = React.useState(null);  /* 삭제 확인 중인 행 */

  const openNew = React.useCallback(() => {
    setErrors({});
    setDraft({ values: (initial ? initial() : {}), isNew: true });
  }, [initial]);

  const openEdit = React.useCallback(row => {
    setErrors({});
    /* 원본 행을 복사해 넘긴다. 그대로 넘기면 입력할 때마다 목록의 행이 바뀌어,
       취소를 눌러도 되돌아오지 않는다 */
    setDraft({ values: { ...row }, isNew: false });
  }, []);

  const close = React.useCallback(() => { setDraft(null); setErrors({}); }, []);

  const set = React.useCallback((key, value) => {
    setDraft(cur => (cur ? { ...cur, values: { ...cur.values, [key]: value } } : cur));
    setErrors(cur => {
      if (!cur[key]) return cur;
      const next = { ...cur };
      delete next[key];
      return next;
    });
  }, []);

  const save = React.useCallback(() => {
    if (!draft) return;
    const fields = fieldsFor(draft.values);
    const bad = validate(fields, draft.values);
    if (Object.keys(bad).length) {
      setErrors(bad);
      if (onToast) onToast("필수 항목을 채워 주세요.");
      return;
    }
    onSave(draft.values, draft.isNew);
    if (onToast) onToast(draft.isNew ? `${label}을(를) 등록했습니다.` : `${label} 정보를 저장했습니다.`);
    close();
  }, [draft, fieldsFor, onSave, onToast, label, close]);

  const confirmRemove = React.useCallback(() => {
    if (!pending) return;
    onRemove(pending.id);
    if (onToast) onToast(`${label}을(를) 삭제했습니다.`);
    setPending(null);
  }, [pending, onRemove, onToast, label]);

  return {
    draft, errors, pending,
    openNew, openEdit, close, set, save,
    askRemove: setPending, cancelRemove: () => setPending(null), confirmRemove,
    fields: draft ? fieldsFor(draft.values) : [],
  };
}

export default useRecordEditor;
