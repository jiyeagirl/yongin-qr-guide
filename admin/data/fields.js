import { STORES } from "../../screens/main/data/dunjeon.js";
import { DISTRICTS } from "../../screens/main/data/districts.js";

/* 입력 항목 정의서(2026-08-19)의 항목표 — **관리자 폼 여덟 개의 유일한 출처다.**
 *
 * ── 왜 표를 코드에 두는가 ───────────────────────────────────────────────────
 * 폼을 화면마다 JSX 로 적으면 항목이 여덟 군데에 흩어진다. 정의서가 한 줄 바뀌었을 때
 * 고칠 곳을 여덟 번 찾아야 하고, 그중 하나는 반드시 빠진다. 여기 한 표만 고치면
 * 폼과 표 머리글이 함께 따라온다.
 *
 * ── 시민 화면의 반대편이다 ─────────────────────────────────────────────────
 * 같은 정의서에서 나온 표가 저쪽에도 있다:
 *
 *   읽기: screens/detail/FacilityDetail.jsx 의 FIELDS   (2-1 ~ 2-4)
 *   읽기: screens/detail/StoreDetail.jsx 의 InfoList     (1-2)
 *   읽기: screens/detail/FestivalDetail.jsx 의 InfoList  (1-3)
 *   쓰기: 이 파일
 *
 * 지금 합치지 않은 것은 의도다. 잘 돌고 있는 시민 화면 세 개를 아직 검증되지 않은
 * 관리자 폼을 위해 뜯을 이유가 없다. 대신 **양쪽이 어긋나면 정의서를 따른다**는 규칙이
 * 명세서 참조 문서에 적혀 있고, 저쪽 파일 머리말도 이 파일을 가리킨다.
 *
 * ── 필드 한 줄이 갖는 것 ────────────────────────────────────────────────────
 *   key       데이터의 필드명
 *   label     정의서의 항목명 그대로. 줄여 쓰지 않는다
 *   required  정의서의 필수/선택. **이 값이 폼의 배지가 되고, 저장 검사가 된다**
 *   type      text | number | textarea | select | switch | readonly
 *   example   정의서의 "예)" 열. 형식이 자유로운 칸에서 담당자마다 다르게 적는 것을 막는다
 *   span      2 면 두 열을 다 쓴다 (주소·부가정보처럼 긴 값)
 *   unit      표에 값을 찍을 때 붙이는 단위 ("칸", "명")
 */

/* 원천 분류 목록은 실제 데이터에서 뽑는다. 손으로 적어두면 데이터가 늘 때 따라오지 않고,
   목록에 없는 값을 가진 점포가 폼에서 빈 칸으로 보인다. */
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
export const BIZ_MAJOR = uniq(STORES.map(s => s.bizL));
export const BIZ_MINOR = uniq(STORES.map(s => s.bizS));
export const KSIC = uniq(STORES.map(s => s.ksic));
export const DISTRICT_OPTIONS = DISTRICTS.map(d => ({ value: d.id, label: d.name }));

const opts = list => list.map(v => ({ value: v, label: v }));

/* ── 1-1 상점가 정보 ────────────────────────────────────────────────────────
   네 항목이 전부다. **기준일자를 갖지 않는다** (정의서 3-2 미표기 대상) —
   그래서 폼에도 기준일 칸이 없다. 화면에 없는 것은 입력에도 없어야 한다. */
export const DISTRICT_FIELDS = [
  { key: "name", label: "상점가명", required: true, type: "text", example: "둔전골목형상점가", span: 2 },
  { key: "addr", label: "주소", required: true, type: "text", example: "처인구 포곡읍 포곡로124번길 2 일원", span: 2 },
  { key: "stores", label: "전체 점포수", required: true, type: "number", example: "335", unit: "곳" },
  { key: "onnuri", label: "온누리상품권 가맹 점포수", required: true, type: "number", example: "139", unit: "곳" },
];

/* ── 1-2 개별 점포 정보 ─────────────────────────────────────────────────────
   **상권업종중분류명이 없다** (2026-08-19). 소분류와 겹치는 자리가 너무 많아 뺐다 —
   중분류 45종 중 13종이 소분류와 글자까지 같고, 335곳 중 88곳(26%)이 두 줄에 같은 값을
   적게 된다 (StoreDetail.jsx 머리말). 데이터에는 `biz` 로 남아 목록과 검색이 쓴다.

   지점명이 선택인 것은 골목상점가의 실제 사정이다 — 단독 점포가 대부분이라 열에 아홉은
   원천에 값이 없다. 필수로 두면 담당자가 상호명을 한 번 더 적게 된다. */
export const STORE_FIELDS = [
  { key: "name", label: "상호명", required: true, type: "text", example: "은행나무곱창" },
  { key: "branch", label: "지점명", required: false, type: "text", example: "에버랜드점" },
  { key: "addr", label: "도로명주소", required: true, type: "text", example: "처인구 포곡읍 둔전로 42", span: 2 },
  { key: "bizL", label: "상권업종대분류명", required: true, type: "select", options: opts(BIZ_MAJOR), example: "음식" },
  { key: "bizS", label: "상권업종소분류명", required: false, type: "select", options: opts(BIZ_MINOR), example: "곱창전골/구이" },
  { key: "ksic", label: "표준산업분류명", required: false, type: "select", options: opts(KSIC), example: "기타 주점업", span: 2 },
  { key: "onnuri", label: "온누리상품권 가맹 여부", required: false, type: "switch", example: "가맹이면 켭니다" },
];

/* ── 1-3 축제 정보 ──────────────────────────────────────────────────────────
   부스·임시시설은 정의서에 없다 (자료 확보가 협의 대상이라 명세서에서 `C` 다).
   있는 축제만 시민 화면이 그 섹션을 그리므로, 폼에도 두지 않는다 — 여기에 빈 칸을
   만들어 두면 담당자는 채워야 하는 것으로 읽고, 채운 값의 출처는 아무도 모른다. */
export const FESTIVAL_FIELDS = [
  { key: "name", label: "축제명", required: true, type: "text", example: "둔전 골목축제", span: 2 },
  { key: "districtId", label: "주최 상점가", required: true, type: "select", options: DISTRICT_OPTIONS, example: "둔전골목형상점가", span: 2 },
  { key: "start", label: "시작일", required: true, type: "text", example: "2026-10-17" },
  { key: "end", label: "종료일", required: true, type: "text", example: "2026-10-17" },
  { key: "time", label: "시간", required: false, type: "text", example: "15:00~21:00" },
  /* 예시값은 담당자가 보고 그대로 따라 적는 자리다. 시민 화면의 표기 규칙과 어긋나면
     어긋난 값이 그대로 들어온다 — 프로그램 이름 사이는 쉼표다 (districts.js 주석) */
  { key: "program", label: "주요 프로그램", required: false, type: "textarea", rows: 3,
    example: "먹거리 장터, 상인 경품행사, 어르신 한마당", span: 2 },
];

/* ── 2-1 ~ 2-4 공공시설 ─────────────────────────────────────────────────────
   유형마다 항목이 다르다. 한 폼에 다 펼쳐놓고 "해당 없으면 비우세요"로 두면
   AED 를 등록하는 담당자가 기저귀 교환대 칸을 보게 된다.

   **AED 와 대피소에는 명칭 칸이 없다** (정의서 2-1 · 2-4 에 항목이 없다).
   화면이 도로명주소에서 만든다 (U-FC-10). 폼에서는 readonly 로 만들어질 이름을
   미리 보여준다 — 규칙으로 생기는 값이라는 것이 입력하는 사람에게도 보여야 한다. */
const ADDR = { key: "addr", label: "도로명주소", required: true, type: "text",
  example: "처인구 포곡읍 둔전로 42", span: 2 };

const DERIVED_NAME = { key: "name", label: "명칭 (도로명주소에서 자동 생성)", required: false,
  type: "readonly", span: 2,
  example: "정의서에 명칭 항목이 없어 화면이 만듭니다 (U-FC-10)" };

export const FACILITY_FIELDS = {
  aed: [
    ADDR,
    DERIVED_NAME,
    { key: "place", label: "설치 위치", required: true, type: "text",
      example: "1층 로비 자동심장충격기함", span: 2 },
  ],
  toilet: [
    { key: "name", label: "화장실명", required: true, type: "text", example: "둔전시장 공중화장실", span: 2 },
    ADDR,
    /* 개방시간이 칸수보다 위인 이유: 나머지 일곱은 "가서 쓸 만한가"를 말하는데
       이것은 **가도 되는가**를 말한다. 잠긴 화장실 앞에서 칸수는 소용이 없다 */
    { key: "hours", label: "개방시간", required: false, type: "text", example: "상시 개방 / 05:00~24:00", span: 2 },
    { key: "menToilet", label: "남성용 대변기수", required: false, type: "number", example: "2", unit: "칸" },
    { key: "menUrinal", label: "남성용 소변기수", required: false, type: "number", example: "3", unit: "칸" },
    { key: "womenToilet", label: "여성용 대변기수", required: false, type: "number", example: "3", unit: "칸" },
    { key: "womenUrinal", label: "여성용 소변기수", required: false, type: "number", example: "2", unit: "칸" },
    { key: "emergencyBell", label: "비상벨 설치 여부", required: false, type: "switch", example: "있으면 켭니다" },
    { key: "diaperTable", label: "기저귀 교환대", required: false, type: "switch", example: "있으면 켭니다" },
    { key: "entranceCctv", label: "입구 CCTV", required: false, type: "switch", example: "있으면 켭니다", span: 2 },
  ],
  rest: [
    { key: "name", label: "쉼터명칭", required: true, type: "text", example: "둔전마을회관 무더위쉼터", span: 2 },
    ADDR,
    { key: "hours", label: "운영시간", required: false, type: "text", example: "평일 09:00~18:00 / 24시간 개방" },
    { key: "capacity", label: "이용가능 인원", required: false, type: "number", example: "40", unit: "명" },
    { key: "extra", label: "부가정보", required: false, type: "textarea", rows: 2,
      example: "실내 무더위쉼터 · 냉방기 있음 · 정수기 있음", span: 2 },
  ],
  shelter: [
    ADDR,
    DERIVED_NAME,
    { key: "place", label: "실제 위치", required: true, type: "text",
      example: "포곡중학교 운동장 전체 (지진 옥외대피장소)", span: 2 },
    { key: "capacity", label: "최대 수용 인원", required: false, type: "number", example: "1200", unit: "명" },
  ],
};

/* ── QR 지점 (A-QR-01) ──────────────────────────────────────────────────────
   **정의서에 없는 표다.** 정의서는 공공데이터에서 받는 항목을 정하는 문서인데,
   QR 지점은 우리가 만들어 붙이는 것이라 원천이 없다. 그래서 여기 있는 항목은
   시민 화면이 실제로 쓰는 값(screens/main/data/qr.js)에서 거꾸로 뽑았다.

   소속 상점가를 관리자가 직접 고르는 것이 핵심이다 (U-ST-01) — 앱은 이것을
   계산하지 않는다. QR 지점이 50개소뿐이라 사람이 정하는 편이 정확하다. */
export const QR_FIELDS = [
  { key: "code", label: "QR 코드", required: true, type: "text", example: "dunjeon-01" },
  { key: "name", label: "지점 명칭", required: true, type: "text", example: "둔전 시장 입구 버스정류장" },
  { key: "dong", label: "행정동", required: true, type: "text", example: "처인구 포곡읍 둔전리", span: 2 },
  { key: "lat", label: "위도", required: true, type: "text", example: "37.28874" },
  { key: "lng", label: "경도", required: true, type: "text", example: "127.19931" },
  { key: "districtId", label: "소속 상점가", required: true, type: "select", options: DISTRICT_OPTIONS,
    example: "관리자가 직접 지정합니다 — 앱이 계산하지 않습니다", span: 2 },
  { key: "installedAt", label: "설치 시점", required: false, type: "text", example: "2026.03" },
  { key: "active", label: "활성 여부", required: true, type: "switch",
    example: "끄면 이 코드로 들어온 시민에게 S11 안내가 뜹니다" },
];

/* 폼 아래 한 줄. 여덟 화면이 같은 문장을 쓴다 — 담당자는 자기가 비운 칸이
   시민 화면에서 어떻게 보이는지 확인할 방법이 지금 없다. */
export const EMPTY_NOTE =
  "선택 항목을 비워두면 시민용 화면에 \"-\" 로 표시됩니다. 항목을 감추지 않는 것은 "
  + "\"원천에 값이 없음\"과 \"우리가 빠뜨림\"을 구분하기 위해서입니다.";

/* 필수 항목이 비었는지 본다. 정의서의 required 가 그대로 저장 검사가 되므로,
   표를 고치면 검사도 따라온다 — 검사 규칙을 화면에 따로 적지 않는다. */
export function validate(fields, values) {
  const bad = {};
  for (const f of fields) {
    if (!f.required || f.type === "readonly") continue;
    const v = values[f.key];
    if (f.type === "switch") continue;                     /* 켜짐/꺼짐 둘 다 값이다 */
    if (v == null || String(v).trim() === "") bad[f.key] = "필수 항목입니다.";
  }
  return bad;
}
