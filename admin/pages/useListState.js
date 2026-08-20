import React from "react";
import { Select, SearchField } from "../../design-systems/admin.js";

/* 목록 화면 공통 규격 (명세서 1장) — 열 개 목록 화면이 같은 것을 쓴다.
 *
 *   "페이지당 20·50·100행(기본 20), 열 헤더 클릭 정렬, 통합 검색(최소 2자),
 *    상세 복귀 시 필터·스크롤 유지, 체크박스 다중 선택 후 일괄 처리,
 *    삭제 시 대상 명칭 포함 확인 모달, 수정 중 이탈 시 확인"
 *
 * 이 훅이 맡는 것은 그중 넷이다. 나머지는 다른 곳에 있다:
 *   정렬        DataTable 안 (어떻게 늘어놓을지는 표의 일이다)
 *   필터 유지   상세를 **다이얼로그로 여는 구조** 자체가 지킨다 (아래)
 *   삭제 확인   ConfirmDialog
 *   이탈 확인   useRecordEditor
 *
 * ── 최소 2자인 이유 ─────────────────────────────────────────────────────────
 * 335곳짜리 목록에서 한 글자는 거의 아무 것도 걸러내지 못한다("김"으로 60곳이 남는다).
 * 그런데 그 한 글자를 치는 순간 목록이 흔들려, 담당자는 두 번째 글자를 치기 전에
 * 이미 결과가 바뀐 화면을 본다. 두 글자부터 거르면 타이핑 도중의 깜빡임이 없다.
 *
 * ── 상세 복귀 시 필터가 유지되는 이유 ───────────────────────────────────────
 * 시민용 셸이 상세를 오버레이로 여는 것과 같은 이유다 (CLAUDE.md). 목록을 페이지로
 * 나누고 상세를 다른 페이지로 두면, 335곳에서 조건을 좁혀놓고 한 곳 눌러본 뒤
 * 돌아왔을 때 처음부터 다시 걸어야 한다. 다이얼로그는 목록을 언마운트하지 않으므로
 * 필터도 쪽 번호도 스크롤 위치도 그대로 남는다 — 지키려고 애쓸 것이 없다.
 */

export const PAGE_SIZES = [20, 50, 100];
export const MIN_SEARCH = 2;

export function useListState(deps = [], initialSize = PAGE_SIZES[0]) {
  const [q, setQ] = React.useState("");
  const [size, setSize] = React.useState(initialSize);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);

  /* 조건이 바뀌면 첫 쪽으로. 그러지 않으면 12쪽을 보다 검색어를 넣었을 때
     결과가 3쪽뿐이라 빈 화면이 뜬다. 선택도 함께 비운다 — 화면에서 사라진 행이
     선택된 채로 남아 있으면 [일괄 처리]가 보이지 않는 것에 손을 댄다 */
  React.useEffect(() => {
    setPage(1);
    setSelected([]);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [q, size, ...deps]);

  /* 두 글자 미만이면 검색어가 없는 것으로 친다. 화면은 "치고 있는 글자"를 그대로
     보여주되(q), 거르는 데 쓰는 값은 이것이다 */
  const term = q.trim().length >= MIN_SEARCH ? q.trim() : "";

  const paginate = React.useCallback((list) => {
    const pageCount = Math.max(1, Math.ceil(list.length / size));
    const safe = Math.min(page, pageCount);
    return { pageCount, page: safe, rows: list.slice((safe - 1) * size, safe * size) };
  }, [page, size]);

  return { q, setQ, term, size, setSize, page, setPage, selected, setSelected, paginate };
}

/* 필터 줄의 왼쪽 — 어느 화면에서나 같은 자리, 같은 폭이다.
   화면마다 SearchField 를 다시 놓으면 placeholder 만 다른 것이 아니라 폭도 조금씩 달라진다. */
export function ListSearch({ state, placeholder, width = 320 }) {
  return (
    <SearchField value={state.q} onChange={e => state.setQ(e.target.value)} onClear={() => state.setQ("")}
      placeholder={placeholder} style={{ width }} />
  );
}

/* 쪽 크기 고르개. 오른쪽 끝(Toolbar 의 actions)이 아니라 왼쪽 필터들과 같은 줄에 둔다 —
   이것도 "무엇을 보여줄지"를 정하는 값이지 목록을 가지고 하는 일이 아니다. */
export function PageSizeSelect({ state }) {
  return (
    <Select value={state.size} onChange={e => state.setSize(Number(e.target.value))}
      options={PAGE_SIZES.map(n => ({ value: n, label: `${n}행씩` }))} />
  );
}

/* 검색어가 한 글자일 때 한 줄로 알린다. 아무 말도 없으면 "검색이 안 되는" 것으로 읽힌다 */
export function SearchHint({ state }) {
  if (!state.q.trim() || state.term) return null;
  return (
    <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
      {MIN_SEARCH}자 이상 입력하면 검색합니다.
    </span>
  );
}
