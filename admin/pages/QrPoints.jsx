import React from "react";
import {
  PageHeader, Toolbar, DataTable, Select, Badge, Switch, Notice, Pagination, Button,
  CoordField, fixCoord, EMPTY_MARK, FormField, OptionPicker,
} from "../../design-systems/admin.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { DISTRICTS, GU_ORDER, guOf } from "../../screens/main/data/districts.js";
import { QR_ROWS, DISTRICT_ROWS } from "../data/sources.js";
import { QR_CODE_POOL, QR_CODE_TOTAL } from "../data/qrCodes.js";
/* `INSTALL_STATUS` 를 여기서 가져오지 않는다 (2026-08-26) — 설치 상태 고르개가 없어졌다.
   항목표(`QR_FIELDS`)의 그 칸은 그대로이고 폼에서 여전히 고른다 */
import { QR_FIELDS } from "../data/fields.js";
import { useCollection, readCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M11 QR 지점 목록 · M12 QR 지점 수정.
 *
 * ── 모든 항목을 고칠 수 있다 (2026-08-24, 사용자 요청으로 뒤집음) ────────────
 * 2026-08-20 부터 이 화면은 **현황만** 갱신했다. 고칠 수 있는 것이 소속 상점가 · 설치 상태 ·
 * 설치일자 · 사용 여부 · 설치 상세 위치 · 관리 메모 여섯뿐이었고, 지점을 가리키는 네 값
 * (QR ID · 지점명 · 주소 · 좌표)은 다이얼로그 위쪽에 읽기 전용으로 적기만 했다.
 * 근거는 **안내판에 인쇄되어 현장에 붙은 값**이라는 것이었다 — 화면에서 고쳐 봐야
 * 종이와 어긋난다.
 *
 * **그 근거는 사실로 남지만 잠그는 방식이 아니게 됐다.** 화면이 담당자를 대신해 판단하는
 * 대신, 무슨 일이 일어나는지를 적고 결정은 담당자가 한다: 열 항목 전부 폼에 서고, 주소를
 * 바꾸면 좌표가 따라온다(입력 원칙 3번). QR ID 도 그중 하나인데, **2026-08-26 부터는
 * 적는 칸이 아니라 고르는 칸**이다 — 안내판을 교체했으면 새 안내판의 ID 로 다시 잇는다
 * (아래 「QR ID 는 적는 것이 아니라 고르는 것이다」).
 *
 * 같은 판에서 [삭제]도 함께 열었다가 **2026-08-26 에 도로 닫혔다** — 아래
 * 「지우는 자리가 없다」.
 *
 * ── 만드는 길도 열었다 (2026-08-25, 사용자 요청) ────────────────────────────
 * [QR 지점 등록]이 없던 근거는 "지점이 새로 생기는 일은 화면에서 값을 하나 만드는 일이 아니라
 * **안내판을 제작해 현장에 붙이는 일**"이라는 것이었다. 그 말은 지금도 맞다. 틀린 것은
 * **거기서 끌어낸 결론**이었다 — 안내판이 현장에 서고 나면 그 코드는 **어딘가에는 반드시
 * 등록되어야 한다.** 등록하는 자리를 화면에 두지 않으면 그 일은 사라지는 것이 아니라
 * 개발 쪽 요청으로 넘어가고, 담당자는 안내판을 붙여 놓고 기다린다.
 *
 * ── QR ID 는 적는 것이 아니라 **고르는 것**이다 (2026-08-26. 2026-08-25 회의 결정사항) ──
 * 등록을 열면서 「**식별자 자동생성은 없다** — 화면이 지어낸 코드는 인쇄된 코드와 맞을
 * 이유가 없으므로 담당자가 적는다」로 닫아 두었었다. 걱정은 맞았고 답이 반대였다:
 * 지어내지 않는 방법은 담당자에게 받는 것이 아니라 **한 곳에서 미리 만들어 두고 그중에서
 * 고르게 하는 것**이다. 손으로 옮겨 적는 한 오타는 반드시 나고, 오타 난 코드는 형식만
 * 맞으면 그대로 저장된다 — 안내판은 현장에 붙어 있는데 표에는 한 글자 다른 코드가 앉고,
 * 그 안내판을 찍은 시민은 「등록되지 않은 QR 코드」를 본다. 아무도 그 사실을 모른다.
 *
 * 그래서 **QR ID 와 QR 이미지 50개를 먼저 만들어 두고**(`data/qrCodes.js`) 등록은 그중
 * 아직 아무 지점에도 매칭되지 않은 하나를 **골라서 잇는 일**이 됐다. 담당자는 손에 든
 * 안내판의 ID 를 검색해 고른다. 중복은 검사로 막는 것이 아니라 **애초에 만들어지지
 * 않는다** — 이미 걸린 ID 는 목록에 서 있되 고를 수 없다 (목록에서 빼지 않는 이유는
 * OptionPicker 머리말에 있다: 없는 것과 이미 쓰는 것은 할 일이 다르다).
 *
 * 이미지는 이 화면에 없다. 코드를 그림으로 인코딩해 인쇄용 파일을 떨구는 일은 **개발 쪽
 * 일괄 작업**이고(명세서 범위 문단), 여기가 하는 일은 그 결과물을 지점에 잇는 것이다.
 *
 * 열면서 **등록 창 맨 위에 안내 상자를 세웠다가 같은 날 걷어냈다** (사용자 요청).
 * 「안내판은 이 화면에서 만들어지지 않습니다 · 인쇄된 코드와 한 글자라도 다르면 … ·
 * 등록 직후에는 설치예정 · 스위치 꺼짐이라 …」 넉 줄이었고, 식별자 칸에도 등록 전용 안내
 * 줄이 하나 더 붙어 있었다. **여기 적힌 것이 전부 화면에 이미 서 있다** — 식별자 칸은
 * 「안내판에 인쇄된 코드입니다」를 항목표에서 그대로 받고, 기본값은 등록 창이 열릴 때
 * 설치 상태 고르개와 꺼진 스위치가 보여주며, 그 조합에서 무엇이 뜨는지는 스위치를 켜지
 * 않은 채 저장한 뒤 수정 창의 경고 상자가 적는다. 새 창을 여는 사람에게 네 줄을 먼저
 * 읽히는 대신 칸이 제 자리에서 말하게 둔다.
 *
 * **덮개의 열쇠는 여기서만 code 와 갈라진다.** 원본 표(qr.js)의 행은 id 를 code 로 맞춰
 * 두었지만(SOURCE), 화면에서 등록한 행의 id 는 덮개가 매기는 일련번호(`qr-new-001`)다.
 * 식별자를 고쳐도 id 를 따라 바꾸지 않는 규칙(onSave 주석)이 등록에도 그대로 걸린 것뿐이라,
 * 화면과 시민 화면이 보는 값은 언제나 `code` 다.
 *
 * ── 소속 상점가는 원래부터 인쇄되지 않는 값이다 (2026-08-24) ────────────────
 * 위 넷이 잠겨 있던 동안에도 이 하나는 폼에 있었다. 어디에도 인쇄되지 않고, **상점가는
 * 지워질 수 있으며 지우면 거기 걸린 QR 지점이 함께 가기 때문**이다 (Districts.jsx).
 * 소속이 읽기 전용이면 담당자에게 남는 길은 둘뿐이었다 — 상점가를 지우지 않거나, 멀쩡한
 * 안내판을 함께 지우거나. 지금은 지점을 다른 상점가로 옮기거나 [지정 안 함]으로 둘 수 있고,
 * **고르개에는 지금 살아 있는 상점가만 오른다** — 지워진 상점가로 옮길 수 있으면 방금 만든
 * 길이 다시 같은 자리로 돌아온다.
 *
 * ── 이 화면이 시민용의 시작점을 정한다 ──────────────────────────────────────
 * 시민이 보는 모든 거리("약 320m")가 여기 등록된 좌표 한 점에 매달려 있다. 좌표가 100m
 * 틀리면 그 지점으로 들어온 시민이 보는 **모든 숫자**가 100m 틀린다. 그래서 좌표를 숫자로
 * 받지 않고 지도로 받는다 (명세서 입력 원칙 3번) — 37.28874 가 맞는 값인지 아는 사람은 없다.
 *
 * ── 소속 상점가가 선택 항목이 되었다 (명세서 4장) ──────────────────────────
 * 예전에는 필수였는데, 명세서가 ○ 로 두고 이유까지 적었다 — "비우면 시민용 상점가 탭이
 * 안내 상태로 진입한다". 그 상태(S03-E)는 화면이 이미 갖고 있는 정상적인 갈래다.
 * 필수로 두면 근처에 상점가가 없는 지점(공원 · 관공서 앞)에 억지로 먼 상점가를 붙이게 되고,
 * 그러면 시민 화면이 5km 떨어진 상점가를 "여기 상점가"라고 말한다.
 * **앱은 이것을 계산하지 않는다** (U-ST-01) — 사람이 정하는 편이 정확하다.
 *
 * ── 설치 상태와 사용 여부는 다른 값이다 ─────────────────────────────────────
 * 설치 상태는 **현장의 사실**(설치예정 · 설치완료 · 훼손 · 철거)이고, 사용 여부는
 * **우리가 켜고 끄는 스위치**다. 둘을 하나로 묶으면 "붙이긴 했는데 아직 열지 않은" 상태를
 * 표현할 수 없다. `is_active` 기본값이 꺼짐인 것도 그래서다 — 설치가 끝나기 전에 누군가
 * 시험 삼아 스캔하면 오류 화면이 뜬다.
 *
 * ── 이름이 「활성 여부」에서 **「사용 여부」**가 됐다 (2026-08-26, 사용자 요청) ────
 * 계정 관리가 같은 스위치를 처음부터 「사용 여부」라고 불렀다. **같은 일에 화면마다 다른
 * 이름을 쓰고 있었던 것**이고, 그중 하나를 고른다면 「활성」이 아니라 「사용」이다 —
 * 활성/비활성은 시스템이 자기 상태를 부르는 말이고, 담당자가 하는 일은 이 안내판을
 * 「쓰느냐 안 쓰느냐」다. 저장되는 필드는 `active` 그대로다 (명세서 4장의 `is_active`).
 *
 * ── 지우는 자리가 없다 (2026-08-26, 사용자 요청) ─────────────────────────────
 * 안내판을 교체했을 때 옛 코드는 **남겨두고 끄는 것**이 원칙이다. 지우면 그 코드로 들어온
 * 시민이 "등록된 적 없는 코드"로 안내받는데, 실제로는 예전에 우리가 붙였던 코드다. 그 둘은
 * 할 말이 다르다 (U-CM-02 · S11 의 두 갈래). 대시보드의 지점별 스캔을 보면 철거한
 * 2019년 안내판을 아직 찍는 사람이 있다 — 그것이 「지우지 말고 끄라」는 권고의 근거다.
 *
 * 2026-08-24 에 [삭제]를 열면서 **버튼을 없애는 대신 확인 창의 각주가 권고를 적는**
 * 쪽으로 바꿨었다. 이틀 만에 되돌아왔다: 각주는 **누르고 들어온 사람에게 하는 말**이라,
 * 읽든 안 읽든 그 다음에 일어나는 일은 영구 삭제다. 원칙이 「끈다」라면 화면에는 끄는
 * 스위치만 있으면 된다 — 정보 관리 다섯이 v1.15 에서 같은 길을 갔고(거기서는 [노출
 * 여부]가 남았다), 이제 계정 관리와 함께 마지막 둘이 따라간다. **관리자 웹에 삭제가
 * 남아 있는 화면은 없다.**
 */

/* 등록 창에만 서던 `NEW_CODE_HINT` 가 여기 있었다 (2026-08-25 삭제, 사용자 요청) —
   「안내판 제작에 넘긴 코드와 똑같이 적습니다 …」. 같은 날 등록 안내 상자와 함께 나갔다
   (아래 `before` 주석). 항목표의 `code` hint 는 그대로다. */

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});

/* 열쇠를 맞추던 한 줄(`code` → `id`)이 여기 있었다 — 2026-08-25 에 `data/sources.js` 의
   `QR_ROWS` 로 옮겼다. 상점가 관리가 같은 줄을 따로 갖고 있었다. */

/* ── 설치 상태 고르개가 없어지고 **소속 구**가 그 자리에 섰다 (2026-08-26, 사용자 요청) ──
   `STATUS_OPTIONS`(「전체 설치 상태」 + 넷)가 여기 있었다. 뺀 이유는 그 값이 이 화면에서
   **좁히는 축이 아니라 읽는 값**이기 때문이다 — 표에 배지로 서 있고, 손이 가야 하는
   조합(설치완료인데 꺼짐)은 `rowTone` 이 줄째로 세워 이미 눈에 띈다. 담당자가 여기서
   「철거된 것만」을 골라 훑는 일은 없다.

   대신 목록이 커졌을 때 실제로 필요한 축을 세운다. 지금은 세 곳이지만 안내판은 시 전역에
   붙고, 그때 담당자가 하는 일은 **자기 구의 지점을 훑는 것**이다. 공공시설과 같은 고르개이고
   같은 규칙이다 — 구는 지점의 항목이 아니라 **주소에서 읽는 값**이다 (districts.js 의 `guOf`).
   `GU_ORDER` 셋을 그대로 세운다: 자료에 있는 구만 세우면 화면마다 고르개의 길이가 달라진다. */
const GU_OPTIONS = [{ value: "", label: "전체 구" }].concat(GU_ORDER.map(g => ({ value: g, label: g })));

const ACTIVE_OPTIONS = [
  { value: "", label: "사용 여부 전체" },
  { value: "y", label: "사용" },
  { value: "n", label: "미사용" },
];

const STATUS_TONE = { 설치예정: "warning", 설치완료: "success", 훼손: "danger", 철거: "neutral" };

export function QrPoints({ onToast }) {
  /* `remove` 를 더 이상 꺼내지 않는다 (2026-08-26) — 이 화면에 지우는 자리가 없다.
     `patch` 는 표의 [사용 여부] 토글이 한 줄을 바로 끄고 켜는 데 쓴다 */
  const { rows, upsert, patch, patchMany } = useCollection("qr", QR_ROWS, null, "QR 지점");
  const [gu, setGu] = React.useState("");
  const [active, setActive] = React.useState("");
  const list0 = useListState([gu, active]);

  /* 고르개에 오르는 상점가 — 항목표의 붙박이 목록(QR_FIELDS 의 options)이 아니라 **지금
     살아 있는 것**을 쓴다. 지워진 상점가가 고르개에 남아 있으면, 지점을 옮겨 살려 두려던
     담당자가 방금 지운 상점가를 다시 고르게 되고 그 지점은 그대로 다시 사라진다.
     32개짜리 배열이라 렌더마다 다시 만들어도 값이 나가지 않는다. */
  const districtOptions = [{ value: "", label: "— 지정 안 함 —" }]
    .concat(readCollection("districts", DISTRICT_ROWS).map(d => ({ value: d.id, label: d.name })));

  /* **열 항목 전부** 폼에 선다 (2026-08-24. 머리말). 종전에는 여기서 여섯 개만 골라
     냈다 (`EDIT_KEYS`). 항목표를 그대로 쓰되 하나만 갈아끼운다 — 소속 상점가는 항목표의
     붙박이 목록이 아니라 **지금 살아 있는** 상점가를 봐야 한다.

     식별자 칸의 안내 줄을 등록/수정에서 가르던 갈래가 여기 있었다 (2026-08-25 삭제) */
  const fieldsFor = () => QR_FIELDS
    .map(f => (f.key === "districtId" ? { ...f, options: districtOptions } : f));

  const ed = useRecordEditor({
    fieldsFor,
    /* 안내판을 붙이고 나서 등록하는 자리라 **현장 기록은 설치예정, 스위치는 꺼짐**에서
       시작한다 (명세서 4장의 `is_active` 기본값). 이 조합을 찍으면 오류가 아니라
       「곧 열립니다」다 — 여는 것은 담당자가 따로 내리는 결정이다 */
    initial: () => ({ installStatus: "설치예정", active: false }),
    /* 덮개의 열쇠는 `id` 이고 이 표의 열쇠는 `code` 다 (SOURCE 주석). 식별자를 고쳐도
       **행의 id 는 그대로 둔다** — id 까지 따라 바꾸면 덮개가 그 행을 새 행으로 보고
       옛 id 짜리 원본이 목록에 하나 더 남는다. 화면과 시민 화면이 보는 것은 `code` 다.
       **등록할 때는 id 를 지어 넣지 않는다** — 비워서 넘겨야 덮개가 `added` 에 새 행으로
       담는다. code 를 id 로 넣으면 없는 원본 행에 대한 수정으로 기록되어 사라진다 */
    onSave: values => upsert(values),
    /* `onRemove` 가 여기 있었다 (2026-08-26 삭제) — 정보 관리 다섯이 v1.15 에서 간
       길을 따라간다. 지우는 대신 [사용 여부]를 끈다 (머리말) */
    /* QR ID 는 **전역 유일**이다 — 겹치는 코드가 저장되면 시민이 그 코드를 찍었을 때
       어느 지점으로 갈지가 표의 차례로 정해진다.
       2026-08-26 부터 이것은 검사라기보다 **빗장**이다: 고르개에 이미 걸린 ID 를 고를 수
       있는 줄로 올리지 않으므로 여기까지 올 일이 없다. 그래도 남기는 이유는 걸렸을 때
       그것이 담당자의 실수가 아니라 **우리 쪽이 목록을 잘못 만들었다는 뜻**이기 때문이다 —
       조용히 저장되면 아무도 모른다. 자기 자신은 빼고 견준다 */
    extraValidate: v => {
      const code = String(v.code || "").trim();
      if (code && rows.some(p => p.code === code && p.id !== v.id)) {
        return { code: "이미 다른 지점에 매칭된 QR ID 입니다." };
      }
      return {};
    },
    onToast, label: "QR 지점",
  });

  /* 일괄 처리 — 다른 목록 화면과 같은 규칙이되 **켜고 끄는 것이 「사용 여부」다**
     (2026-08-24 추가, 사용자 요청). 이 화면에는 「노출 여부」가 없다. 실제로 쓰이는
     자리는 「한 상점가의 안내판을 한꺼번에 여는」 일이다. */
  const bulkActive = on => {
    patchMany(list0.selected.map(id => [id, { active: on }]), `QR 지점 ${on ? "사용" : "미사용"}`);
    onToast(`${list0.selected.length}건을 ${on ? "사용" : "미사용"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  const filtered = rows.filter(p => {
    if (gu && guOf(p.addr || p.dong) !== gu) return false;
    if (active === "y" && !p.active) return false;
    if (active === "n" && p.active) return false;
    if (!list0.term) return true;
    /* **QR ID 와 지점명 둘만 본다** (2026-08-26, 사용자 요청). 넷을 이어 담고 있었는데
       뒤의 둘(행정동 · 도로명주소)은 이제 왼쪽 구 고르개가 그 일의 실질을 하고, 남겨
       두면 「포곡」을 친 담당자가 구 고르개를 쓴 것과 비슷하되 미묘하게 다른 목록을
       받는다. 여기서 찾는 것은 **안내판 하나**이고, 담당자가 손에 들고 있는 것은
       인쇄물의 코드이거나 「어디에 붙은 것」이라는 이름 둘 중 하나다. */
    return `${p.code} ${p.name}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  /* 폼 **위**에 서는 상자 셋 — 여기서 한 번에 판단한다. 자리가 위인 이유는 아래
     `before` 주석 참조.

       ID 바닥남     **등록할 때만.** 사전 생성된 50개가 다 걸려 고를 것이 없는 상태다
       준비 중 경고    설치완료인데 꺼져 있을 때. 등록 기본값(설치예정)에서는 걸리지 않는다
       소속 없음      **고칠 때만.** 등록 창에서는 아직 아무것도 고르지 않은 것이 당연하고,
                     비웠을 때 무슨 일이 생기는지는 그 칸 아래 한 줄이 이미 적는다

     등록 창에만 서던 안내 상자가 여기 셋째로 있었다 (2026-08-25 삭제, 사용자 요청) */
  const dv = ed.draft ? ed.draft.values : {};
  const isNew = !!(ed.draft && ed.draft.isNew);
  const warnPending = dv.installStatus === "설치완료" && !dv.active;
  const warnNoDistrict = !isNew && !dv.districtId;

  /* ── 고를 수 있는 QR ID (2026-08-26. 머리말) ────────────────────────────────
     사전 생성된 50개를 두 무리로 가른다 — 아직 아무 지점에도 걸리지 않은 것과 이미 걸린 것.
     **고를 수 있는 것을 앞에 세운다**: 목록은 열 줄만 보이는데(OptionPicker) 그대로 두면
     열 곳이 다 찬 뒤부터 고를 수 있는 ID 가 잘려 안 보인다. 걸린 줄도 목록에는 남는다 —
     그 ID 가 인쇄된 안내판을 손에 든 담당자에게 「없다」와 「이미 쓴다」는 할 일이 다르다.

     **지금 고쳐 보고 있는 지점의 ID 는 걸린 것이 아니다.** 자기 값이 목록에 없으면 칸에
     아무것도 안 고른 것처럼 비어 보인다.

     지점이 늘어도 50줄짜리라 렌더마다 다시 만들어도 값이 나가지 않는다 (상점가 고르개와
     같은 판단). */
  const takenBy = new Map();
  rows.forEach(p => { if (p.code) takenBy.set(p.code, p.name); });
  const mine = String(dv.code || "");
  const freeCodes = [], usedCodes = [];
  QR_CODE_POOL.forEach(c => {
    const owner = takenBy.get(c);
    if (!owner || c === mine) freeCodes.push({ value: c, label: c });
    else usedCodes.push({ value: c, label: c, disabled: true, note: `${owner}에 매칭됨` });
  });
  const codeOptions = freeCodes.concat(usedCodes);
  /* 바닥났을 때만 적는다 (등록 창에서만 — 고칠 때는 자기 ID 가 늘 하나 남아 있다).
     평소에 「47개 남았습니다」를 적지 않는 것은 그것을 읽고 지금 할 일이 없어서다.
     0 이 되면 할 일이 생기고, 그 일은 이 화면에서 할 수 없는 일이라 어디로 가야 하는지를
     함께 적는다 */
  const poolEmpty = isNew && !freeCodes.length;

  return (
    <>
      {/* ── 제목 아래 설명을 없앴다 (2026-08-24, 사용자 요청) ────────────────────
          다섯 문장이었다: 무엇을 하는 화면인지 · 지점을 만들거나 지우지 않는다는 것 ·
          상점가를 지우면 함께 사라진다는 것 · 그것을 피하는 방법 · 되돌리는 자리.
          앞의 둘은 **화면이 이미 보여준다** — 할 수 있는 일은 단추와 열이 말한다
          (지금 여기 있는 것은 [등록]과 [사용 여부] 토글이고, [삭제]는 2026-08-26 에
          없어졌다 — 머리말).

          뒤의 셋은 **여기서 읽어도 지금 할 일이 아니었다.** 상점가를 지우면 걸린 QR
          지점이 함께 사라지던 시절의 이야기이고, 그 연쇄 삭제 자체가 v1.15 에서
          없어졌다. 날마다 여는 화면 맨 위에서 매번 읽는 문장으로 둘 것이 아니다.
          명세서 10장의 「QR 지점 관리 화면의 안내 줄」 조항도 그렇게 고쳤다. */}
      <PageHeader title="QR 지점 관리" count={`${filtered.length}곳`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>QR 지점 등록</Button>} />

      <Toolbar actions={list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkActive(true)}>사용</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkActive(false)}>미사용</Button>
        </>
      ) : null}>
        <Select value={gu} options={GU_OPTIONS} onChange={e => setGu(e.target.value)} />
        <Select value={active} options={ACTIVE_OPTIONS} onChange={e => setActive(e.target.value)} />
        <ListSearch state={list0} placeholder="QR ID, 지점명 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 QR 설치 지점 목록"
        rows={paged.rows} rowKey="id" onRowClick={ed.openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        empty={{ title: "조건에 맞는 지점이 없습니다." }}
        /* 설치는 끝났는데 아직 안 켠 지점 — 안내판은 붙어 있고 찍으면 준비 중 안내가
           뜬다 (S11-A). 남은 일 중 가장 급한 것이라 줄째로 세운다 */
        rowTone={p => (p.installStatus === "설치완료" && !p.active ? "warning"
          : p.installStatus === "훼손" ? "danger" : null)}
        columns={[
          { key: "code", label: "QR ID", width: 160, sortable: true },
          { key: "name", label: "지점명", sortable: true },
          { key: "addr", label: "도로명주소", render: p => p.addr || p.dong || EMPTY_MARK },
          { key: "districtId", label: "소속 골목형 상점가", width: 190,
            render: p => (p.districtId
              ? DISTRICT_NAME[p.districtId]
              : <span style={{ color: "var(--text-muted)" }}>지정 안 함</span>) },
          { key: "installStatus", label: "설치 상태", width: 110, align: "center", sortable: true,
            render: p => (
              <Badge tone={STATUS_TONE[p.installStatus] || "neutral"} size="sm">
                {p.installStatus || "설치예정"}
              </Badge>
            ) },
          { key: "installedAt", label: "설치일자", width: 110, render: p => p.installedAt || EMPTY_MARK },
          /* ── 배지에서 **토글**로 (2026-08-26, 사용자 요청) ────────────────────
             「활성/비활성」 배지가 서 있었다. 배지는 **읽는 값**의 모양인데 이 칸은
             담당자가 켜고 끄는 값이라, 바꾸려면 줄을 열어 폼까지 들어가야 했다 —
             정보 관리 다섯의 [노출 여부]는 진작부터 표에서 바로 눌렀다.
             같은 일(한 줄을 내렸다 올리는 일)이 화면마다 다른 모양이면 담당자가
             화면을 옮길 때마다 어디를 눌러야 하는지 다시 찾는다.
             설치 상태는 그대로 배지다 — 그쪽은 실제로 **현장의 사실**이라 읽는 값이다 */
          { key: "active", label: "사용 여부", width: 104, align: "center", sortable: true,
            render: p => (
              <Switch checked={!!p.active} aria-label={`${p.name} 사용 여부`}
                onChange={() => patch(p.id, { active: !p.active }, p.name)} />
            ),
            sortValue: p => (p.active ? 0 : 1) },
          /* 「관리」 열이 여기 있었다 (2026-08-24 신설 → 2026-08-26 삭제, 사용자 요청) —
             안에 [삭제] 하나뿐이었다. 정보 관리 다섯이 v1.15 에서 같은 자리를 같은 이유로
             비웠다 (Facilities.jsx 의 그 자리 주석) */
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "QR 지점 등록" : "QR 지점 수정"}
        /* 등록 창에는 부제를 두지 않는다 — 지점명이 아직 빈 칸이라 적을 것이 없다 */
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            /* 주소 검색이 좌표를 함께 돌려준다 (V-02 · 입력 원칙 3번). 점포·공공시설과 같은
               한 줄이다 — 이 화면에서는 그 좌표가 **시민이 보는 모든 거리의 기준점**이라
               더 중요하다 (머리말) */
            onAddress={(key, picked) => ed.setMany({ [key]: picked.addr, lat: picked.lat, lng: picked.lng })}
            slots={{
              /* QR ID — 항목표가 `type: "picker"` 로 표시해 둔 칸이다. 이름표·필수·안내
                 줄·오류는 RecordForm 이 항목표에서 얹으므로 여기서는 **고를 것만** 넘긴다 */
              code: (
                <FormField key="code">
                  <OptionPicker options={codeOptions} value={dv.code || ""}
                    onChange={v => ed.set("code", v)} ariaLabel="QR ID"
                    placeholder="QR ID 를 입력해 찾습니다"
                    emptyText="그런 QR ID 가 없습니다."
                    moreHint="QR ID 를 더 적어 보세요." />
                </FormField>
              ),
              coord: (
                <CoordField key="coord" lat={ed.draft.values.lat} lng={ed.draft.values.lng}
                  name={ed.draft.values.name} appKey={KAKAO_APP_KEY}
                  onChange={c => ed.setMany({ lat: fixCoord(c.lat), lng: fixCoord(c.lng) })} />
              ),
            }}
            before={
              /* 읽기 전용 요약(`InfoList`)이 여기 있었다 (2026-08-24 삭제) — QR ID ·
                 지점명 · 도로명주소 · 좌표 넷을 글자로 적던 자리다. 그 넷이 폼으로
                 내려가면서 같은 값을 한 창에 두 번 적는 자리가 됐다 (머리말).
                 남는 것은 **상자 셋**이고(위 dv 주석), 자리는 그대로 폼 **위**다
                 (2026-08-20) — 폼이 「관리 메모」로 끝나야 하고(마지막 칸이 마지막에
                 보인다), 무엇보다 경고는 값을 고치기 **전에** 읽어야 한다. */
              poolEmpty || warnPending || warnNoDistrict ? (
                /* 둘 다 안 걸리면 자리째 비운다 — 빈 상자가 여백만 만들면 폼 첫 칸이
                   까닭 없이 내려앉는다 */
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column",
                  gap: "var(--space-3)", paddingBottom: "var(--space-4)" }}>
                  {poolEmpty ? (
                    <Notice tone="danger" size="sm">
                      사전 생성된 QR ID {QR_CODE_TOTAL}개가 모두 지점에 매칭되어 고를 수 있는 ID 가 없습니다.
                      새 QR ID 와 QR 이미지 생성은 개발 담당자에게 요청해 주세요.
                    </Notice>
                  ) : null}

                  {warnPending ? (
                    /* ── 두 문장으로 줄였다 (2026-08-25, 사용자 요청) ──────────────────
                       종전에는 가운데에 시민 화면 문구를 그대로 인용했다 (「지금 이 안내판을
                       찍으면 사용자에게 "아직 준비 중인 QR 코드입니다" 안내가 뜹니다」).
                       시민 쪽 문구가 바뀌면 여기도 함께 고쳐야 하는 줄이었고 — S11-A 가
                       생기면서 실제로 한 번 고쳤다 — 담당자가 **지금 할 일**과는 상관이
                       없었다. 켜면 그 안내는 사라지고, 켜지 않을 이유가 그 문구에 있지도 않다.

                       남긴 둘은 상태와 할 일이다 — 지금 무엇이고, 무엇을 하면 되는가.
                       각괄호는 이 화면이 켜고 끄는 것을 가리킬 때 쓰는 표시이고, 그
                       스위치는 폼 아래쪽 「사용 여부」 칸이다 (2026-08-26 에 「활성
                       여부」에서 이름이 바뀌었다 — 머리말) */
                    <Notice tone="warning" size="sm">
                      설치는 완료되었으나 지금은 쓰지 않는 상태입니다. 운영을 시작하려면 [사용 여부]를 켜 주세요.
                    </Notice>
                  ) : null}

                  {warnNoDistrict ? (
                    <Notice tone="neutral" size="sm">
                      소속을 비워 두면 이 지점으로 들어온 사용자에게 가까운 골목형 상점가 3곳을 대신 안내합니다.
                      근처에 골목형 상점가가 없는 자리(공원 · 관공서 앞)에서는 그것이 맞는 화면입니다.
                    </Notice>
                  ) : null}
                </div>
              ) : null
            } />
        ) : null}
      </EditorModal>

      {/* 삭제 확인 창이 여기 있었다 (2026-08-24 신설 → 2026-08-26 삭제, 사용자 요청).
          각주가 「QR 코드를 교체했다면 삭제 대신 [철거] + 비활성」을 적던 자리다 —
          이제 삭제하는 길이 없어져 그 권고를 할 자리도, 할 이유도 없다 (머리말) */}
    </>
  );
}

export default QrPoints;
