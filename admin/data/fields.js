import { STORES } from "../../screens/main/data/dunjeon.js";
import { DISTRICTS, GU_ORDER } from "../../screens/main/data/districts.js";
/* 이 파일만 디자인 시스템을 끌어온다. 다른 data/ 파일은 그러지 않는다 (stats.js 머리말) —
   그것들은 서버 응답으로 통째로 갈아끼울 자리라 이름표가 딸려 오면 안 되지만, 이 표는
   **항목명·예시·범위**로 이루어진 화면의 것이고 서버로 옮겨갈 물건이 아니다.
   업종 칩의 이름표를 여기에 다시 적으면 시민 화면의 칩 이름과 갈린다. */
import { CATEGORY_LABELS, eul } from "../../design-systems/admin.js";

/* 관리자 웹 기능명세서 v1.1 의 항목표 — **폼 열둘의 유일한 출처다.**
 *
 * ── 왜 표를 코드에 두는가 ───────────────────────────────────────────────────
 * 폼을 화면마다 JSX 로 적으면 항목이 열두 군데에 흩어진다. 명세서가 한 줄 바뀌었을 때
 * 고칠 곳을 열두 번 찾아야 하고, 그중 하나는 반드시 빠진다. 여기 한 표만 고치면
 * 폼과 저장 검사와 표 머리글이 함께 따라온다.
 *
 * ── 필드 한 줄이 갖는 것 ────────────────────────────────────────────────────
 *   key        **우리 데이터의 필드명**. 시민 화면이 이미 읽고 있는 이름이다
 *   spec       **명세서의 필드명**. 아래 "이름이 둘인 이유" 참조
 *   label      명세서의 항목명 그대로. 줄여 쓰지 않는다
 *   required   true(●) · false(○) · "cond"(◐) · "auto"(⚙). 명세서 필수 열 그대로
 *   when       required "cond" 일 때 필수가 되는 조건 (values => boolean)
 *   type       text | number | date | textarea | select | multiselect | switch | readonly
 *   options    select · multiselect 의 선택지
 *   range      명세서 범위 열. **화면에 그대로 적고**, 아래 검사도 이것과 같은 값을 본다
 *   minLength · maxLength · min · max · pattern   실제 검사 값
 *   example    명세서의 "예)" 열
 *   span       2 면 두 열을 다 쓴다 (주소·부가정보처럼 긴 값)
 *   unit       숫자 칸 옆에 붙는 글자 ("칸", "명"). 저장값에는 들어가지 않는다
 *
 * ── 이름이 둘인 이유 ────────────────────────────────────────────────────────
 * 명세서는 `address_road` · `ref_store_count` 처럼 **DB 컬럼명**으로 항목을 부른다.
 * 그런데 시민용 화면 열둘이 이미 `addr` · `stores` 를 읽고 있고, 그 이름을 바꾸면
 * 잘 돌고 있는 화면 열둘을 아직 검증되지 않은 관리자 폼을 위해 뜯게 된다.
 *
 * 그래서 **키는 우리 것을 쓰고 명세서 이름을 `spec` 에 적어 둔다.** 서버 연동 때
 * 이 한 표가 곧 매핑표가 된다 — 어느 칸이 어느 컬럼인지 찾아 헤맬 곳이 없다.
 * 명세서가 "원천 필드명을 그대로 사용해 후속 갱신 시 정합성을 유지한다"(입력 원칙 2)고
 * 요구하는 것은 **저장되는 값의 컬럼명**이고, 그것은 서버가 지키는 규칙이다.
 *
 * ── 시민 화면의 반대편이다 ─────────────────────────────────────────────────
 *   읽기: screens/detail/FacilityDetail.jsx 의 FIELDS   (3장)
 *   읽기: screens/detail/StoreDetail.jsx 의 InfoList     (2-2)
 *   읽기: screens/detail/FestivalDetail.jsx 의 InfoList  (2-3)
 *   쓰기: 이 파일
 * 어긋나면 명세서를 따른다.
 */

/* 원천 분류 목록은 실제 데이터에서 뽑는다. 손으로 적어두면 데이터가 늘 때 따라오지 않고,
   목록에 없는 값을 가진 점포가 폼에서 빈 칸으로 보인다. */
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
export const BIZ_MAJOR = uniq(STORES.map(s => s.bizL));
export const BIZ_MID = uniq(STORES.map(s => s.biz));
export const BIZ_MINOR = uniq(STORES.map(s => s.bizS));
export const KSIC = uniq(STORES.map(s => s.ksic));

export const DISTRICT_OPTIONS = DISTRICTS.map(d => ({ value: d.id, label: d.name }));
export const GU_OPTIONS = GU_ORDER.map(g => ({ value: g, label: g }));

const opts = list => list.map(v => ({ value: v, label: v }));
const withBlank = (list, label) => [{ value: "", label }].concat(list);

/* ── 부록. 검증 규칙 ────────────────────────────────────────────────────────
   V-01 은 좌표라 CoordField 가 지도에서 본다 (숫자 칸이 없으므로 여기서 검사할 것이 없다).
   V-02 도 AddressField 가 본다 — 검색으로만 들어오므로 형식이 어긋날 길이 없다.
   나머지 넷이 문자열 검사이고, 여기 한 곳에 모아 둔다.

   **오류 문구에는 규칙 번호를 적지 않는다** (2026-08-20). 「(V-03)」은 이 파일과 명세서를
   잇는 표시이지 담당자에게 가리키는 대상이 아니다. 화면이 할 말은 무엇을 어떻게 고치는가다. */
export const V = {
  phone: { re: /^[0-9-]{9,13}$/, msg: "숫자와 하이픈만, 9~13자입니다." },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "이메일 형식이 아닙니다." },
  url: { re: /^https?:\/\/.{1,493}$/, msg: "http:// 또는 https:// 로 시작해야 합니다." },
  qrCode: { re: /^[a-z0-9]{4,12}$/, msg: "영문 소문자와 숫자만, 4~12자입니다." },
  loginId: { re: /^[a-z][a-z0-9]{3,19}$/, msg: "영문 소문자로 시작하는 영문 소문자·숫자 4~20자입니다." },
  yearMonth: { re: /^\d{4}\.(0[1-9]|1[0-2])$/, msg: "YYYY.MM 형식으로 적습니다 (예: 2026.03)." },
};

/* 비밀번호 — 영문·숫자·특수문자 중 2종 이상, 10~64자 (명세서 9장).
   정규식 하나로 적을 수 있지만 읽을 수 없는 줄이 되므로 세어서 판정한다. */
export function checkPassword(pw) {
  const s = String(pw || "");
  if (s.length < 10 || s.length > 64) return "10~64자로 정합니다.";
  const kinds = [/[a-zA-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(re => re.test(s)).length;
  if (kinds < 2) return "영문 · 숫자 · 특수문자 중 두 종류 이상을 섞습니다.";
  return null;
}

/* ══ 2-1 상점가 정보 (M04) ═════════════════════════════════════════════════
   출처: 구역 주소는 상권활성화 홈페이지, 점포수는 공공데이터 매칭 결과 · 기준일 미표기 대상

   ── 점포수를 입력받지 않는다 (2026-08-20, 명세서 개정) ──────────────────────
   전에는 홈페이지 게시값(340 · 139)을 손으로 옮겨 적게 하고, 그것을 매칭 산출값(335 · 132)과
   견주어 10% 넘게 벌어지면 경고를 세웠다. 명세서가 그 검사를 **없앴고 이유를 적었다**:

     "홈페이지 게시 총계와 매칭 결과를 비교하는 검사는 두지 않는다. 둔전 기준 340 대
      335처럼 차이를 알아도 **어느 5곳인지 모르면 고칠 수 없기 때문**이다."

   맞는 판단이다. 그 경고가 담당자에게 주는 것은 "5곳이 빈다"까지이고, 거기서 할 수 있는
   일이 없다. 누락 지점을 집어내는 일은 주소 단위 대조라 개발 쪽 몫이 되었다.

   그래서 이제 점포수는 **읽기만 하는 값 두 개**뿐이다. 관리자가 32개소 숫자를 옮겨 적을
   일도, 두 숫자를 견줄 일도 없다.

   `sort_order` 도 함께 빠졌다 — 명세서 항목표에 없다. 32곳의 차례는 시민 화면이 거리로
   정한다 (districts.js 의 byDistrictNear). */
export const DISTRICT_FIELDS = [
  { key: "name", spec: "name", label: "골목형 상점가명", required: true, type: "text",
    range: "2~40자 · 전역 유일", minLength: 2, maxLength: 40,
    example: "둔전골목형상점가", span: 2 },
  { key: "gu", spec: "gu", label: "소속 구", required: true, type: "select", options: GU_OPTIONS,
    example: "처인구" },
  /* ── 번호가 아니라 주소를 받는다 (2026-08-24, 사용자 요청) ──────────────────
     전에는 「상권센터 페이지 번호」에 `114` 같은 일련번호를 넣게 하고, 화면이 그것을
     주소로 조립했다. 두 가지가 잘못돼 있었다.

     첫째, **담당자가 알아들을 수 없는 이름이었다.** 「상권센터 페이지 번호」를 받아
     적으려면 그 번호가 시 누리집 주소 안의 `seq` 값이라는 것을 이미 알아야 하는데,
     그것은 이 화면을 만든 쪽의 사정이다. 담당자가 손에 쥐고 있는 것은 브라우저 주소창의
     주소 한 줄이다. 그러니 그 한 줄을 그대로 붙여넣게 한다.

     둘째, **조립한 주소가 시민 화면이 쓰는 주소와 달랐다.** 여기서 만들던 것은
     `marketGuide.do?key=114&searchGu=…&seq=…` 였고 시민 화면(districts.js 의
     `homepage`)이 쓰는 것은 `marketGuideDetail.do?key=114&seq=…` 다. 게다가 32곳 어디에도
     `govSeq` 값이 없어 이 칸은 늘 비어 있었다 — 고쳐도 시민 화면에 닿지 않는 칸이었다.

     그래서 키를 `homepage` 로 맞췄다. **이제 이 칸이 시민 화면 카드의 바로가기가 여는
     바로 그 주소다.** 조립하는 코드(`govLink`)는 없앴다 — 붙여넣은 주소가 곧 값이다.

     ── 「비우면 …화살표가 사라집니다」도 뺐다 (2026-08-24, 사용자 요청) ────────
     그렇게 동작하지도 않게 됐다. 비워 두면 사용자 화면의 [상세 페이지] 줄이 사라지는 대신
     「아직 준비 중입니다」 안내가 뜬다 (screens/detail/DistrictSoon.jsx). 담당자가 값을
     비우는 이유는 대개 **아직 페이지가 없어서**인데, 그때 줄이 통째로 사라지면 시민은
     이 상점가만 무언가 빠졌다고 읽는다. */
  { key: "homepage", spec: "gov_url", label: "상권 활성화 센터 페이지 링크",
    required: false, type: "text", span: 2,
    range: "최대 500자", maxLength: 500, pattern: V.url,
    example: "https://www.yongin.go.kr/yimr/www/marketGuideDetail.do?key=114&seq=2" },
  { key: "addr", spec: "address", label: "주소", required: true, type: "text",
    range: "최대 100자", maxLength: 100,
    example: "처인구 김량장동 133-37번지 일원", span: 2 },

  { key: "storeCount", spec: "store_count", label: "점포수", required: "auto",
    type: "number", unit: "곳",
    hint: "구역 주소 매칭 결과 중 노출 상태인 건수. 사용자 화면 헤더에 표시됩니다" },
  { key: "onnuriCount", spec: "onnuri_count", label: "온누리 가맹 점포수", required: "auto",
    type: "number", unit: "곳", hint: "위 중 온누리 가맹 건수" },

  /* ── `onnuri_market_name`(온누리 원본 표기명)이 여기 없는 이유 (2026-08-20) ──
     온누리 가맹점은 주소가 아니라 원본의 `소속 시장명` 컬럼으로 걸러내고, 그 표기가
     우리 상점가명과 다를 수 있어("둔전 골목형 상점가" ↔ "둔전시장") 원본 표기를 그대로
     들고 있는 값이 필요하다. 그 값 자체는 남아 있다 — **다만 관리자 화면에서 고치지
     않는다.**

     매칭에 쓰는 키라, 고쳐도 그 결과(가맹 몇 건이 걸리는지)가 이 화면에서는 보이지
     않는다. 매칭은 개발 쪽에서 돌리고 관리자가 볼 수 있는 것은 산출된 가맹 건수뿐이다.
     결과를 볼 수 없는 값을 고치게 하면, 0건이 나왔을 때 담당자가 이름을 이렇게 저렇게
     바꿔 보며 시간을 쓰게 된다 — 실제로 고쳐야 할 곳은 매칭 설정이다. */

  { key: "visible", spec: "is_visible", label: "노출 여부", required: true, type: "switch" },
];

/* 상권 활성화 센터 외부 링크(명세서 2-1)를 만들던 `govLink()` 는 없앴다 (2026-08-24).
   번호를 주소로 조립하던 함수인데, 이제 `homepage` 가 주소 자체다 — 조립할 것이 없다.
   시민 화면은 예나 지금이나 `district.homepage` 를 그대로 연다 (DistrictRow 의 external). */

/* ══ 2-2 개별 점포 정보 (M06) ══════════════════════════════════════════════
   출처: 공공데이터 · **데이터 기준일 표기 대상** (기준일은 개별 화면이 아니라 M14 에서 정한다)

   ── 중분류가 돌아왔다 (명세서 2-2 의 주석) ──────────────────────────────────
   한때 뺐던 항목인데(소분류와 글자까지 같은 값이 45종 중 13종이라 상세 정보 표가
   같은 줄을 두 번 적게 된다), 명세서가 이유를 들어 되살렸다: 시민용 업종 칩의
   카페/디저트가 "음식 대분류 중 **비알코올 중분류**, 빵/도넛 소분류"로 정의되어 있어
   중분류가 없으면 카페와 음식점을 가를 수 없다. 둔전 기준 음식 132 대 카페 18 을
   가르는 기준이 그것이다.

   되살리는 비용은 없다 — 원천에 이미 있고 우리 데이터에도 `biz` 로 남아 있었다.
   **상세 화면의 정보 표에 적지 않는 것은 그대로다.** 저장하는 것과 보여주는 것은 다르다. */
export const CHIP_OPTIONS = ["food", "cafe", "shop", "beauty", "culture", "etc"]
  .map(v => ({ value: v, label: CATEGORY_LABELS[v] }));

export const ONNURI_TYPE_OPTIONS = [
  { value: "paper", label: "지류" },
  { value: "digital", label: "디지털" },
];

/* ── 좌표는 입력칸이 아니라 지도다 (입력 원칙 3번) ──────────────────────────
   항목표에 자리를 남겨 두는 이유는 명세서에 `lat · lng` 가 항목으로 적혀 있어서다 —
   표에서 빼면 그 항목이 어디로 갔는지 알 수 없다. 화면이 이 자리에 CoordField 를
   끼워 넣는다 (RecordForm 의 slots).

   **점포와 공공시설이 같은 항목을 쓰므로 여기 한 번만 적는다.** 주소 바로 아래인 것도
   이유가 있다: 좌표는 주소에서 나온 값이라 둘이 떨어져 있으면 지도가 왜 저기 있는지
   알 수 없다. */
const COORD = { key: "coord", spec: "lat · lng", label: "좌표", required: "auto", type: "coord", span: 2 };

export const STORE_FIELDS = [
  { key: "name", spec: "name", label: "상호명", required: true, type: "text",
    range: "1~60자", minLength: 1, maxLength: 60, example: "은행나무곱창" },
  { key: "branch", spec: "branch_name", label: "지점명", required: false, type: "text",
    range: "최대 40자", maxLength: 40, example: "에버랜드점",
    hint: "골목상점가는 단독 점포가 대부분이라 열에 아홉은 원천에 값이 없습니다" },
  { key: "districtId", spec: "market_id", label: "소속 골목형 상점가", required: true, type: "select",
    options: DISTRICT_OPTIONS, example: "둔전골목형상점가" },
  { key: "addr", spec: "address_road", label: "도로명주소", required: true, type: "address",
    range: "최대 100자", maxLength: 100, example: "처인구 포곡읍 둔전로 42", span: 2 },
  /* 지도를 여기에도 둔다 (2026-08-20). 점포도 **지도에 핀으로 찍히는 자료**다 — 상점가 탭의
     335개 마커가 이 좌표다. 공공시설 폼에만 지도가 있으면 담당자는 점포 좌표가 어디서
     정해지는지 알 수 없고, 주소가 애매해 핀이 뒷골목에 박혀도 확인할 자리가 없다.
     명세서 1장의 M06 기능란도 「폼, 지도 좌표 확인」이라고 적고 있다. */
  COORD,

  /* ── 분류 넷에는 설명을 달지 않는다 (2026-08-24, 사용자 요청) ───────────────
     「원본값 그대로」·「업종 칩 매핑이 이 값을 씁니다 (카페/디저트 분리)」가 붙어 있었다.
     둘 다 **이 자료가 어디서 왔고 어디에 쓰이는가**를 적은 줄인데, 그것은 담당자가 이 칸에서
     하는 일(고른다)과 상관이 없다. 넷이 나란히 선 자리라 설명 줄이 붙으면 고르는 칸보다
     회색 글씨가 더 눈에 띈다. 칩이 이 넷에서 나온다는 사실은 **칩 칸이 자기 자리에서**
     적는다 — 그것을 읽을 이유가 있는 자리는 거기 하나다. */
  { key: "bizL", spec: "category_large", label: "상권업종대분류명", required: true, type: "select",
    options: opts(BIZ_MAJOR), range: "최대 30자", example: "음식" },
  { key: "biz", spec: "category_mid", label: "상권업종중분류명", required: false, type: "select",
    options: withBlank(opts(BIZ_MID), "— 없음 —"), range: "최대 30자", example: "한식" },
  { key: "bizS", spec: "category_small", label: "상권업종소분류명", required: false, type: "select",
    options: withBlank(opts(BIZ_MINOR), "— 없음 —"), range: "최대 30자", example: "곱창전골/구이" },
  { key: "ksic", spec: "industry_std", label: "표준산업분류명", required: false, type: "select",
    options: withBlank(opts(KSIC), "— 없음 —"), range: "최대 40자", example: "기타 주점업" },

  /* 온누리 두 칸의 설명도 뺐다 (2026-08-24, 사용자 요청). 「시장명 매칭으로 자동
     설정되며…」는 값의 출처이고, 「비운 것과 둘 다 안 됨은 다릅니다」는 우리 쪽 자료
     구조를 담당자에게 설명한 줄이다. 토글은 켜거나 끄고, 체크박스는 아는 것만 고른다. */
  { key: "onnuri", spec: "is_onnuri", label: "온누리 가맹여부", required: false, type: "switch" },
  { key: "onnuriType", spec: "onnuri_type", label: "온누리 상품권 종류", required: false,
    type: "multiselect", options: ONNURI_TYPE_OPTIONS },

  /* ── 이 칸은 ⚙ 이면서 고칠 수 있다 (2026-08-24) ─────────────────────────────
     명세서 2-2 의 `chip_category` 는 "자동 산출 후 수기 변경 가능"이고 화면도 그렇게
     동작하려 했는데 (Stores.jsx 의 setField 가 chipManual 을 기억한다), **폼에서는 고칠
     수가 없었다.** `required: "auto"` 한 값이 ⚙ 배지와 읽기 전용을 함께 뜻했기 때문이다.
     설명 줄은 「아래에서 수기로 바꿀 수 있습니다」라고 적혀 있어, 없는 자리를 가리키면서
     못 하는 일을 하라고 말하고 있었다.

     `editable` 로 그 둘을 갈랐다 (FormGrid). 배지는 ⚙ 그대로 — 값을 만드는 것은 여전히
     규칙이다 — 두고 칸만 열었다. 설명도 그 두 가지를 그대로 적는다. */
  { key: "cat", spec: "chip_category", label: "표시 업종 칩", required: "auto", type: "select",
    options: CHIP_OPTIONS, span: 2, editable: true,
    hint: "상권업종 대·중·소분류에서 자동 산출된 값입니다. 관리자가 수기로 수정 가능합니다." },

  { key: "visible", spec: "is_visible", label: "노출 여부", required: true, type: "switch",
    example: "폐업 확인 시 삭제 대신 이것을 끕니다" },
  /* 「인기순 정렬의 원천」도 뺐다 (2026-08-24, 사용자 요청). 못 고치는 숫자 옆에서
     그 숫자가 어디에 쓰이는지를 알아도 담당자가 할 수 있는 일이 없다 */
  { key: "views", spec: "view_count", label: "조회수", required: "auto", type: "number", unit: "회" },
  /* ── 등록 시점은 자동으로 채우되 고칠 수 있다 (2026-08-20, 사용자 요청) ──────
     전에는 읽기 전용(⚙)이었다. 원천의 `created_at` 을 그대로 보여주는 값이니 손댈 이유가
     없다고 본 것인데, **관리자가 점포를 새로 등록하는 경우가 실제로 있다.** 그때 이 값은
     "오늘 화면에 넣은 날"이 되지 원천에 가게가 등록된 달이 아니다. 작년에 문을 연 가게를
     오늘 등록하면 둘러보기 탭의 「신규 매장」에 그 가게가 올라간다.

     고친 값은 실제로 목록을 바꾼다 — 신규 매장을 뽑는 쪽(dunjeon.js 의 discoverPicks)이
     이 값을 먼저 본다. 화면에서 고쳤는데 목록이 그대로면 고친 것이 아니다. */
  { key: "createdAt", spec: "created_at", label: "등록 시점", required: false, type: "month",
    example: "2026-06", span: 2,
    hint: "둘러보기 탭의 「신규 매장」을 뽑는 기준입니다" },
];

/* 업종 칩 자동 산출 (chip_category ⚙).
   명세서가 "자동 산출 후 수기 변경 가능"이라고만 적고 규칙은 시민용 매핑 규칙에 있다.
   여기서는 그 규칙을 한 곳에만 적는다 — 화면마다 다시 적으면 목록의 칩과 폼의 칩이 갈린다. */
export function deriveChip(v) {
  const L = v.bizL || "";
  const M = v.biz || "";
  const S = v.bizS || "";
  if (L === "음식") {
    /* 카페/디저트 — 명세서가 든 예시 그대로다. **중분류가 있어야 갈린다** */
    if (/비알코올|커피|음료/.test(M) || /제과|빵|도넛|디저트|빙수|아이스크림|커피/.test(S)) return "cafe";
    return "food";
  }
  if (/소매|도매|유통/.test(L)) return "shop";
  if (/생활서비스|수리|개인/.test(L)) return "beauty";
  if (/여가|스포츠|예술|학문|교육/.test(L)) return "culture";
  if (/숙박|음료/.test(L)) return "cafe";
  return "etc";
}

/* ══ 2-3 축제 정보 (M08) ═══════════════════════════════════════════════════
   출처: 용인시 제공 · 데이터 기준일 미표기 대상 · 이미지 파일로 제공되므로 수기 입력 전제

   ── 상태를 입력받지 않는다 ──────────────────────────────────────────────────
   진행 예정 · 진행 중 · 완료는 기간에서 나오는 값이다 (명세서 2-3 의 표).
   담당자가 고르게 하면 축제가 끝나도 「진행 중」이 남고, 그것을 내리는 일이 또 하나의
   할 일이 된다. 종료일이 지나도 **숨기지 않고 완료 카테고리로 옮겨** 계속 노출한다. */
export const FESTIVAL_FIELDS = [
  { key: "name", spec: "name", label: "축제명", required: true, type: "text",
    range: "2~40자", minLength: 2, maxLength: 40, example: "둔전 골목축제", span: 2 },
  { key: "districtId", spec: "market_id", label: "상권명", required: true, type: "select",
    options: DISTRICT_OPTIONS, example: "둔전골목형상점가", span: 2,
    hint: "주최 골목형 상점가" },
  { key: "start", spec: "date_from", label: "시작일", required: true, type: "date", example: "2026-10-17" },
  { key: "end", spec: "date_to", label: "종료일", required: true, type: "date", example: "2026-10-17",
    hint: "시작일과 같거나 이후여야 합니다" },
  { key: "time", spec: "time_text", label: "시간", required: false, type: "text",
    range: "최대 50자", maxLength: 50, example: "10:00~18:00" },
  { key: "visible", spec: "is_visible", label: "노출 여부", required: true, type: "switch" },
  { key: "program", spec: "program_text", label: "주요 프로그램", required: false, type: "textarea",
    rows: 3, range: "최대 500자", maxLength: 500,
    example: "먹거리 장터, 상인 경품행사, 어르신 한마당", span: 2,
    hint: "이름 사이는 쉼표로 나눕니다. 사용자 화면이 그 기준으로 줄을 나눕니다" },
];

/* 2-4 프로그램 일정 (1:N) `C` — 자료 제공 범위 확정 후 반영 여부 결정

   ── 시각을 글자로 받지 않는다 (2026-08-24, 사용자 요청) ─────────────────────
   전에는 「시작 일시」가 그냥 text 칸이었고 예시가 「10.17 11:00」이었다. 예시를 적어
   두어도 담당자마다 다르게 적는다 — "10/17 11시", "17일 오전 11시", "11:00". 그렇게 들어온
   값은 **정렬할 수도 견줄 수도 없는 글자**라, 시민 화면에서 시간순으로 늘어놓는 일도
   "진행 중인 시간대를 펴는" 일도 할 수 없다.

   이제 `datetime-local` 한 칸이 날짜와 시각을 함께 받는다 — 담당자는 달력과 시계에서
   고르고, 저장되는 값은 `2026-10-17T11:00` 하나뿐이다.

   ── 「종료 일시」가 생겼다 ──────────────────────────────────────────────────
   시작만 있으면 시민 화면이 "11:00" 이라고만 적는다. 축제 프로그램에서 실제로 묻는 것은
   **몇 시부터 몇 시까지**다 — 지금 가면 볼 수 있는지가 그것으로 갈린다.
   종료도 **시각이 아니라 일시**를 받는다 (부스와 같다). 한때 시각만 받게 두었었는데,
   그러면 같은 화면의 두 목록이 시각을 다른 방식으로 받게 되고 담당자가 그 차이를
   먼저 알아채야 한다 — 자정을 넘기는 프로그램이 드물다는 것은 우리 쪽 짐작이지
   담당자가 칸을 보고 알 수 있는 규칙이 아니다.

   ── 짧은 값은 윗줄, 문장은 아랫줄 (2026-08-24, 사용자 요청) ─────────────────
   다섯 칸을 한 줄에 세우면 각 칸이 120px 로 쪼그라든다 — 일시 고르개 둘이 그 줄에서
   420px 을 먼저 가져가기 때문이다. 그래서 **윗줄에 시작 · 종료 · 이름 · 위치**를 두고
   **설명만 아랫줄로 내린다** (`row2`). 나란히 훑는 값과 읽는 문장은 하는 일이 다르다.

   ── 「장소」가 「위치」가 되었다 ────────────────────────────────────────────
   부스 표가 이미 「위치」였다. 같은 것을 한 화면에서 두 이름으로 부르면 담당자가 둘이
   다른 값인지 확인하게 된다 (명세서 「부르는 이름」 원칙과 같은 이유). */
/* ── 언제와 무엇은 필수, 어디와 설명은 선택 (2026-08-24, 사용자 요청) ──────────
   두 목록이 같은 규칙을 쓴다. 가르는 선은 **그 값 없이 이 줄이 뜻을 갖는가**다.

     시작 일시 · 종료 일시   없으면 "언제 가면 되는가"에 답하지 못한다. 시민 화면의
                            줄이 「10.17 15:00 ~ 21:00」인데 한쪽이 비면 그 줄이 반만 선다
     프로그램명 · 부스명     없으면 무엇에 대한 줄인지 알 수 없다
     위치                    비어도 줄은 선다. 축제장이 좁으면 굳이 적을 것이 없고,
                            프로그램은 어차피 축제 장소가 위에 있다
     설명                    이름 밖의 정보라 있으면 좋고 없어도 그만이다

   종료 일시가 선택이었던 것이 이번에 바뀐 자리다. 「몇 시부터 몇 시까지」가 이 목록의
   요점인데 종료를 비워 둘 수 있으면 목록의 절반이 시작 시각만 달고 서 있게 된다. */
export const PROGRAM_COLUMNS = [
  { key: "startAt", label: "시작 일시", type: "datetime-local", required: true, width: 210 },
  { key: "endAt", label: "종료 일시", type: "datetime-local", required: true, width: 210 },
  { key: "title", label: "프로그램명", type: "text", required: true, maxLength: 40, placeholder: "개막 풍물놀이" },
  { key: "where", label: "위치", type: "text", maxLength: 60, placeholder: "시장통 무대" },
  { key: "desc", label: "설명", type: "text", maxLength: 300, row2: true, placeholder: "포곡농악보존회" },
];

/* 2-5 부스 위치 (1:N) — **글로 안내한다** (2026-08-20, 사용자 요청)
   ── 칸이 곧 시민 화면의 줄이다 ──────────────────────────────────────────────
   시민 화면(S09 부스 위치)이 찍는 것은 지도가 아니라 목록 한 줄이다:

     먹거리 부스
     시장통 입구 ~ 중앙 무대 양쪽
     10.17 15:00 ~ 21:00

   관리자가 채운 것이 그대로 나가고, 나가지 않는 값은 여기 없다.

   ── 칸 차례를 프로그램과 맞춘다 (2026-08-24, 사용자 요청) ────────────────────
   시작 일시 · 종료 일시 · 이름 · 위치. 두 목록이 같은 화면에 나란히 서므로 차례가
   다르면 담당자가 매번 어느 칸이 어느 칸인지 다시 읽는다.

   ── 「규모」도 「설명」도 두지 않는다 (2026-08-24, 사용자 요청) ────────────────
   「20여 곳」 한 마디였던 「규모」를 「설명」으로 바꿨다가, 그 칸을 통째로 뺐다.
   부스에서 실제로 알아야 하는 것은 **어디에 있고 언제 여는가**이고 그 셋이 이미 칸으로
   있다. 무엇을 파는 곳인지는 대개 부스명이 말한다(「먹거리 부스」 · 「체험 부스」) —
   설명 칸을 두면 부스마다 그 이름을 한 번 더 풀어 적는 자리가 된다.
   프로그램에는 설명이 남아 있다: 거기서는 이름이 「개막 풍물놀이」이고 누가 하는지
   (「포곡농악보존회」)가 이름 밖의 정보다.

   ── 시작·종료 일시가 있다 (2026-08-24, 사용자 요청) ─────────────────────────
   부스는 축제 내내 열려 있지 않다. **두 칸 다 날짜를 받는다** — 여러 날짜에 걸치는
   축제(구성언남은 3일이다)에서 부스는 날을 넘겨 서 있고, "언제까지 하는지"가 곧
   오늘 가도 되는지의 답이다.

   ── 빠진 것들과 그 이유 ─────────────────────────────────────────────────────
   「위치 지정」(실제 좌표 / 배치도 상대좌표)과 「좌표 / 배치도 %」  좌표를 받아 두어도
     그것을 찍을 지도가 1차 축제 상세에 없다. 배치도 상대좌표는 배치도 이미지가 있어야
     뜻이 생기는데 그 칸(V-06)도 없다 — 쓰이지 않을 값을 축제마다 스무 줄씩 적는 일이 된다.
   「번호」(A-01) 와 「유형」(먹거리 · 판매 …)  둘 다 **부스를 지도에 점으로 찍던 시절의
     항목**이다. 번호는 배치도 위의 점과 목록을 잇는 열쇠였고, 유형은 점의 색이었다.
     지도가 없으면 둘 다 시민 화면 어디에도 나가지 않는다.

   좌표로 찍을 자리가 정해지면 그때 네 칸을 함께 되살린다. */
/* 필수·선택은 프로그램과 같은 선으로 가른다 (2026-08-24, 사용자 요청. PROGRAM_COLUMNS
   머리말). 두 칸이 뒤집혔다 — **일시 둘이 필수가 되고 위치가 선택이 되었다.**
   두 목록이 같은 화면에 나란히 서므로 같은 칸이 한쪽에서만 별표를 달면, 담당자가 그
   차이에 이유가 있는 줄 알고 찾게 된다. */
export const BOOTH_COLUMNS = [
  { key: "startAt", label: "시작 일시", type: "datetime-local", required: true, width: 210 },
  { key: "endAt", label: "종료 일시", type: "datetime-local", required: true, width: 210 },
  { key: "name", label: "부스명", type: "text", required: true, maxLength: 40,
    placeholder: "먹거리 부스" },
  { key: "where", label: "위치", type: "text", maxLength: 60,
    placeholder: "시장통 입구 ~ 중앙 무대 양쪽" },
];

/* ══ 3장 공공시설 (M10) ════════════════════════════════════════════════════
   출처: 공공데이터 · **데이터 기준일 표기 대상** (유형별 개별 설정 — M14)

   유형마다 항목이 다르다. 한 폼에 다 펼쳐놓고 "해당 없으면 비우세요"로 두면
   AED 를 등록하는 담당자가 기저귀 교환대 칸을 보게 되고, 그 칸을 비운 것이 "없음"인지
   "해당 없음"인지 데이터로는 구분되지 않는다. */

/* 3-1 공통 필드 — 넷뿐이다 (유형 · 도로명주소 · 좌표 · 노출 여부).

   ── `source`(원본 · 원본수정 · 직접등록)가 빠졌다 (2026-08-20, 명세서 개정) ────
   그 값은 **동기화가 어느 필드를 덮어쓸지** 정하는 값이었다. 동기화 화면이 개발 쪽으로
   가면서 그것을 읽는 곳이 없어졌다 — 명세서 3-1 이 "공공데이터 적재와 갱신은 개발 쪽에서
   처리하며, 관리자 화면에서는 개별 건의 조회·수정·신규 등록만 제공한다"고 다시 적었다.

   읽는 곳이 없는 값을 폼에 남겨 두면 담당자는 그것이 무엇을 바꾸는지 모른 채 고르게 된다.
   덮어쓰기 규칙은 서버가 자기 기준으로 판단한다. */

const ADDR ={ key: "addr", spec: "address_road", label: "도로명주소", required: true, type: "address",
  range: "최대 100자", maxLength: 100, example: "처인구 포곡읍 둔전로 42", span: 2 };

/* 좌표(COORD)는 점포와 함께 쓰므로 2-2 위쪽에 한 번만 선언해 두었다 */

const COMMON_TAIL = [
  { key: "visible", spec: "is_visible", label: "노출 여부", required: true, type: "switch" },
];

/* AED·대피소에는 원천 자료에 **명칭 항목이 없다** (명세서 3-2 · 3-5 에 항목이 없다).
   그래서 도로명주소에서 만든다 — "둔전로 42 AED" (facilities.js 의 facilityName).

   ── 만들어 주되 고칠 수 있게 둔다 (2026-08-20, 사용자 요청) ──────────────────
   전에는 읽기 전용(⚙)이었다. 규칙이 만드는 값이니 손대지 못하게 한 것인데, **그 규칙이
   틀리는 경우가 있다.** 도로명주소가 부정확하거나("둔전로 42"가 실제로는 뒷건물이다),
   현장에 이미 통용되는 이름이 있거나("둔전마을회관 AED"), 한 주소에 두 대가 있으면
   같은 이름이 둘 생긴다. 그때 담당자가 고칠 자리가 없으면 이름을 바로잡는 유일한 길이
   주소를 틀리게 적는 것이 된다 — 고치라고 만든 화면에서 나올 수 없는 결말이다.

   그래서 주소를 고르면 자동으로 채워지되, 그 뒤로는 보통 입력칸이다. **손으로 고친
   이름은 주소를 다시 골라도 덮이지 않는다** (Facilities.jsx 의 onAddress). */
const DERIVED_NAME = { key: "name", spec: "—", label: "명칭", required: true, type: "text",
  range: "2~60자", minLength: 2, maxLength: 60, span: 2, example: "둔전로 42 AED",
  hint: "도로명주소를 고르면 자동으로 채워집니다. 현장에서 달리 부르거나 자동 생성된 이름이 맞지 않으면 고쳐 주세요" };

export const FACILITY_FIELDS = {
  aed: [
    ADDR,
    COORD,
    DERIVED_NAME,
    { key: "place", spec: "aed_place_detail", label: "설치 위치", required: true, type: "text",
      range: "최대 100자", maxLength: 100, span: 2,
      example: "관리사무소 건물 1층 출입구",
      hint: "응급 상황에서 결정적인 정보이므로 필수입니다. 층 정보도 이 문장에 포함합니다" },
    ...COMMON_TAIL,
  ],
  toilet: [
    { key: "name", spec: "name", label: "화장실명", required: true, type: "text",
      range: "2~60자", minLength: 2, maxLength: 60, example: "둔전시장 공중화장실", span: 2 },
    ADDR,
    COORD,
    /* 개방시간이 칸수보다 위인 이유: 나머지 일곱은 "가서 쓸 만한가"를 말하는데
       이것은 **가도 되는가**를 말한다. 잠긴 화장실 앞에서 칸수는 소용이 없다 */
    { key: "hours", spec: "open_hours", label: "개방시간", required: false, type: "text",
      range: "최대 50자", maxLength: 50, example: "상시 개방 / 05:00~24:00", span: 2 },
    { key: "menToilet", spec: "m_toilet", label: "남성용 대변기수", required: false, type: "number",
      range: "0~99", min: 0, max: 99, unit: "칸", example: "2" },
    { key: "menUrinal", spec: "m_urinal", label: "남성용 소변기수", required: false, type: "number",
      range: "0~99", min: 0, max: 99, unit: "칸", example: "3" },
    { key: "womenToilet", spec: "f_toilet", label: "여성용 대변기수", required: false, type: "number",
      range: "0~99", min: 0, max: 99, unit: "칸", example: "3" },
    { key: "womenUrinal", spec: "f_urinal", label: "여성용 소변기수", required: false, type: "number",
      range: "0~99", min: 0, max: 99, unit: "칸", example: "2" },
    { key: "emergencyBell", spec: "emergency_bell", label: "비상벨 설치 여부", required: false, type: "switch" },
    { key: "diaperTable", spec: "diaper_table", label: "기저귀 교환대 유무", required: false, type: "switch" },
    { key: "entranceCctv", spec: "entrance_cctv", label: "입구 CCTV 유무", required: false, type: "switch", span: 2 },
    ...COMMON_TAIL,
  ],
  rest: [
    { key: "name", spec: "name", label: "쉼터명칭", required: true, type: "text",
      range: "2~60자", minLength: 2, maxLength: 60, example: "둔전마을회관 무더위쉼터", span: 2 },
    ADDR,
    COORD,
    { key: "hours", spec: "open_hours", label: "운영시간", required: false, type: "text",
      range: "최대 50자", maxLength: 50, example: "평일 09:00~18:00 / 24시간 개방" },
    { key: "capacity", spec: "capacity", label: "이용가능 인원", required: false, type: "number",
      range: "0~9999", min: 0, max: 9999, unit: "명", example: "40" },
    { key: "extra", spec: "extra_info", label: "부가정보", required: false, type: "text",
      range: "최대 100자", maxLength: 100, example: "냉방기 있음", span: 2 },
    ...COMMON_TAIL,
  ],
  shelter: [
    ADDR,
    COORD,
    DERIVED_NAME,
    { key: "place", spec: "place_name", label: "실제 위치 (시설명)", required: true, type: "text",
      range: "최대 100자", maxLength: 100, span: 2,
      example: "백현마을 2단지 208동 지하 1층 주차장" },
    { key: "capacity", spec: "capacity", label: "최대 수용 인원", required: false, type: "number",
      range: "0~99999", min: 0, max: 99999, unit: "명", example: "1200" },
    ...COMMON_TAIL,
  ],
};

/* ══ 4장 QR 지점 (M13) ═════════════════════════════════════════════════════
   ── 활성 여부의 기본값이 꺼짐인 것은 의도다 ─────────────────────────────────
   설치가 끝나기 전에 누군가 시험 삼아 스캔하면 오류 화면이 뜬다. 기본을 꺼짐으로 두면
   설치를 마치고 담당자가 켜는 순간부터만 살아 있다.

   ── 활성 여부를 끄는 것과 지우는 것은 다르다 ────────────────────────────────
   안내판을 교체했을 때 옛 코드는 **남겨두고 끈다**. 지우면 그 코드로 들어온 시민이
   "등록된 적 없는 코드"로 안내받는데, 실제로는 예전에 우리가 붙였던 코드다.
   그 둘은 할 말이 다르다 (U-CM-02 · S11 의 두 갈래). */
export const INSTALL_STATUS = ["설치예정", "설치완료", "훼손", "철거"];
export const INSTALL_STATUS_OPTIONS = INSTALL_STATUS.map(v => ({ value: v, label: v }));

export const QR_FIELDS = [
  { key: "code", spec: "qr_code", label: "QR 식별자", required: true, type: "text",
    range: "4~12자 · 영문 소문자+숫자 · 전역 유일", pattern: V.qrCode,
    minLength: 4, maxLength: 12, example: "dunjeon01" },
  { key: "name", spec: "name", label: "지점명", required: true, type: "text",
    range: "2~40자", minLength: 2, maxLength: 40, example: "둔전 시장 입구 버스정류장",
    hint: "사용자 화면 상단에 상시 노출되므로 40자를 넘기지 않습니다" },
  { key: "addr", spec: "address_road", label: "도로명주소", required: true, type: "address",
    range: "최대 100자", maxLength: 100, example: "처인구 포곡읍 둔전로 42", span: 2 },
  COORD,
  { key: "districtId", spec: "market_id", label: "소속 골목형 상점가", required: false, type: "select",
    options: withBlank(DISTRICT_OPTIONS, "— 지정 안 함 —"), span: 2,
    /* 「안내 상태로 진입합니다」에서 고쳤다 (2026-08-24, 사용자 요청). 「안내 상태」는
       우리가 화면 갈래에 붙인 이름(S03-E)이라 담당자에게 가리키는 대상이 없었다 —
       비웠을 때 사용자가 **실제로 보는 것**을 적는다. 세 곳인 것은 S03-E 의
       NEARBY_DISTRICT_COUNT 다 (DistrictEmpty.jsx). */
    hint: "골목형 상점가를 지정하지 않은 경우, 해당 QR로 진입한 사용자에게 가까운 골목형 상점가 3곳을 대신 안내합니다" },

  { key: "installStatus", spec: "install_status", label: "설치 상태", required: true, type: "select",
    options: INSTALL_STATUS_OPTIONS, example: "설치완료" },
  { key: "installedAt", spec: "installed_at", label: "설치일자", required: "cond",
    when: v => v.installStatus === "설치완료", type: "date", example: "2026-03-14",
    /* 「설치완료를 고르면 필수가 됩니다」에서 고쳤다 (2026-08-24, 사용자 요청).
       「설치완료」는 바로 위 칸에서 고르는 **선택지의 이름 그대로**여야 한다 —
       띄어 적으면 목록에 없는 값을 가리키는 줄이 된다. */
    hint: "설치완료를 선택하면 필수 항목으로 설정됩니다" },
  /* 활성 여부의 hint 를 뺐다 (2026-08-24, 사용자 요청) — 「끄면 이 코드로 들어온 사용자에게
     교체 안내가 뜹니다. 기본값은 꺼짐입니다」. 앞 문장은 **틀린 말이 됐다**: 시민 화면이
     훼손·철거(S11)와 준비 중(S11-A)을 가르면서, 꺼져 있을 때 뜨는 것이 설치 상태에 따라
     갈린다 — 설치완료인데 꺼져 있으면 「교체 안내」가 아니라 「아직 준비 중」이다.
     그 조합은 이 창의 경고 상자가 실제 문구까지 그대로 적어 준다 (QrPoints.jsx).
     뒷 문장(기본값)은 새로 만드는 자리의 이야기인데 **이 화면은 새로 만들지 않는다** —
     붙어 있는 지점의 현황만 고친다 (아래 qrEntryUrl 위 주석). */
  { key: "active", spec: "is_active", label: "활성 여부", required: true, type: "switch" },

  { key: "locationDetail", spec: "location_detail", label: "설치 상세 위치", required: false,
    type: "textarea", rows: 2, range: "최대 100자", maxLength: 100,
    example: "정류장 승차대 오른쪽 기둥, 눈높이", span: 2,
    hint: "설치와 점검에 쓰는 기록입니다. 사용자 화면에는 나오지 않습니다" },
  { key: "memo", spec: "memo", label: "관리 메모", required: false, type: "textarea", rows: 2,
    range: "최대 500자", maxLength: 500, span: 2 },
];

/* 진입 URL — QR 이미지는 이 값으로 외부 도구에서 만든다 (명세서 4장) */
export function qrEntryUrl(code) {
  const origin = typeof location !== "undefined" ? location.origin : "";
  return `${origin}/s/${code || ""}`;
}

/* 식별자 자동생성은 뺐다 (2026-08-20) — 관리자 화면에서 QR 지점을 새로 만들지 않는다.
   코드는 안내판에 인쇄되어 현장에 붙는 값이라, 화면에서 만들 수 있게 두면 인쇄물 없는
   코드가 표에 남는다. QR 지점 관리는 붙어 있는 지점의 **현황**만 다룬다. */

/* ══ 5장 오류신고 (M13) ════════════════════════════════════════════════════ */
export const REPORT_TARGET_TYPES = ["공공시설", "점포", "상점가", "축제", "기타"];
export const REPORT_TYPES = ["정보 오류", "없어진 시설", "위치 부정확", "추가 제안", "기타"];
export const REPORT_STATES = ["접수", "확인중", "처리완료", "반려", "중복"];

/* 신고를 닫는 상태 둘. 여기로 옮기려면 근거가 있어야 한다 (아래 memo 의 ◐).
   전에는 이름이 `REPORT_NEEDS_REPLY` 였고 회신 내용을 요구했다 — 회신을 없애면서
   요구는 내부 메모로 옮겼다 (2026-08-24. Reports.jsx 머리말). */
export const REPORT_CLOSING_STATES = ["처리완료", "반려"];

export const REPORT_FIELDS = [
  { key: "state", spec: "status", label: "처리 상태", required: true, type: "select",
    options: REPORT_STATES.map(v => ({ value: v, label: v })) },
  { key: "assignee", spec: "assignee", label: "담당자", required: false, type: "select" },
  { key: "memo", spec: "internal_memo", label: "내부 메모", required: "cond",
    when: v => REPORT_CLOSING_STATES.includes(v.state), type: "textarea", rows: 3,
    range: "최대 500자", maxLength: 500, span: 2,
    hint: "사용자에게 공개되지 않습니다. 처리완료 또는 반려로 옮기려면 반드시 적어야 합니다" },
  /* ── `reply_content`(회신 내용)가 여기 있었다 (2026-08-24 삭제) ─────────────
     **회신을 하지 않는다.** 시민 쪽 신고 폼은 처음부터 연락처를 받지 않았고
     (2026-08-18 결정, screens/detail/ReportForm.jsx), 접수 화면이 "개별 답변은 어려운
     점 양해 부탁드립니다"라고 적는다. 보낼 곳이 없는 글을 받는 칸이었다.
     `contact`(회신처)도 5-1 에서 함께 나갔다 — 받지 않으니 보관할 것도 파기할 것도 없다. */
];

/* ══ 8장 서비스 운영 설정 — 입력 항목이 없다 (2026-08-24, 사용자 요청) ══════
   `OPERATION_FIELDS` 여덟 줄이 여기 있었다: 주변 공공시설 안내 범위 · 안전시설 원거리
   배너 기준 · 상점가 임계 거리 · 신규 매장 판정 기간 · 골목 한바퀴 반경 · 탭별 지도 확대
   단계 둘. [환경 설정] 화면과 함께 **개발 쪽으로 넘어갔다.**

   8-2 API 쿼터가 2026-08-20 에 먼저 같은 길로 갔고(카카오 계약과 서버가 정하는 값),
   이번에 8-1 도 뒤따랐다 — 둘 다 **개별 건이 아니라 화면 전체가 도는 방식**이라
   담당자가 고칠 자리가 아니다. 명세서 범위 문단이 그은 선과 같은 선이다.

   값 자체는 없어지지 않았다. 시민 화면이 실제로 쓰는 두 값은 `facilities.js` 의
   `NEAR_LIMIT`(2000) · `NEAR_ENOUGH`(1000) 이고, 탭별 확대 단계는 `config.js` 의
   `TAB_MAP_LEVEL` 이다. 쿼터 값도 `data/settings.js` 의 `QUOTA_DEFAULTS` 에 남아
   대시보드의 사용량 카드가 읽는다 — 빠진 것은 **고치는 자리**이지 값이 아니다.
   (노출 순서 · 공공시설 source 와 같은 경우다) */

/* ══ 9장 계정 (M15) ════════════════════════════════════════════════════════
   `role`(권한) 항목이 빠졌다 (2026-08-20). 업무 화면 아홉 개에는 등급이 없다 —
   시설 하나를 고치는 일에 등급을 매길 이유가 없다.

   최종 관리자(2026-08-24)가 생긴 뒤에도 이 표는 그대로다. 지켜야 할 것이 **아이디가
   `admin` 인 계정 하나**이지 등급 체계가 아니라서, 판정을 아이디로 한다 (account.js 의
   `SUPER_ID`). `role` 열을 되살리면 등록·수정 폼에 고를 것이 사실상 없는 「권한」 칸이
   생기고, 그 칸이 이 표와 명세서 항목표를 함께 늘린다. */

export const ACCOUNT_FIELDS = [
  { key: "id", spec: "login_id", label: "아이디", required: true, type: "text",
    range: "4~20자 · 영문 소문자+숫자 · 첫 글자 영문 · 등록 후 수정 불가",
    pattern: V.loginId, minLength: 4, maxLength: 20, example: "yongin01" },
  { key: "name", spec: "name", label: "이름", required: true, type: "text",
    range: "2~20자", minLength: 2, maxLength: 20, example: "김담당" },
  /* hint 를 두지 않는다 (2026-08-24, 사용자 요청). "수정할 때 비우면 기존 비밀번호를
     그대로 둡니다"가 붙어 있었는데, 칸 안의 범위 표시가 이미 무엇을 넣는 칸인지 말하고
     비워 두는 쪽은 아무 일도 일어나지 않는 쪽이라 미리 배워 둘 것이 없다.

     ── 가려서 보여주고, 눈으로 열어 본다 (2026-08-24, 사용자 요청) ─────────────
     `type: "text"` 였다 — 비밀번호가 화면에 그대로 적혀 있었다. 이제 까만 동그라미로
     가리고 칸 오른쪽 눈 단추로 연다 (`reveal`. design-systems 의 Input).
     **가리는 것이 기본이고 여는 것이 선택**인 이유는 이 화면이 남의 계정을 다루는
     자리이기 때문이다 — 누가 뒤에 서 있을 수 있는 사무실에서 목록을 훑는 동안 비밀번호가
     내내 떠 있을 이유가 없다. 그러면서도 열 수는 있어야 한다: 새로 넣어 준 값을 전화로
     불러 줘야 하고, 오타가 나도 가려져 있으면 알 수 없다.

     실서비스에서는 이 칸이 **빈 채로 열린다** — 서버가 해시를 돌려주지 그 값을 돌려주지
     않기 때문이다. 그때 눈 단추는 「방금 내가 넣은 값」을 확인하는 용도로만 남는다. */
  { key: "pw", spec: "password", label: "비밀번호", required: true, type: "password", reveal: true,
    range: "10~64자 · 영문·숫자·특수문자 중 2종 이상", span: 2 },
  { key: "active", spec: "is_active", label: "사용 여부", required: true, type: "switch" },
  { key: "email", spec: "email", label: "이메일", required: true, type: "text",
    range: "최대 100자", maxLength: 100, pattern: V.email, example: "gis@yongin.go.kr" },
  { key: "phone", spec: "phone", label: "연락처", required: false, type: "text",
    range: "최대 13자 · 숫자와 하이픈만", maxLength: 13, pattern: V.phone, example: "031-324-0000" },
];

/* ══ 저장 검사 ═════════════════════════════════════════════════════════════
   명세서의 required · range 열이 그대로 검사가 되므로, 표를 고치면 검사도 따라온다 —
   검사 규칙을 화면에 따로 적지 않는다. */
export function isRequired(field, values) {
  if (field.required === "auto") return false;
  if (field.required === "cond") return typeof field.when === "function" ? !!field.when(values) : false;
  return !!field.required;
}

export function validate(fields, values, extra) {
  const bad = {};
  for (const f of fields) {
    if (f.required === "auto" || f.type === "readonly") continue;
    const raw = values[f.key];
    const empty = f.type === "multiselect"
      ? !(Array.isArray(raw) && raw.length)
      : (raw == null || String(raw).trim() === "");

    /* 가부 항목은 켜짐과 꺼짐이 둘 다 값이다 — 비어 있을 수가 없다 */
    if (f.type === "switch") continue;

    if (empty) {
      if (isRequired(f, values)) {
        bad[f.key] = f.required === "cond" ? "이 조건에서는 필수 항목입니다." : "필수 항목입니다.";
      }
      continue;   /* 비어 있으면 길이·형식을 볼 것이 없다 */
    }

    const s = String(raw).trim();
    if (f.minLength && s.length < f.minLength) { bad[f.key] = `${f.minLength}자 이상 적습니다.`; continue; }
    if (f.maxLength && s.length > f.maxLength) { bad[f.key] = `${f.maxLength}자까지 적을 수 있습니다.`; continue; }
    if (f.pattern && !f.pattern.re.test(s)) { bad[f.key] = f.pattern.msg; continue; }
    if (f.type === "number") {
      const n = Number(s);
      if (!Number.isFinite(n)) { bad[f.key] = "숫자로 적습니다."; continue; }
      if (f.min != null && n < f.min) { bad[f.key] = `${f.min} 이상이어야 합니다.`; continue; }
      if (f.max != null && n > f.max) { bad[f.key] = `${f.max} 이하여야 합니다.`; continue; }
    }
  }
  /* 화면이 아는 검사는 화면이 넘긴다 — 기간 역전(V-07), 아이디 중복 같은 것들은
     항목 하나만 봐서는 알 수 없어 표에 적을 수가 없다.

     **이미 잡힌 칸은 덮지 않는다.** 형식이 틀린 값은 중복인지 아닌지를 따질 것도 없는데,
     덮어쓰면 "dunjeon-01"을 넣었을 때 「이미 쓰는 코드입니다」가 떠서 담당자가 하이픈을
     빼면 통과할 것처럼 읽힌다. 더 근본적인 오류가 먼저다. */
  if (typeof extra === "function") {
    const more = extra(values) || {};
    for (const k of Object.keys(more)) if (!bad[k]) bad[k] = more[k];
  }
  return bad;
}

/* ── 1:N 목록의 필수 칸 (2026-08-24) ─────────────────────────────────────────
   위 `validate` 는 **항목표의 칸**을 본다. 1:N 목록(프로그램 · 부스)은 값이 배열이라
   그 길로 들어오지 않는데, 그동안 Repeater 의 열 이름에는 별표(`*`)가 붙어 있었다 —
   **아무도 검사하지 않는 별표**였다. 지키지 않아도 되는 표시가 화면에 서 있으면 담당자는
   나머지 별표도 같은 것으로 여기게 되므로, 붙인 이상 여기서 막는다.

   ── 첫 줄 하나만 말한다 ────────────────────────────────────────────────────
   Repeater 는 칸마다 오류를 달지 못하고 목록 하나에 한 줄을 단다. 스무 줄 중 셋이 비었을
   때 셋을 다 늘어놓으면 그 한 줄이 문단이 되므로, **처음 걸린 줄과 그 줄에서 빈 칸들**만
   적는다. 고치고 다시 누르면 다음 줄이 나온다 — 어차피 한 번에 한 줄씩 손보게 된다.
   줄 번호로 가리키는 것은 V-07 검사와 같은 이유다 (Festivals 의 extraValidate). */
export function missingInRows(columns, rows) {
  const need = columns.filter(c => c.required);
  if (!need.length) return null;
  const list = Array.isArray(rows) ? rows : [];
  for (let i = 0; i < list.length; i += 1) {
    const row = list[i] || {};
    const gone = need.filter(c => {
      const raw = row[c.key];
      return raw == null || String(raw).trim() === "";
    });
    /* 「을(를)」로 적지 않는다 — 빈 칸이 하나일 때도 둘일 때도 마지막 낱말의 받침이
       조사를 정한다 (design-systems 의 josa). 괄호를 남기면 화면이 사람 말을 하다 말고
       서식으로 돌아간 것처럼 읽힌다 */
    if (gone.length) return `${i + 1}번째 줄의 ${eul(gone.map(c => c.label).join(" · "))} 채워 주세요.`;
  }
  return null;
}

/* ── 여기 있던 `EMPTY_NOTE` 를 뺐다 (2026-08-20, 사용자 요청) ────────────────
   여섯 폼 밑에 늘 붙던 세 문장이었다 ("선택 항목을 비워두면 시민용 화면에 - 로
   표시됩니다 …"). 폼을 여는 이유는 값을 넣는 것이지 원칙을 다시 읽는 것이 아니다.
   폼마다 꼭 필요한 말은 화면이 `note` 로 직접 넘긴다 (계정 폼의 비밀번호 규칙). */
