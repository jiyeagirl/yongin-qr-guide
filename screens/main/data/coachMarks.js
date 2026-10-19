import React from "react";

/* 코치마크(U-CM-19)는 **상점가 둘러보기를 누르면 뜬다** (2026-10-19, 사용자 요청 — 첫 진입에서 자동으로 뜨던 것을
 * 한 번 없앴다가 이 시점으로 되살렸다). 상점·축제 QR 의 첫 상세에서 [상점가 둘러보기]로 셸에 들어서는 순간이 탭바를
 * 처음 보는 때라, 그때 탭 세 개를 짚어준다. 이 페이지 로드에서 **한 번만** 뜬다(다시 눌러도 또 뜨지 않는다). 새로고침하면
 * 다시 뜬다 — 「봤다」를 `localStorage` 에 적지 않는다. 검수 플래그 `?coach=1` 은 처음부터 연다.
 *
 * 무엇을 어떻게 그리는지는 디자인 시스템의 `CoachMarks` 가, 무슨 말을 적는지는 `MainApp` 이 안다. */
/* 화면이 쓰는 한 줄짜리 규약: `[열려 있는가, 닫는 함수]`.
 *
 * `force` 는 검수 플래그 `?coach=1` 이다 (`data/qr.js`). 이것이 켜졌을 때만 열린다.
 *
 * 첫 판정을 `useState` 의 초기값으로 한 번만 한다. 렌더마다 저장소를 읽으면 닫은 뒤에도
 * 한 프레임 동안 열린 값이 나온다. */
export function useCoachMarks(force = false) {
  const [open, setOpen] = React.useState(() => Boolean(force));
  const shown = React.useRef(Boolean(force));

  const close = React.useCallback(() => setOpen(false), []);
  /* [상점가 둘러보기]가 부른다 — 이 로드에서 처음 부를 때만 연다 */
  const show = React.useCallback(() => {
    if (shown.current) return;
    shown.current = true;
    setOpen(true);
  }, []);

  return [open, close, show];
}

export default useCoachMarks;
