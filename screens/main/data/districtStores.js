/* 점포 **실제 자료**를 받은 상점가의 점포 표 (2026-10-19, 사용자 요청 — 동백이음길에서 시작, 동백역 등으로 넓힘).
 *
 * 동백 상권과 협의 중이라 이 상점가들만 더미가 아니라 받은 자료를 넣는다. 자료는 건물 단위 표(지번 · 도로명 ·
 * 점포명)다. 상점가마다 자료 파일(`dongbaekStores.js` …)이 건물 표를 두고 `registerDistrictStores` 로 등록한다.
 *
 * ── 이 자료에 없는 것과 우리가 채운 것 ──────────────────────────────────────
 * 업종 · 온누리 가맹 여부 · 전화 · 영업시간 · 사진 · **좌표**가 없다. 그래서:
 *   · 업종(`cat`·`biz`)은 **점포명의 낱말로 추정**한다(inferCat). 틀릴 수 있다 — 실서비스에서는 자료의 값을 쓴다.
 *   · 온누리 가맹 여부는 모른다. 시 안내에는 **수**만 있다(동백이음길 17곳 · 동백역 94곳). 그런데 화면에 온누리 칩과 거리순
 *     정렬이 있어(상점가 탭과 같은 짜임) 칩이 비어 보이지 않도록 **시연용으로** 그 수만큼을 목록에 고르게 흩어 가맹으로
 *     표시한다(`onnuriCount`). 어느 점포가 실제 가맹인지가 아니다 — 실서비스에서는 서버 자료를 쓴다.
 *   · 좌표는 건물의 도로명주소를 카카오 주소 검색으로 찾는다(`districtGeo.js`). **점포의 좌표는 아니고 건물의**
 *     좌표라, 같은 건물의 점포는 그 둘레 20m 안에 겹치지 않게 흩어 찍는다(점 위치가 아니라 「그 건물 안」이다).
 *     찾기 전이나 못 찾은 건물은 상점가 중심 둘레의 임시 위치를 쓴다.
 *   · 거리(`dist`)는 null 이다 — 화면의 「약 n m」는 QR 지점 기준인데 이 점포들은 다른 동네라 말이 안 된다.
 * 실서비스에서는 서버가 점포 좌표와 이 값들을 채운다. */

export const ROAD_PREFIX = "경기도 용인시 기흥구 ";   /* 지금 자료가 있는 상점가는 모두 기흥구다 */

const registry = new Map();   /* districtId → { districtId, idPrefix, center, buildings, cache } */
const buildingPos = new Map();   /* `${districtId}/${buildingId}` → {lat, lng} (카카오 주소 검색 결과) */
const listeners = new Set();
let version = 0;

export function registerDistrictStores(def) { registry.set(def.districtId, { ...def, cache: null }); }
export const districtsWithStores = () => [...registry.values()];

const key = (districtId, id) => `${districtId}/${id}`;
export const hasBuildingPos = (districtId, id) => buildingPos.has(key(districtId, id));
export const setBuildingPos = (districtId, id, pos) => {
  buildingPos.set(key(districtId, id), pos);
  version += 1;
  registry.forEach(r => { r.cache = null; });
  listeners.forEach(f => f(version));
};
export const subscribeCoords = f => { listeners.add(f); return () => listeners.delete(f); };

/* 점포명으로 업종 추정. 순서가 의미다 — 앞 규칙이 먼저 잡는다 */
const RULES = [
  [/약국|의원|병원|치과|한의|내과|외과|피부과|이비인후|소아|동물병원|메디컬/, "life", "의원·약국"],
  [/반려|애견|펫|고양이|동물/, "life", "반려동물"],
  [/요양|주간보호|재가|돌봄|복지/, "life", "돌봄·복지"],
  [/필라테스|요가|피트니스|휘트니스|짐 |GYM|PT|복싱|태권도|검도|합기도|주짓수|발레|줄넘기|커브스|골프|탁구|당구|노래|PC|스크린|댄스|춤|테니스|점핑|다이어트|멀티짐|HAUS|인형뽑기|바둑/, "culture", "운동·여가"],
  [/스터디카페|독서실/, "edu", "스터디카페"],
  [/학원|독서|논술|교습|어학|영어|수학|국어|과학|학습|아동발달|언어발달|발달센터|상담센터|에듀|영재|캠퍼스|해법|킨더|아카데미|씽크빅|잉글리쉬|스터디센터|미술|음악|코딩|도서관|뮤직|드럼|리더스|스쿨|ENGLISH|메티스/, "edu", "학원·교육"],
  [/커피|카페|cafe|베이커리|파리바게뜨|배스킨|아이스크림|공차|디저트|빵|케이크|와플|호두과자|투썸|빽다방|요거트|플레이스/, "cafe", "카페·베이커리"],
  [/미용|헤어|네일|뷰티|코인워시|꽃모닝|컬러링|컷트|왁싱|눈썹|에스테틱|마사지|피부|체형|탈모|두피|테라피|살롱|염색|메이크업/, "life", "미용·생활"],
  [/공인중개|부동산|세무|법률|건설|건축|조경|인테리어|통신|텔레콤|휴대폰|호텔|자동차|정비|여행사|사진|코워크|프린트|카피|크린토피아|디자인|공사중|공실/, "etc", "사무·서비스"],
  [/안경|슈퍼|마켓|더프레시|CU|GS25|세븐일레븐|7-ELEVEN|정육|축산|농협|두부|자연드림|공방|꽃|반찬|농산물|서점|문고|의류|패션|수선|과일|옷|여성복|공판|푸줏간|도소매|건강|밀키트|어묵|Fruit/, "shop", "소매"],
  [/족발|분식|치킨|떡볶이|버거|피자|마라탕|곱창|초밥|순대|김밥|라면|만두|고깃집|짜장|짬뽕|국수|칼국수|타코야끼|꽈배기|닭꼬치|닭갈비|떡집|시루|찬방|식당|회관|밥|김선생|키친|국밥|갈비|삼겹|구이|쭈꾸미|냉면|우동|보쌈|막회|횟집|회 |샐러드|샌드위치|한식|일식|양꼬치|호프|맥주|이자카야|BAR|주점|술|해장국|곰탕|찌개|파스타|돈까스|통닭|한우|장어|닭발|오리|낙지|아구|삼계탕|죽|스시|소고기|육류|고기|냉삼|야키토리|와인|위스키|비어|와사비|태국|빈대떡|초벌|화로|연탄|참치|막창|호남전|우동|옥수|육반장|파티|차이|돈|부산집|노가리|정재|도도미미|음식점|한정식|퀸즈|옛모밀|모밀|뚝길|철길|안나비니|호프|탐라|ROYAL|PICKCANTE|짭오|오겹|삼$/, "food", "음식점"],
];
const inferCat = name => { for (const [re, cat, biz] of RULES) if (re.test(name)) return [cat, biz]; return ["etc", "기타"]; };

function posOf(r, b, bi, k) {
  const base = buildingPos.get(key(r.districtId, b.id)) || (() => {
    const a = (bi / r.buildings.length) * Math.PI * 2;
    return { lat: r.center.lat + Math.sin(a) * 0.0005, lng: r.center.lng + Math.cos(a) * 0.0006 };
  })();
  /* 같은 건물의 점포를 황금각 나선으로 흩는다 (최대 약 22m) — 겹쳐 하나로 보이지 않게 */
  const ang = k * 2.39996, rad = 4 * Math.sqrt(k + 1);
  return { lat: base.lat + (rad * Math.cos(ang)) / 111320, lng: base.lng + (rad * Math.sin(ang)) / (111320 * Math.cos((base.lat * Math.PI) / 180)) };
}

/* 점포 표 — 좌표가 바뀔 때만 새로 만든다(같은 배열을 돌려줘 렌더가 흔들리지 않는다). 자료 없는 상점가는 빈 배열 */
const EMPTY = [];
export function districtStores(districtId) {
  const r = registry.get(districtId);
  if (!r) return EMPTY;
  if (r.cache) return r.cache;
  const out = [];
  r.buildings.forEach((b, bi) => b.stores.forEach((name, k) => {
    const [cat, biz] = inferCat(name);
    out.push({
      id: `${r.idPrefix}-${String(out.length + 1).padStart(3, "0")}`, name, cat, biz, bizL: biz, onnuri: false, dist: null,
      addr: `기흥구 ${b.road}`, building: b.name || b.road, districtId: r.districtId, visible: true, views: 0,
      ...posOf(r, b, bi, k),
    });
  }));
  /* 시연용 가맹 표시 — 목록 전체에 고르게(j 번째 가맹 = 전체의 (j+0.5)/수 지점) */
  const n = out.length, m = Math.min(r.onnuriCount || 0, n);
  for (let j = 0; j < m; j += 1) out[Math.floor(((j + 0.5) * n) / m)].onnuri = true;
  r.cache = out;
  return out;
}
export const findDistrictStore = id => {
  for (const r of registry.values()) { const f = districtStores(r.districtId).find(s => s.id === id); if (f) return f; }
  return null;
};
