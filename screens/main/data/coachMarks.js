import React from "react";
import { safeStore } from "./sessionStore.js";

/* 코치마크(U-CM-19)를 **처음 온 사람에게만** 보인다는 사실 하나를 여기서 기억한다.
 * 무엇을 어떻게 그리는지는 디자인 시스템의 `CoachMarks` 가, 무슨 말을 적는지는
 * `MainApp` 이 안다 — 이 파일이 아는 것은 "봤는가"뿐이다.
 *
 * ── 왜 localStorage 인가 ────────────────────────────────────────────────────
 * 코스 방문 기록(courseVisits.js)이 sessionStorage 인 것과 **반대 이유**다. 저쪽은 한
 * 번의 나들이 안에서 끝나는 값이라 그 나들이만큼만 남으면 되지만, 이쪽이 답하는 물음은
 * 「이 서비스를 처음 보는가」다 — 탭을 닫았다 몇 달 뒤 다른 안내판에서 다시 찍어도
 * 그때는 처음이 아니다. 세션에 두면 **QR 을 찍을 때마다 처음 온 사람이 된다.**
 *
 * ── 저장이 막혀 있으면 보인다 ───────────────────────────────────────────────
 * 사파리 비공개 모드나 쿠키 차단이면 `safeStore` 가 null 을 돌려준다. 그때는 적을 곳이
 * 없으므로 **매번 처음으로 친다.** 반대로 정할 수도 있었지만(모르면 안 보인다), 이
 * 서비스에서 저장소를 못 쓰는 사람은 대개 **정말로 처음 온 사람**이다 — QR 을 한 번
 * 찍고 마는 것이 이 서비스의 보통 쓰임이라, 안 보이는 쪽으로 기울면 이 안내가 정작
 * 필요한 사람에게 닿지 않는다. 잘못 보이는 값은 [×] 한 번으로 끝나고, 잘못 안 보이는
 * 값은 되살릴 방법이 없다.
 *
 * ── 키에 판 번호를 단다 ─────────────────────────────────────────────────────
 * 안내 문구가 통째로 바뀌면(탭이 늘거나 하는 일이 달라지면) 이미 본 사람에게도 다시
 * 보여야 하는데, 그때 되살릴 수 있는 길은 키를 올리는 것뿐이다. 뒤늦게 붙이면 옛 키에
 * 적힌 값이 어느 판의 안내를 봤다는 뜻인지 알 수 없다.
 */
const KEY = "yongin.coach.v1";

function seen() {
  const s = safeStore("localStorage");
  if (!s) return false;
  try {
    return s.getItem(KEY) === "1";
  } catch (e) {
    return false; /* 읽지 못하면 처음 온 것으로 본다 (위 머리말) */
  }
}

function remember() {
  const s = safeStore("localStorage");
  if (!s) return;
  try {
    s.setItem(KEY, "1");
  } catch (e) {
    /* 용량 초과 등 — 화면은 이미 닫혔으므로 그대로 진행한다 */
  }
}

/* 화면이 쓰는 한 줄짜리 규약: `[열려 있는가, 닫는 함수]`.
 *
 * `force` 는 검수 플래그 `?coach=1` 이다 (`data/qr.js`). 한 번 보고 나면 그 브라우저에서는
 * 다시 볼 수 없어서, 없으면 이 화면을 검수할 방법이 새 프로필을 여는 것뿐이 된다.
 * **닫아도 적지 않는다** — 적으면 강제로 켜 놓고 한 번 닫는 순간 그 플래그가 스스로
 * 망가진다 (`config.js` 의 TODAY 와 같은 성격의 검수 장치다).
 *
 * 첫 판정을 `useState` 의 초기값으로 한 번만 한다. 렌더마다 저장소를 읽으면 닫은 뒤에도
 * 한 프레임 동안 열린 값이 나온다. */
export function useCoachMarks(force = false) {
  const [open, setOpen] = React.useState(() => force || !seen());

  const close = React.useCallback(() => {
    setOpen(false);
    if (!force) remember();
  }, [force]);

  return [open, close];
}

export default useCoachMarks;
