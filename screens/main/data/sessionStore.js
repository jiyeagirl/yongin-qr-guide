/* 브라우저 저장소에 조심스럽게 접근하는 한 가지 방법.
 *
 * 저장소는 통째로 막힐 수 있다 — 사파리 비공개 모드, 쿠키 차단, iframe 안의 서드파티
 * 컨텍스트. 게다가 `window.sessionStorage` 는 **읽는 것만으로도** 예외를 던지는 환경이
 * 있어서 `if (window.sessionStorage)` 같은 검사로는 걸러지지 않는다. 그래서 실제로 한 번
 * 써보고(write-probe) 통과한 것만 돌려준다.
 *
 * 막혀 있을 때 null 을 돌려주는 것은 **호출부가 저장을 포기하고 계속 가라는 뜻**이다.
 * 여기 저장되는 것(경로 캐시, 코스 방문 기록)은 전부 편의를 위한 값이라, 저장에 실패했다고
 * 화면이 멈추면 안 된다.
 *
 * walkRoute.js 와 courseVisits.js 가 같이 쓴다 — 같은 예외 처리를 두 번 적으면 한쪽만
 * 고쳐지는 일이 생긴다.
 */
export function safeStore(name) {
  try {
    const s = window[name];
    s.setItem("__t", "1");
    s.removeItem("__t");
    return s;
  } catch (e) {
    return null;
  }
}

export default safeStore;
