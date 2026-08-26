import React from "react";
import { SearchField } from "../../design-systems/admin.js";

/* 목록 화면 공통 규격 (명세서 1장) — 열 개 목록 화면이 같은 것을 쓴다.
 *
 *   "페이지당 20행, 열 헤더 클릭 정렬, 이름 한 칸 검색(최소 2자. 2026-08-26 이전에는
 *    「통합 검색」이라 서너 칸을 이어 훑었다 — ListSearch 머리말),
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

/* ── 한 쪽에 20행. 고르개를 두지 않는다 (2026-08-20, 사용자 요청) ────────────
   전에는 필터 줄 끝에 [20행씩 ▾] 고르개가 서서 50·100을 고를 수 있었다. 뺀 이유:

   - **필터 줄의 자리를 먹는다.** 오류신고는 고르개가 여섯이라 줄이 두 줄로 접혔고,
     그중 하나가 "무엇을 볼지"가 아니라 "몇 줄씩 볼지"였다.
   - **거의 쓰이지 않는다.** 목록이 긴 화면은 점포(335곳) 하나뿐이고, 거기서도 담당자가
     오는 이유는 한 곳을 찾는 것이라 검색으로 좁힌다. 100행을 펼쳐 훑을 일이 아니다.
   - 100행을 골라 둔 채 다른 화면으로 가면 6건짜리 목록에도 그 값이 남아, 쪽 번호가
     사라진 이유를 화면이 설명하지 못했다.

   더 보려면 쪽을 넘긴다. 값이 하나라 화면마다 다르게 보일 일도 없다. */
export const PAGE_SIZE = 20;
export const MIN_SEARCH = 2;

export function useListState(deps = []) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);

  /* 조건이 바뀌면 첫 쪽으로. 그러지 않으면 12쪽을 보다 검색어를 넣었을 때
     결과가 3쪽뿐이라 빈 화면이 뜬다. 선택도 함께 비운다 — 화면에서 사라진 행이
     선택된 채로 남아 있으면 [일괄 처리]가 보이지 않는 것에 손을 댄다 */
  React.useEffect(() => {
    setPage(1);
    setSelected([]);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [q, ...deps]);

  /* 두 글자 미만이면 검색어가 없는 것으로 친다. 화면은 "치고 있는 글자"를 그대로
     보여주되(q), 거르는 데 쓰는 값은 이것이다 */
  const term = q.trim().length >= MIN_SEARCH ? q.trim() : "";

  const paginate = React.useCallback((list) => {
    const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safe = Math.min(page, pageCount);
    return { pageCount, page: safe, rows: list.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE) };
  }, [page]);

  return { q, setQ, term, page, setPage, selected, setSelected, paginate };
}

/* 필터 줄의 왼쪽 — 어느 화면에서나 같은 자리다.
   화면마다 SearchField 를 다시 놓으면 placeholder 만 다른 것이 아니라 폭도 조금씩 달라진다.

   ── 폭을 고정하지 않고 남는 자리를 채운다 (2026-08-20, 사용자 요청) ─────────
   320px 로 박아 두었더니 1,440px 화면에서 검색창이 필터 줄의 4분의 1도 안 됐다. 고르개
   두엇만 있는 화면에서는 오른쪽이 통째로 비는데, 정작 이 줄에서 가장 많이 쓰는 칸이
   가장 좁았다 — 담당자가 목록에 오는 이유의 대부분이 **한 곳을 찾는 것**이다.

   `flex: 1 1 360px` 이라 고르개가 적으면 넓게 펴지고 많으면 360px 까지 물러선다.
   280px 밑으로는 줄이지 않는다 — 가장 긴 문구(「QR ID, 지점명 검색」)와 지우기 단추가
   함께 서는 폭이다. (2026-08-26 이전에는 「내용, 대상, 접수번호 검색」이 그 기준이었다.
   문구가 짧아졌지만 하한은 그대로 둔다 — 검색창이 필터 줄에서 가장 많이 쓰는 칸이라
   좁혀서 얻을 것이 없다.)

   ── placeholder 는 **보는 칸의 이름 하나**다 (2026-08-26, 사용자 요청) ──────────
   여덟 화면이 서너 칸을 이어 훑고 그것을 그대로 나열하고 있었다(「골목형 상점가명,
   소재지 검색」). 검색이 한 칸만 보게 되면서 문구도 한 마디가 됐다 — **이 칸이 무엇을
   보는지와 화면에 적힌 말이 언제나 같아야 한다**는 것이 요점이고, 그래서 거르는 코드를
   고치면 이 문구도 함께 고친다.

   나열이 남는 자리는 **QR 지점 하나**다(「QR ID, 지점명 검색」). 거기서는 **쉼표**로
   잇는다 (2026-08-25 규칙) — 이 프로젝트에서 가운뎃점은 **값과 값을 잇는 부호**이고
   (온누리 「지류·디지털」, 업종 칩), 검색창의 나열은 그 반대다: 「이 중 **아무거나**
   치면 됩니다」라는 뜻이라 붙여 읽히면 곤란하다. */
export function ListSearch({ state, placeholder }) {
  return (
    <SearchField value={state.q} onChange={e => state.setQ(e.target.value)} onClear={() => state.setQ("")}
      placeholder={placeholder} style={{ flex: "1 1 360px", minWidth: 280 }} />
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
