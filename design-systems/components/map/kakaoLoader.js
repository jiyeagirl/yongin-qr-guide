/* 카카오맵 JavaScript SDK 로더.
   - appkey 는 JavaScript 키다. Kakao Developers >
     [앱 설정 > 앱 > 플랫폼 키 > JavaScript 키 > SDK 도메인] 에 이 화면을 여는 주소를 등록해야
     지도가 뜬다. (예전 [플랫폼 > Web > 사이트 도메인] 경로에서 바뀌었다)
     localhost 와 127.0.0.1 은 서로 다른 도메인으로 취급되며 포트까지 일치해야 한다.
   - autoload=false + kakao.maps.load() 로 초기화 시점을 우리가 잡는다.
   - libraries=clusterer 는 U-ST-13(점포 마커 클러스터링)에 필수다. services 는
     주소 검색용으로 함께 받아둔다 (구역 판정은 서버의 도로명주소 매칭이므로 지도에서는 쓰지 않는다). */

const TIMEOUT_MS = 10000;

let promise = null;

const origin = () => (typeof location !== "undefined" ? location.origin : "이 주소");

export function loadKakaoMaps(appKey, { libraries = ["clusterer", "services"] } = {}) {
  if (promise) return promise;

  promise = new Promise((resolve, reject) => {
    if (!appKey) return reject(new Error("KAKAO_APP_KEY 가 비어 있습니다. screens/main/config.js 의 KAKAO_APP_KEY 를 확인하세요."));
    if (typeof window === "undefined") return reject(new Error("브라우저 환경이 아닙니다."));

    /* 이미 초기화가 끝나 있으면 그대로 쓴다 */
    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) return resolve(window.kakao);

    let settled = false;
    const done = fn => (...args) => { if (settled) return; settled = true; clearTimeout(timer); fn(...args); };
    const ok = done(resolve);
    const fail = done(reject);

    /* 미등록 도메인이면 카카오가 스크립트를 200 으로 내려주고도 초기화가 끝나지 않는 경우가 있다.
       onerror 가 걸리지 않으므로 타임아웃이 없으면 회색 빈 지도로 영원히 남는다.
       화면에 사유를 띄우려면 반드시 실패로 떨어뜨려야 한다. */
    const timer = setTimeout(() => {
      fail(new Error(
        `지도 초기화가 ${TIMEOUT_MS / 1000}초 안에 끝나지 않았습니다. `
        + `카카오 개발자 콘솔 [앱 설정 > 앱 > 플랫폼 키 > JavaScript 키 > SDK 도메인] 에 `
        + `${origin()} 이 등록되어 있는지, 앱키가 JavaScript 키가 맞는지 확인하세요.`));
    }, TIMEOUT_MS);

    const init = () => {
      if (!window.kakao || !window.kakao.maps) {
        return fail(new Error(`카카오맵 SDK 를 불러오지 못했습니다. ${origin()} 이 SDK 도메인에 등록되어 있는지 확인하세요.`));
      }
      window.kakao.maps.load(() => ok(window.kakao));
    };

    /* 스크립트 태그가 이미 있으면 새로 붙이지 않는다.
       단, 이미 로드가 끝난 태그에 onload 를 다시 걸면 영원히 대기하므로
       로드 완료 여부(window.kakao 존재)로 먼저 갈라야 한다. */
    const existing = document.querySelector("script[data-kakao-sdk]");
    if (existing) {
      if (window.kakao && window.kakao.maps) return init();
      existing.addEventListener("load", init, { once: true });
      existing.addEventListener("error", () => fail(new Error("카카오맵 SDK 요청이 실패했습니다.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoSdk = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`
      + (libraries.length ? `&libraries=${libraries.join(",")}` : "");
    script.onload = init;
    script.onerror = () => fail(new Error(
      `카카오맵 SDK 요청이 실패했습니다. 앱키가 올바른지, ${origin()} 이 SDK 도메인에 등록되어 있는지 확인하세요.`));
    document.head.appendChild(script);
  });

  /* 실패를 영구 캐싱하지 않는다 — 앱키나 도메인을 고친 뒤 다시 시도할 수 있어야 한다 */
  promise.catch(() => { promise = null; });

  return promise;
}
