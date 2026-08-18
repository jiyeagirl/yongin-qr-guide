/* 한국어 조사 자동 선택.
 *
 * 이 서비스의 안내 문구는 대부분 이름을 끼워 넣는 형태다 —
 * "가장 가까운 {유형}는 1.4km 떨어져 있습니다", "{시설명}으로 안내합니다".
 * 이름이 데이터에서 오므로 조사를 문장에 박아두면 "화장실는", "포곡중학교로"처럼 어색해진다.
 *
 * 받침 판정: 한글 음절은 유니코드에서 (초성, 중성, 종성) 순서로 배열되어 있고
 * 한 초성당 21×28 = 588 음절이다. (코드 - 0xAC00) % 28 이 0 이면 종성이 없다.
 *
 * 한글이 아닌 끝글자(영문 약어, 숫자)는 읽는 소리로 판정한다.
 * 예: "AED" 는 "에이이디"라 받침이 없고, "1층"은 "층"이라 받침이 있다.
 * 표에 없는 문자는 받침 없음으로 본다 — 틀렸을 때 "는/가/로"가 되는데,
 * 이쪽이 "은/이/으로"보다 어색함이 덜하다.
 */

/* 알파벳을 한글로 읽었을 때 받침이 있는 글자 (엘, 엠, 엔, 알) */
const ALPHA_WITH_BATCHIM = new Set(["l", "m", "n", "r"]);
/* 숫자를 한글로 읽었을 때 받침이 있는 것 (일, 삼, 육, 칠, 팔, 십·영) */
const DIGIT_WITH_BATCHIM = new Set(["0", "1", "3", "6", "7", "8"]);

export function hasBatchim(word) {
  if (!word) return false;
  const ch = String(word).trim().slice(-1);
  const code = ch.charCodeAt(0);

  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[a-zA-Z]/.test(ch)) return ALPHA_WITH_BATCHIM.has(ch.toLowerCase());
  if (/[0-9]/.test(ch)) return DIGIT_WITH_BATCHIM.has(ch);
  return false;
}

/* 받침이 있으면 with, 없으면 without.
   josa("화장실", "은", "는") → "은"   josa("쉼터", "은", "는") → "는" */
export function josa(word, withBatchim, withoutBatchim) {
  return hasBatchim(word) ? withBatchim : withoutBatchim;
}

/* 자주 쓰는 짝의 지름길. 이름과 조사를 붙여 돌려준다.
   eun("화장실") → "화장실은"   ro("포곡중학교") → "포곡중학교로" */
export const eun = w => `${w}${josa(w, "은", "는")}`;
export const i = w => `${w}${josa(w, "이", "가")}`;
export const eul = w => `${w}${josa(w, "을", "를")}`;
/* "으로/로" 는 예외가 하나 있다 — ㄹ 받침은 "로" 를 쓴다 (서울로, 둔전1로) */
export const ro = w => {
  const ch = String(w).trim().slice(-1);
  const code = ch.charCodeAt(0);
  const rieul = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8;
  return `${w}${!hasBatchim(w) || rieul ? "로" : "으로"}`;
};
