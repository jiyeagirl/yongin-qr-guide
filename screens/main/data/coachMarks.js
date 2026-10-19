import React from "react";

/* 코치마크(U-CM-19)는 **더 이상 첫 진입에서 자동으로 뜨지 않는다** (2026-10-19, 사용자 요청).
 * 첫 화면이 상점·축제 QR 의 상세로 바뀌고 쿠폰 팝업이 서면서 탭바 안내가 필요 없어졌다.
 * 검수 플래그 `?coach=1` 로만 열린다 — 루트 index.html 의 「예외상황 화면」이 그 입구다.
 * 그래서 「봤다는 사실」을 `localStorage` 에 적던 장치(`yongin.coach.v1`)도 없앴다. 이 플래그로
 * 연 것은 닫아도 아무것도 적지 않는다.
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

  const close = React.useCallback(() => setOpen(false), []);

  return [open, close];
}

export default useCoachMarks;
