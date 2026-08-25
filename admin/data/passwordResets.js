import { useCollection, readCollection, addRow, patchRow } from "./store.js";

/* 비밀번호 초기화 요청 (M01 로그인 → M15 계정 관리).
 *
 * ── 요청이 도착할 자리가 없었다 (2026-08-24, 사용자 요청) ──────────────────
 * 로그인 화면의 [요청 보내기]는 "요청을 접수했습니다"를 띄우고 **아무 데도 남기지 않았다.**
 * 명세서 9장은 "로그인 화면에서 초기화를 요청하면 최종 관리자가 계정 관리에서 새 비밀번호를
 * 넣어 준다"고 적었는데, 계정 관리에는 그 요청을 볼 자리가 없었다 — 담당자가 요청을 보내도
 * 최종 관리자는 전화를 받기 전에는 그 사실을 모른다. 화면이 접수했다고 말하면서 접수하지
 * 않는 것이 이 화면에서 가장 나쁜 종류의 거짓말이다.
 *
 * 이제 요청이 **줄로 남고**, 계정 관리 화면의 세 번째 탭이 그것을 받는다.
 *
 * ── 원본 배열이 없는 유일한 컬렉션이다 ────────────────────────────────────
 * 다른 여섯은 시민 화면이 읽는 상수 배열 위에 덮개를 얹는다 (`store.js` 머리말).
 * 요청은 **전부 화면에서 들어오는 것**이라 덮어야 할 원본이 없다 — 원본은 빈 배열이고
 * 모든 줄이 `added` 에 쌓인다. 덮개 구조를 그대로 타는 이유는 이력·구독·초기화가 전부
 * 거기 붙어 있기 때문이다: 따로 저장소를 만들면 [데모 데이터 초기화]가 이것만 남긴다.
 *
 * **빈 배열을 모듈 상수로 둔다.** `useCollection` 이 원본을 의존성으로 쓰므로
 * (`[source, JSON.stringify(ov)]`), 화면에서 `[]` 를 넘기면 매 렌더 새 배열이 되어
 * 목록이 매번 다시 겹쳐진다.
 *
 * ── 지우지 않고 [처리 완료]로 닫는다 ──────────────────────────────────────
 * 요청은 **누가 언제 무엇을 부탁했는가**의 기록이고, 비밀번호를 바꿔 준 뒤에도 그 기록은
 * 남아야 한다 (명세서 10장의 "물리 삭제 없음"과 같은 이유다). 그래서 상태 둘뿐이다 —
 * 대기와 처리 완료. **되돌리는 길은 없다** (2026-08-25, 사용자 요청 — 그때까지는 수정 창의
 * [대기로 되돌리기]가 맡았다). 닫는 것은 새 비밀번호를 [저장]하는 일과 한 몸이라, 되돌릴
 * 만한 오조작이 아니다. 계정이 없어 열 창조차 없는 요청만 안내창에서 손으로 닫는다.
 */

export const RESET_KEY = "pwresets";
export const RESET_LABEL = "비밀번호 초기화 요청";

/* 원본 없음 — 위 머리말 참조. 모듈 상수여야 한다 */
export const RESET_SEED = [];

export const RESET_OPEN = "open";
export const RESET_DONE = "done";

export const isOpenReset = r => r.status !== RESET_DONE;

/* 로그인 화면이 부른다 (세션 밖이라 훅을 쓸 수 없다 — store.js 의 addRow 머리말).
 *
 * **최종 관리자 아이디는 여기까지 오지 않는다** (2026-08-25). 그 요청을 받을 사람이 자기
 * 자신이라 보내 봐야 아무도 볼 수 없다 — 부르는 쪽이 `canRequestReset()` 으로 먼저 거른다
 * (`account.js`). 여기서 한 번 더 보지 않는 이유는 **조용히 버리는 것이 더 나쁘기**
 * 때문이다: 화면이 「접수했습니다」를 띄운 뒤 줄이 없으면 아무도 그 사실을 모른다.
 * 막는 자리는 담당자에게 이유를 말할 수 있는 자리 하나여야 한다.
 *
 * **같은 아이디의 대기 요청이 이미 있으면 그 줄을 고친다.** 새 줄을 쌓으면 [요청 보내기]를
 * 세 번 누른 담당자 하나가 목록을 세 줄로 채우고, 최종 관리자는 그것이 세 사람인지 한
 * 사람인지 아이디를 견주어 봐야 안다. 사유와 시각은 마지막 것이 맞다 — 다시 보낸 이유가
 * 대개 앞의 것을 고쳐 적으려는 것이기 때문이다.
 * 처리 완료된 옛 요청은 건드리지 않는다. 그것은 지난 기록이지 지금의 부탁이 아니다. */
export function submitReset(loginId, note) {
  const id = String(loginId || "").trim();
  const at = new Date().toISOString();
  const open = readCollection(RESET_KEY, RESET_SEED)
    .find(r => r.loginId === id && isOpenReset(r));

  if (open) {
    patchRow(RESET_KEY, open.id, { at, note: String(note || "").trim(), again: (open.again || 1) + 1 },
      id, RESET_LABEL);
    return open.id;
  }
  return addRow(RESET_KEY, {
    loginId: id, name: id, at, note: String(note || "").trim(), status: RESET_OPEN,
  }, RESET_LABEL);
}

/* 내비 배지와 탭 숫자가 읽는다 — 둘 다 훅 밖이다 */
export function readOpenResets() {
  return readCollection(RESET_KEY, RESET_SEED).filter(isOpenReset);
}

export function useResetRequests() {
  return useCollection(RESET_KEY, RESET_SEED, null, RESET_LABEL);
}

/* 요청 목록은 **최근 것이 위**다. 다른 목록들이 원본 순서를 지키는 것과 다른데,
   저쪽의 차례는 자료의 차례(거리순·이름순)이고 여기의 차례는 **들어온 차례**라
   가장 새로 온 부탁이 맨 위에 있어야 한다 (변경 이력의 readHistory 와 같다). */
export function sortResets(rows) {
  return rows.slice().sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}

/* 「08-24 14:20」. 연도를 적지 않는다 — 탭을 닫으면 비워지는 목록이라 해가 넘어갈 일이
   없고, 폭이 좁아야 사유가 잘리지 않는다. 실연동 뒤 목록이 길어지면 그때 연도를 붙인다 */
export function resetTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
