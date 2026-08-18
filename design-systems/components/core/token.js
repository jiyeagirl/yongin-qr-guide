/* 디자인 토큰을 JS 에서 읽는다.
   지도 SDK 는 CSS 변수를 이해하지 못하므로 (마커 SVG, 클러스터 스타일 등)
   토큰 값을 여기서 한 번 해석해 넘긴다. 화면에서 색을 하드코딩하지 않기 위한 통로다. */
const cache = new Map();

export function token(name, fallback = "") {
  if (typeof window === "undefined" || !window.document) return fallback;
  if (cache.has(name)) return cache.get(name);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const out = v || fallback;
  if (v) cache.set(name, out);
  return out;
}

/* 토큰이 바뀌었을 때(테마 교체 등) 캐시를 비운다. */
export function clearTokenCache() { cache.clear(); }
