import { loadKakaoMaps } from "../../../design-systems/index.js";
import { KAKAO_APP_KEY } from "../config.js";
import { DONGBAEK_BUILDINGS, DONGBAEK_ROAD_PREFIX, setBuildingPos, hasBuildingPos } from "./dongbaekStores.js";

/* 동백이음길 건물의 좌표를 카카오 주소 검색(Geocoder, services 라이브러리)으로 찾는다 (2026-10-19).
 * 받은 자료에 좌표가 없기 때문이다(dongbaekStores.js 머리말). 한 번만 돈다 — 이 세션에서 이미 찾은 건물은
 * 다시 묻지 않는다. 지도 SDK 를 받지 못하면 조용히 임시 위치로 남는다(화면이 SDK 오류를 따로 그린다).
 * 이 파일이 따로 있는 것은 데이터 표(dongbaekStores.js)가 디자인 시스템을 가져오지 않게 하려는 것이다. */
let started = false;

export function ensureDongbaekGeocoded() {
  if (started) return;
  started = true;
  loadKakaoMaps(KAKAO_APP_KEY).then(kakao => {
    if (!kakao.maps.services) return;
    const geo = new kakao.maps.services.Geocoder();
    DONGBAEK_BUILDINGS.forEach(b => {
      if (hasBuildingPos(b.id)) return;
      geo.addressSearch(`${DONGBAEK_ROAD_PREFIX}${b.road}`, (res, status) => {
        if (status !== kakao.maps.services.Status.OK || !res || !res[0]) return;
        setBuildingPos(b.id, { lat: Number(res[0].y), lng: Number(res[0].x) });
      });
    });
  }).catch(() => { started = false; });
}
