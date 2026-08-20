/* 조아용 에셋 목록 (명세서 2-6).
 *
 * ── 코드에 고정한다 ─────────────────────────────────────────────────────────
 * 명세서: "에셋 목록은 코드에 고정하며, 추가하려면 배포가 필요하다. 1차 범위에서 별도
 * 에셋 관리 화면은 두지 않는다." 관리자가 그림을 올릴 수 있게 하면 톤이 무너지고
 * 저작권 확인 부담이 생긴다 — 캐릭터는 시가 관리하는 자산이다.
 *
 * ── 전신 그림만 쓴다 ────────────────────────────────────────────────────────
 * 조아용 아트워크는 1:1 전신(MASCOT_FULL)과 1.5:1 상반신(MASCOT_BUST) 두 종류다.
 * 썸네일 그리드는 여덟 칸이 나란히 서는 자리라, 두 비율을 섞으면 상반신 그림만
 * 얼굴이 확대된 것처럼 보인다 (Mascot.jsx 머리말의 경고 그대로다).
 * 그래서 **전신만** 목록에 올린다.
 *
 * ── 여덟 개인 이유 ──────────────────────────────────────────────────────────
 * 남은 확인 사항 5번: "축제 6건을 서로 다르게 쓰려면 최소 6종 필요". 여덟이면 6건을
 * 겹치지 않게 채우고 둘이 남는다 — 축제가 늘어도 한동안 겹치지 않는다.
 * 지금 등록된 축제 6건이 실제로 여섯 종을 하나씩 쓰고 있다.
 *
 * 이름표는 **표정으로 적는다.** 담당자가 고르는 기준이 "이 축제 분위기에 맞나"이지
 * 파일명이 아니기 때문이다 — 명세서가 "파일명이나 코드값을 입력하게 하지 않는다"고
 * 못 박은 것과 같은 이유다.
 */

export const CHARACTER_ASSETS = [
  { id: "excited", pose: "excited", label: "신남" },
  { id: "thumbsup", pose: "thumbsup", label: "엄지척" },
  { id: "surprised", pose: "surprised", label: "놀람" },
  { id: "front", pose: "front", label: "기본" },
  { id: "curious", pose: "curious", label: "궁금" },
  { id: "shy", pose: "shy", label: "수줍" },
  { id: "glance", pose: "glance", label: "곁눈질" },
  { id: "back", pose: "back", label: "뒷모습" },
];

/* 기본값 — 명세서: "기본값을 지정해 미선택 상태가 나오지 않게 한다."
   축제는 대개 즐거운 자리라 「신남」을 첫 값으로 둔다. */
export const CHARACTER_DEFAULT = "excited";

export const CHARACTER_LABEL = CHARACTER_ASSETS
  .reduce((o, a) => { o[a.id] = a.label; return o; }, {});

/* 그림 파일이 있는 곳. Mascot 이 `${base}assets/character/joayong-{pose}.png` 를 만든다.
   /admin/ 에서 한 단계 위로 올라가면 design-systems 다 — 시민 화면(/screens/main/)이
   두 단계 올라가는 것과 깊이만 다르다. */
export const ASSET_BASE = "../design-systems/";
