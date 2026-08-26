import React from "react";
import { Input } from "../core/Input.jsx";
import { Select } from "../core/Select.jsx";
import { Switch } from "../core/Switch.jsx";
import { Button } from "../core/Button.jsx";
import { Icon } from "../core/Icon.jsx";
import { IconButton } from "../core/IconButton.jsx";
import { TextButton } from "../core/TextButton.jsx";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";
import { OptionPicker } from "./OptionPicker.jsx";

/* 1:N 항목 편집기 — 한 레코드에 딸린 여러 줄을 그 자리에서 넣고 뺀다.
 *
 * 명세서에 1:N 이 셋 있다:
 *   2-2 구역 주소 목록   상점가당 최소 1건 (개발 쪽으로 감)
 *   2-4 프로그램 일정    축제당 0~n 건    (M08)
 *   2-5 부스 위치        축제당 0~n 건    (M08)
 *
 * ── 왜 텍스트 상자에 줄바꿈으로 받지 않는가 ─────────────────────────────────
 * 처음에는 구역 주소를 여러 줄 textarea 로 받았다. 항목이 주소 하나뿐일 때는 그것으로
 * 충분했는데, 명세서 2-2 가 한 줄에 **네 개**를 요구한다 — 도로명주소 · 시작번호 ·
 * 끝번호 · 제외 구간 여부. 이것을 한 줄 문자열로 받으면 구분자를 정해야 하고
 * ("둔전로 42-88 제외"?), 담당자가 그 문법을 틀리는 순간 조용히 다른 뜻이 된다.
 *
 * 칸을 나눠 두면 문법이 없다. 빈 칸은 빈 칸이고, 토글은 켜졌거나 꺼졌다.
 *
 * ── 표처럼 보이지만 DataTable 이 아니다 ─────────────────────────────────────
 * DataTable 은 **읽는** 표다 (정렬·빈 상태·행 클릭). 여기는 전부 입력칸이라 정렬할
 * 것도 없고, 행을 눌러 열 상세도 없다. 둘을 한 컴포넌트로 묶으면 쓰지 않는 갈래가
 * 절반이 되고, 그 절반은 아무도 눌러보지 않은 채 남는다.
 */

/* ── 한 줄이 두 줄이 될 수 있다 (2026-08-24) ──────────────────────────────────
 * 축제 프로그램이 다섯 칸이 되면서(시작 일시 · 종료 일시 · 프로그램명 · 위치 · 설명)
 * 한 줄에 다 세우면 각 칸이 120px 로 쪼그라들었다 — 일시 고르개 둘이 그 줄에서 420px 을
 * 먼저 가져간다. 짧은 값(일시 · 이름 · 위치)은 나란히 훑는 것이 맞고, 문장 하나(설명)는
 * 그럴 이유가 없다.
 *
 * 그래서 칼럼에 `row2: true` 를 달면 **그 항목만 아랫줄로 내려간다.** 아랫줄은 열 이름
 * 줄이 가리키지 못하므로(윗줄 칸과 폭이 다르다) 이름표를 직접 붙인다.
 * 한 항목이 두 줄이 되면 어디까지가 한 항목인지 흐려지므로 항목 사이에 가는 줄을 긋는다.
 *
 * ── 이름표는 칸 **위**에 붙인다 (2026-08-25, 사용자 요청) ────────────────────
 * 처음에는 칸 **앞**에 56px 짜리 이름표를 세웠다. 그러면 이 폼에서 이름과 칸의 관계가
 * 두 가지가 된다 — 윗줄과 폼의 나머지 칸은 이름이 위에 있고 여기만 왼쪽이다. 담당자는
 * 그 차이를 말로 설명하지 못하면서 「여기만 뭔가 다르다」고 느낀다 (EditorModal 머리말과
 * 같은 이야기다). 게다가 이름표가 56px 을 먼저 가져가 **칸의 오른쪽 끝이 윗줄 칸과
 * 어긋났다** — 문장을 적는 칸이라 그 어긋남이 가장 넓은 자리에서 보인다.
 *
 * ── 아랫줄은 접어 두고, 줄은 카드로 묶는다 (2026-08-25, 사용자 요청) ─────────
 * 두 가지가 함께 지저분했다.
 *
 *   ① **설명 칸이 늘 펴져 있었다.** 프로그램 스무 줄이면 대개 비어 있는 문장 칸이
 *      스무 개 서고, 줄마다 높이가 두 배가 된다. 이 칸은 「이름 밖의 정보」라
 *      (BOOTH_COLUMNS 머리말) 있는 줄이 드물다 — 드문 것을 늘 펴 두면 흔한 것이 묻힌다.
 *      이제 **값이 있으면 펴고, 없으면 「설명 추가」 한 줄로 접어 둔다.**
 *      **값이 든 칸은 접지 않는다** — 접는 단추 자체를 내주지 않는다. 화면에 없는 값이
 *      저장되어 있는 상태를 만들지 않는 것이 이 프로젝트가 오래 지켜온 규칙이다.
 *
 *   ② **줄을 가는 선으로 갈랐다.** 선 하나로 가르면 어디까지가 한 줄인지 눈으로
 *      좇아야 한다 — 특히 아랫줄이 있는 줄과 없는 줄이 섞이면 선의 간격이 들쭉날쭉하다.
 *      이제 줄 하나가 **카드**다. 카드가 닫힌 도형이라 어디까지가 한 줄인지 눈으로
 *      좇을 것이 없다.
 */

/* 오른쪽에 비워 두는 폭 — 단추 하나(36) + 그 앞의 gap. 열 이름 줄 · 아랫줄 · 예시 줄이
   **같은 값을 써야** 세 줄의 칸 끝이 한 자리에서 만난다. 전에는 40 이라고 적혀 있어
   4px 씩 어긋나 있었다 (2026-08-25). 오른쪽 끝에 서는 단추가 목록마다 다르므로
   (삭제 · 손잡이 · 둘 다 · 아무것도 없음) 아래 `tail` 이 이 값을 몇 벌 쓸지 정한다. */
const RESERVE = "calc(36px + var(--space-2))";

/* ── 차례가 뜻을 갖는 목록 (`ordered`, 2026-08-25) ────────────────────────────
   골목 한바퀴 코스가 그렇다. 프로그램·부스는 **시각이 차례를 정하므로** 줄이 어느 자리에
   있든 시민 화면에서 같은 곳에 서지만, 코스는 목록의 차례가 곧 ①②③ 이고 걷는 길이다.
   그런 목록에는 두 가지가 더 필요하다.

     순번   지금 몇 번째인지. 없으면 담당자가 손가락으로 세어 가며 옮긴다
     손잡이 끌어서 옮긴다. 없으면 차례를 고치는 유일한 방법이 지우고 다시 넣는 것이 된다

   ── 끌어서 옮긴다 (2026-08-25 오후, 사용자 요청) ─────────────────────────────
   처음에는 ↑ ↓ 단추 둘이었다. 「다이얼로그 안이라 끌다가 폼 밖으로 나가면 규칙이 하나
   더 생긴다」가 근거였는데, 그 걱정은 **포인터를 손잡이에 가두면**(setPointerCapture)
   생기지 않는다 — 손가락이 어디로 가든 이 손잡이의 이벤트로 계속 들어온다.
   그리고 단추 둘로 넷째를 첫째로 보내려면 세 번을 눌러야 하는데, 그동안 목록이 세 번
   다시 그려져 무엇이 어디로 갔는지 눈으로 좇을 수 없다.

   **시민 화면 S08 과 같은 방식이다** (`screens/detail/CourseDetail.jsx` 의 startDrag).
   같은 일(코스 순서 바꾸기)을 두 화면이 다른 손짓으로 하면, 담당자가 자기가 만든 화면을
   쓸 때 한 번 더 배워야 한다. 끄는 동안 배열은 건드리지 않고 **손을 뗄 때 한 번만** 바꾼다.

   **↑ ↓ 키는 그대로 있다.** 손잡이가 단추라 초점을 받고, 화살표 키로 한 칸씩 옮긴다 —
   끌기가 마우스와 손가락에만 주는 것을 같은 자리에서 키보드에도 준다. 옮긴 결과는
   화면을 봐야만 알 수 있으므로 읽어주는 도구에는 한 줄로 말한다.

   ── 손잡이는 칸 **오른쪽**에 선다 (2026-08-25 오후, 사용자 요청) ────────────────
   처음에는 줄 맨 앞이 손잡이였고 그 뒤가 순번이었다. 그러면 **줄 맨 앞에 오는 것이
   누르는 것**이라, 차례를 읽으려는 눈이 손잡이를 한 번 넘어가야 ①②③ 에 닿는다.
   순번이 맨 앞으로 오면 그 숫자들이 한 세로선에 서서 목록이 곧 차례로 읽히고,
   **누르는 것 둘(손잡이 · 휴지통)은 오른쪽 끝에 모인다** — 읽는 값과 누르는 자리가
   좌우로 갈린다. 칸의 왼쪽 끝도 24px 만 들여져 폼의 다른 칸과 더 가까워진다. */
const LEAD = "calc(24px + var(--space-2))";                        /* 순번 + gap */
const TAIL_ORDERED = `calc(36px + var(--space-2) + ${RESERVE})`;   /* 손잡이 + gap + 삭제 */

/* 카드 안쪽 여백. **열 이름 줄이 이 값만큼 함께 들여져야** 머리글과 칸이 한 세로선에
   선다 — 카드는 안쪽으로 밀려 있고 열 이름 줄은 카드 밖이다 (아래 head).
   테두리를 두르면서 그 한 줄(1px)도 함께 밀어내므로 `CARD_INSET` 이 둘을 더한 값이다 —
   RESERVE 가 4px 어긋나 있던 것과 같은 성격의 어긋남을 미리 막는다. */
const CARD_PAD = "var(--space-3)";
const CARD_INSET = `calc(${CARD_PAD} + var(--stroke-hairline))`;

/* 줄 하나를 감싸는 카드.
   ── 바탕을 깔지 않고 테두리로 두른다 (2026-08-25 오후, 사용자 요청) ──────────────
   하루 전에는 중립 회색(`--surface-row` #f1f3f5)을 깔았다. 「어디까지가 한 줄인가」는
   그것으로 끝났는데 **회색이 배경으로 읽히지 않았다** — 흰 입력칸을 넷씩 얹으니 그 밑의
   회색이 바탕이 아니라 덩어리 하나로 보이고, 흰 폼 한가운데 회색 블록이 줄 수만큼 쌓였다.

   테두리는 그 부피 없이 같은 일을 한다. 안쪽 입력칸의 테두리(`--border-strong` #c3cec8)보다
   **옅은 단**(`--border-default` #dce4df)을 쓰는 것이 요점이다 — 진하면 상자 안의 상자가
   되어 어느 쪽이 누를 자리인지 흐려진다. 옅으면 바깥은 틀, 안은 칸으로 갈린다.
   토큰 하나가 이 자리에만 있던 `--surface-row` 는 쓰는 데가 없어져 함께 지웠다. */
const CARD = {
  display: "flex", flexDirection: "column", gap: "var(--space-2)",
  padding: CARD_PAD, background: "var(--surface-card)",
  border: "var(--stroke-hairline) solid var(--border-default)",
  borderRadius: "var(--radius-md)",
};

/* ── 카드는 **아랫줄이 있는 목록에만** 두른다 (2026-08-25, 사용자 요청) ──────────
   카드가 푸는 문제는 「한 줄이 어디서 끝나는가」이고, 그 물음은 아랫줄(`row2`)이 있을
   때만 생긴다 — 펴진 줄과 접힌 줄이 섞여 높이가 들쭉날쭉하기 때문이다. 부스 위치처럼
   한 줄이 늘 한 줄인 목록에서는 입력칸 한 줄이 그대로 한 항목이라, 바탕을 깔면 묶어야
   할 것이 없는데 색만 하나 더 생긴다. 종전에 가는 선을 그리던 조건과 같은 조건이다. */
const PLAIN = { display: "flex", flexDirection: "column", gap: "var(--space-2)" };

/* 칸 안 예시에는 「예)」를 붙인다 — 흐린 글씨는 이미 값이 들어 있는 것처럼 보인다
   (FormField 와 같은 규칙) */
const phOf = c => (c.placeholder ? `예) ${c.placeholder}` : undefined);

export function Repeater({
  title, note, badge, columns = [], rows = [], onChange,
  newRow = () => ({}), addLabel = "행 추가",
  /* [추가]를 눌렀을 때 줄을 만드는 대신 적을 말. 비어 있으면 평소대로 줄이 생긴다
     (아래 `add` 머리말) */
  addBlocked,
  /* 지울 때 무엇을 지우는지 이름으로 적기 위한 열쇠 (아래 `pending`). 목록마다 이름 칸이
     다르다 — 프로그램은 `title`, 부스는 `name`. 없으면 「n번째 줄」로 부른다 */
  nameKey = "name",
  /* 차례가 뜻을 갖는 목록이면 켠다 — 순번 배지와 ↑ ↓ 가 붙는다 (위 LEAD 머리말) */
  ordered = false,
  /* ── 줄 수가 정해진 목록 (`fixedRows`, 2026-08-25 오후, 사용자 요청) ────────────
     골목 한바퀴 코스가 넷으로 고정이다. 넷이 **늘 서 있고 늘리거나 줄이지 않는다** —
     [추가]도 휴지통도 없다.

     한 판 앞에서는 [추가]를 눌러 넷을 채우게 하고 넷째부터 단추를 감췄는데, 그러면
     담당자가 **정해져 있는 수를 손으로 맞추는 일**을 한다 — 세 번 눌러 네 줄을 만들고,
     하나를 바꾸려면 지웠다가 다시 만든다. 줄 수가 값이 아니라 **틀**이면 틀은 처음부터
     서 있어야 한다. 빈 줄 넷이 곧 「여기 넷을 고르세요」라는 말이고, 고르는 칸이 그
     자리에 이미 있으므로 무엇을 해야 하는지 읽을 것도 없다.

     지우는 단추가 없어도 잃는 것이 없다 — 한 곳을 빼는 일은 **다른 곳으로 바꾸는
     일**이고, 그것은 그 줄에서 다시 고르면 된다. 비우고 싶으면 고르개를 비운다.
     넘겨받은 줄이 넷보다 적으면 화면에서 채워 그린다 (아래 `list`) — 첫 편집에서
     그 줄들이 그대로 저장된다. */
  fixedRows = 0,
  error, span = 2,
}) {
  const fixed = fixedRows > 0;
  const given = Array.isArray(rows) ? rows : [];
  /* 정해진 수만큼 채워서 그린다. **줄이 모자란 채로 열리는 일이 없어야** 담당자가
     [추가]를 찾지 않는다. 넘치는 줄은 자르지 않는다 — 저장된 값을 화면이 조용히
     버리지 않는다 (그 상태는 화면을 여는 쪽에서 맞춘다) */
  const list = fixed && given.length < fixedRows
    ? given.concat(Array.from({ length: fixedRows - given.length }, () => newRow()))
    : given;
  const top = columns.filter(c => !c.row2);
  const bottom = columns.filter(c => c.row2);
  /* 아랫줄이 있는 목록만 카드를 두른다 (위 PLAIN 머리말). 열 이름 줄의 들여쓰기도
     여기에 따라간다 — 카드가 없으면 들일 것이 없다 */
  const carded = bottom.length > 0;
  const inset = carded ? CARD_INSET : "0px";
  /* 열 이름 줄·아랫줄·예시 줄이 **한 값을 함께 본다** (RESERVE 머리말과 같은 이유).
     오른쪽 끝에 서는 단추가 몇이냐에 따라 비우는 폭이 갈린다 — 손잡이와 휴지통 둘,
     둘 중 하나, 또는 아무것도 없음(줄 수가 정해진 목록에는 휴지통이 없다) */
  const tail = ordered
    ? (fixed ? RESERVE : TAIL_ORDERED)
    : (fixed ? "0px" : RESERVE);
  const lead = ordered ? LEAD : "0px";

  /* ── 지우기 전에 한 번 묻는다 (2026-08-25, 사용자 요청) ──────────────────────
     휴지통이 칸 바로 옆에 있어 위치를 고치려다 누르기 쉽다. 다른 목록과 달리 이 줄은
     **되돌릴 자리도 없다** — 폼 안의 임시 값이라 [저장]하기 전에는 어디에도 없다.

     그런데 여기서 `ConfirmDialog` 를 띄울 수는 없다. 이 편집기는 이미 열려 있는
     다이얼로그 **안**이고, 상자를 겹치면 ESC 가 둘을 한꺼번에 닫는다 (두 리스너가 같은
     document 에 걸린다 — EditorModal 머리말이 같은 이유로 겹치기를 피했다). 겹쳐 띄운
     상자가 바깥 폼까지 닫아 버리면, 실수를 막으려고 만든 장치가 더 큰 것을 잃게 한다.

     그래서 **그 줄 아래에 확인 줄을 편다.** 지울 줄이 위에 그대로 보이는 채로 묻는 것이
     상자를 띄우는 것보다 오히려 정확하다 — 어느 줄인지 이름으로도 적고 눈으로도 보인다. */
  const [pending, setPending] = React.useState(null);
  /* 줄 수가 정해진 목록에는 지우는 길이 없으므로 물을 일도 없다 */
  const asking = !fixed && pending != null && pending < list.length ? pending : null;

  /* ── 아랫줄을 편 줄 (머리말 ①) ─────────────────────────────────────────────
     **값이 들어 있으면 목록에 없어도 펴진다** — `openLower` 는 「비어 있는데 펴 둔」
     줄만 기억한다. 그래서 담당자가 글을 적는 순간 그 줄은 목록과 상관없이 계속 펴져
     있고, 접는 단추도 사라진다 (값이 든 칸을 접을 길을 두지 않는다).

     줄 번호로 기억하는 것은 이 목록의 다른 자리와 같다 (`pending` · `key={i}`) —
     줄에 고유한 열쇠가 없다. 줄을 지우면 뒤 번호가 하나씩 당겨지므로 그때 비운다:
     비어 있는 칸이 접히는 것뿐이라 잃는 것이 없다. */
  const [openLower, setOpenLower] = React.useState([]);
  const filledLower = row => bottom.some(c => row && String(row[c.key] == null ? "" : row[c.key]).trim());
  const lowerOpen = (row, i) => filledLower(row) || openLower.includes(i);
  const toggleLower = i => setOpenLower(cur => (cur.includes(i) ? cur.filter(n => n !== i) : cur.concat(i)));

  /* 접는 단추의 글자는 **아랫줄 칸의 이름 그대로**다 — 지금은 「설명」 하나뿐이지만,
     칼럼표가 늘면 「설명 · 비고 추가」가 된다 (여기서 이름을 지어내지 않는다) */
  const lowerLabel = bottom.map(c => c.label).join(" · ");

  const set = (i, key, value) => {
    if (!onChange) return;
    onChange(list.map((r, n) => (n === i ? { ...r, [key]: value } : r)));
  };
  /* ── [추가]가 막히는 자리 (`addBlocked`, 2026-08-26, 사용자 요청) ─────────────────
     축제의 프로그램·부스가 첫 손님이다. 줄의 일시 칸이 **위 폼의 축제 기간에서 날 목록을
     받아** 서는데, 기간이 비어 있으면 고를 날이 없다.

     **단추를 흐리게 하지 않고 누르게 둔 뒤 이유를 적는다.** 흐린 단추는 못 누른다는 것만
     말하고 왜인지는 말하지 않아서, 담당자가 그 앞에서 할 일을 찾지 못한다. 눌러서 나오는
     한 줄은 **무엇을 먼저 하면 되는지**를 적는다 — 그 칸은 바로 위에 있다.

     막는 값이 없어지면(기간을 채우면) 그 말도 함께 사라진다. 눌렀다는 기억(`bumped`)만
     들고 있고 문장은 부르는 쪽이 그때그때 정하므로, 지나간 말이 남아 있을 수 없다. */
  const [bumped, setBumped] = React.useState(false);
  const blockedNow = bumped && !!addBlocked;
  const add = () => {
    setPending(null);
    if (addBlocked) { setBumped(true); return; }
    setBumped(false);
    if (onChange) onChange(list.concat(newRow()));
  };
  const drop = i => {
    setPending(null);
    setOpenLower([]);            /* 뒤 번호가 당겨진다 — 위 openLower 머리말 */
    if (onChange) onChange(list.filter((_, n) => n !== i));
  };
  const nameOf = (row, i) => {
    const v = row && row[nameKey];
    return v && String(v).trim() ? String(v).trim() : `${i + 1}번째 줄`;
  };

  /* 한 자리에서 다른 자리로 옮긴다. 목록 밖으로는 나가지 않는다 — 감싸 돌게 두면
     위로 옮기다가 맨 아래에 가 붙는다.
     지움 확인과 펴 둔 아랫줄을 함께 비우는 것은 삭제와 같은 이유다 — 둘 다 **줄 번호로**
     기억하는데 여기서 번호가 서로 바뀐다 (위 openLower 머리말). */
  const move = (i, to) => {
    if (!onChange || to < 0 || to >= list.length || i === to) return;
    setPending(null);
    setOpenLower([]);
    const out = list.slice();
    out.splice(to, 0, out.splice(i, 1)[0]);
    onChange(out);
  };

  /* ── 끌어서 옮기기 (위 LEAD 머리말) ─────────────────────────────────────────
     시민 화면 S08 과 같은 방식이다. 끄는 동안 화면이 하는 일은 셋이고 **배열은 손을 뗄 때
     한 번만** 바뀐다:

       잡은 줄     transform 으로 손가락을 1:1 로 따라간다. transition 을 걸지 않는다 —
                   한 프레임이라도 늦으면 손가락과 줄이 어긋나 끌리는 느낌이 사라진다
       나머지 줄   놓일 자리를 비우려고 잡은 줄의 높이만큼 밀린다. 이쪽에는 transition 을
                   건다 — **벌어지는 틈이 곧 「여기 들어갑니다」**라 그 과정이 보여야 한다
       순번        놓았을 때 붙을 번호로 미리 바뀐다. 틈은 자리를 그림으로, 번호는 같은
                   것을 숫자로 말한다

     자리는 잡는 순간 한 번 재둔 **다른 줄들의 중심선**으로 정한다. 손가락보다 위에 남은
     중심선의 수가 곧 끼워질 자리다. 끄는 동안 배열도 레이아웃도 그대로라 이 기준이
     발밑에서 움직이지 않는다 — px 차이로 칸수를 세면 줄 높이가 저마다 달라(아랫줄이 펴진
     줄이 있다) 어긋난다. 잡은 줄의 중심선은 셈에서 뺀다: 그 줄은 손가락을 따라다녀
     자기 상자 안에 손가락이 늘 들어 있으므로 넣어두면 언제나 제자리가 답으로 나온다. */
  const rowEls = React.useRef(new Map());
  const grabRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null);   /* { from, h, y, to } */
  /* 옮긴 결과를 소리로 알린다. 끌기는 화면을 봐야 아는 동작이라, 키보드로 옮긴 사람에게는
     이 한 줄이 유일한 응답이다 */
  const [say, setSay] = React.useState("");

  const startDrag = (i, e) => {
    const el = rowEls.current.get(i);
    if (!el) return;
    grabRef.current = {
      y0: e.clientY,
      mids: list.map((_, n) => {
        if (n === i) return null;
        const el2 = rowEls.current.get(n);
        if (!el2) return null;
        const r2 = el2.getBoundingClientRect();
        return (r2.top + r2.bottom) / 2;
      }).filter(m => m != null),
    };
    setPending(null);
    setDrag({ from: i, h: el.getBoundingClientRect().height, y: 0, to: i });
  };

  const moveDrag = e => {
    const g = grabRef.current;
    if (!g) return;
    const y = e.clientY - g.y0;
    let to = 0;
    g.mids.forEach(mid => { if (e.clientY > mid) to += 1; });
    /* 값이 그대로면 새 객체를 만들지 않는다 — 끌기는 초당 수십 번 들어온다 */
    setDrag(d => (d && (d.y !== y || d.to !== to) ? { ...d, y, to } : d));
  };

  const endDrag = () => {
    const d = drag;
    grabRef.current = null;
    setDrag(null);
    if (!d || d.to === d.from) return;
    move(d.from, d.to);
    setSay(`${list.length}개 중 ${d.to + 1}번으로 옮겼습니다.`);
  };

  const onHandleKey = (i, e) => {
    const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation();
    const to = i + delta;
    if (to < 0 || to >= list.length) return;
    move(i, to);
    setSay(`${list.length}개 중 ${to + 1}번으로 옮겼습니다.`);
  };

  /* 열 이름 줄. 비었을 때도 그린다 — 아래 예시 줄이 어느 칸에 무엇을 넣는 자리인지
     말해 주는 것이 이 줄이다. 오른쪽은 삭제 버튼 자리(RESERVE)를, 양쪽은 카드 안쪽
     여백(CARD_PAD)을 함께 비워 둔다 — 그래야 머리글과 카드 안의 칸이 한 세로선에 선다.
     **윗줄 칸만 가리킨다** — 아랫줄 칸은 자기 이름표를 위에 달고 있다. */
  const head = (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
      padding: `0 calc(${tail} + ${inset}) 0 calc(${inset} + ${lead})`,
      fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
      {top.map(c => (
        <span key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
          {c.label}{c.required ? <b style={{ color: "var(--state-danger)" }}> *</b> : null}
        </span>
      ))}
    </div>
  );

  /* 칸 하나. `disabled` 면 예시 줄용이다 (값 없이 모양만 보여준다) */
  const cell = (c, row, i, off) => {
    /* 선택지가 많은 칸 — 고르개 대신 **검색해서 고른다** (2026-08-25, 사용자 요청).
       한 상점가의 점포가 335곳이라 `<select>` 로는 손가락으로 훑게 된다 (OptionPicker 머리말).
       예시 줄에서는 값도 목록도 없는 채로 모양만 보여준다 */
    if (c.type === "picker") {
      return (
        <OptionPicker options={off ? [] : c.options} value={off ? "" : row[c.key]}
          disabled={off} ariaLabel={off ? undefined : c.label}
          placeholder={c.placeholder || "이름을 입력해 찾습니다"}
          onChange={off ? undefined : v => set(i, c.key, v)} />
      );
    }
    if (c.type === "select") {
      return (
        <Select options={c.options} disabled={off} tabIndex={off ? -1 : undefined}
          aria-hidden={off ? "true" : undefined} aria-label={off ? undefined : c.label}
          value={off
            ? (c.options && c.options[0] ? (c.options[0].value ?? c.options[0]) : "")
            : (row[c.key] == null ? "" : row[c.key])}
          onChange={off ? () => {} : e => set(i, c.key, e.target.value)} />
      );
    }
    /* ── `daytime` — **연도를 묻지 않는 일시 칸** (2026-08-26, 사용자 요청) ─────────
       축제의 프로그램·부스가 쓴다. `datetime-local` 한 칸이었는데, 그 칸은 연·월·일을
       모두 물어 놓고 **연도는 언제나 위 폼의 시작일과 같은 해**였다 — 답이 정해진 것을
       묻는 칸이다.

       나누면 물음이 둘로 준다: **축제 기간 중 어느 날**(`c.days` 가 그 목록이다)과
       **몇 시**. 여러 날짜에 걸치는 축제도 사흘이 고작이라 고르개에 서는 것이 두셋이고,
       하루짜리 축제면 **칸 하나에 답이 하나**라 사실상 시각만 넣게 된다.

       고르개가 기간을 넘어가지 못하는 것은 종전 `min`/`max` 보다 강하다 — 달력은 밖의
       날을 흐리게 보여줄 뿐이지만 여기에는 **그 날이 목록에 없다.**

       저장되는 값은 그대로 `2026-10-17T15:00` 이다. 두 조각을 그때그때 잇는 것이지
       값의 모양을 바꾸는 것이 아니다 — 시민 화면과 서버 응답이 보는 것이 이 문자열이다.
       한쪽만 든 값(`2026-10-18T`)이 잠깐 생기는데, 고른 날을 시각 없이도 붙들고 있어야
       하기 때문이다. **그 반쪽은 저장으로 나가지 못한다** — `missingInRows` 가 「비어
       있는가」가 아니라 「다 찼는가」로 본다 (data/fields.js 의 `filled`).

       ── `c.days` 가 비어도 **모양은 같다** (2026-08-26 저녁, 사용자 요청) ─────────
       위 폼의 기간이 아직 비었을 때 종전 `datetime-local` 로 떨어지게 두었었다. 「고를
       날이 하나도 없는 고르개보다는 낫다」가 근거였는데, **[등록]을 눌러 연 창이 정확히
       그 상태다** — 기간을 아직 안 넣었으니 예시 줄이 회색 「연-월-일」로 서고, 담당자가
       처음 보는 화면에서 **이 칸이 연도를 받는 칸으로 보인다.** 기간을 넣는 순간 모양이
       통째로 바뀌는 것도 같은 값을 두 가지로 배우게 하는 일이다.

       예시 줄의 규칙이 이미 답을 적어 두고 있었다 — **「[추가]를 눌렀을 때 실제로 생기는
       모양 그대로여야 이 줄이 예시 노릇을 한다.」** 그래서 폴백을 지웠다. 고를 날이
       없으면 고르개는 그대로 서되 **칸 이름(「일자」)만 달고 잠긴다.** 무엇을 먼저 해야
       하는지는 **[추가]를 누른 순간** 한 줄로 나온다 (위 `addBlocked`) — 잠긴 고르개가
       늘 이고 있을 말이 아니다.

       값이 이미 든 줄은 잠겨도 **그 날짜를 그대로 보여준다** — 기간을 나중에 지웠다고
       해서 이미 들어간 값을 화면에서 감추면 담당자가 그것을 모른 채 저장한다. */
    if (c.type === "daytime") {
      const days = c.days || [];
      {
        const raw = off ? "" : String(row[c.key] || "");
        const cut = raw.indexOf("T");
        const day = cut < 0 ? raw : raw.slice(0, cut);
        const time = cut < 0 ? "" : raw.slice(cut + 1);
        const outside = day && !days.some(d => d.value === day);
        /* 앞자리 0 을 떼는 것은 목록 쪽(`daysBetween`)과 같아야 한다 — 한 고르개 안에서
           「9.1」과 「09.01」이 나란히 서면 다른 체계의 값으로 보인다 */
        const mark = d => `${+d.slice(5, 7)}.${+d.slice(8, 10)} (기간 밖)`;
        /* 고른 날이 목록에 없으면 그 값을 앞에 세운다 — 기간을 나중에 좁히면 이미
           들어간 줄이 그 밖에 남는데, 목록에서 빼 버리면 **담당자가 모르는 사이에
           다른 날로 바뀐다.** 보이게 두고 고치게 한다 */
        const opts = days.length
          ? (outside ? [{ value: day, label: mark(day) }].concat(days) : days)
          /* 고를 날이 없을 때 이 자리에 적는 것은 **칸 이름**이다 — 「일자」. 한때
             「기간 먼저」라고 시켰는데(2026-08-26, 같은 날 바뀜), **무엇을 먼저 하라는
             말은 [추가]를 누른 순간에 나오는 것**이지 잠긴 고르개가 늘 이고 있을 말이
             아니다 (위 `addBlocked`). 옆 칸들이 「예) 개막 풍물놀이」로 자리를 이름 짓는
             것과 같은 결이다 */
          : (day ? [{ value: day, label: mark(day) }] : [{ value: "", label: "일자" }]);
        /* 비어 있는 줄은 **첫날**을 보여준다. 값은 아직 쓰지 않는다 — 시각을 넣는
           순간 그 날과 이어진다. 하루짜리 축제에서는 이것이 곧 정답이다 */
        const shown = day || (days[0] ? days[0].value : "");
        const join = (d, t) => (t ? `${d}T${t}` : (d ? `${d}T` : ""));
        /* 고를 날이 없으면 시각도 잠근다 — 날 없는 시각은 저장으로 나가지 못하는 반쪽이라,
           받아 놓고 나중에 막는 것보다 처음부터 받지 않는 편이 정직하다 */
        const dead = off || !days.length;
        return (
          <div style={{ display: "flex", gap: 4, minWidth: 0 }}>
            <Select options={opts} disabled={dead} tabIndex={dead ? -1 : undefined}
              aria-hidden={off ? "true" : undefined}
              aria-label={off ? undefined : `${c.label} 날짜`}
              value={shown} style={{ flex: "1 1 0", minWidth: 0 }}
              onChange={dead ? () => {} : e => set(i, c.key, join(e.target.value, time))} />
            {/* ── 시각 칸이 **먼저 제 폭을 가져간다** (2026-08-26 저녁, 사용자 요청) ─────
                   104px 이었고 **글자가 잘렸다.** `type="time"` 이 무엇으로 보이는지는
                   페이지가 아니라 **브라우저·OS 로케일이 정한다** — 한국어에서는
                   「오후 03:00」이라 「18:00」보다 30px 남짓 넓다. HTML 에는 그것을 24시로
                   못박는 수단이 없다(`lang` 도 이 위젯에는 걸리지 않는다). 그래서 **좁은
                   쪽에 맞추고 기대하는 대신 넓은 쪽에 맞춘다** — 안 보이는 것보다 조금
                   넉넉한 편이 낫고, 24시로 뜨는 환경에서는 그 여유가 여백이 될 뿐이다.
                   `0 0` 으로 두는 것은 이 칸이 **줄어들면 곧바로 글자가 잘리는 칸**이기
                   때문이다. 남는 폭을 가져가는 쪽은 날짜 고르개다 (`1 1 0`) — 그쪽은
                   모자라면 말줄임으로 접힐 뿐 값을 못 읽게 되지 않는다 */}
            <Input type="time" value={time}
              readOnly={dead} disabled={dead} tabIndex={dead ? -1 : undefined}
              aria-hidden={off ? "true" : undefined}
              aria-label={off ? undefined : `${c.label} 시각`}
              style={{ flex: "0 0 148px", minWidth: 0 }}
              onChange={dead ? undefined : e => set(i, c.key, join(shown, e.target.value))} />
          </div>
        );
      }
    }
    if (c.type === "switch") {
      return (
        <div style={{ minHeight: "var(--tap-comfortable)", display: "flex", alignItems: "center" }}>
          <Switch checked={off ? false : !!row[c.key]} disabled={off}
            aria-hidden={off ? "true" : undefined} aria-label={off ? undefined : c.label}
            onChange={off ? undefined : () => set(i, c.key, !row[c.key])} />
        </div>
      );
    }
    return (
      <Input type={c.type === "number" ? "number" : c.type || "text"}
        value={off ? "" : (row[c.key] == null ? "" : row[c.key])}
        readOnly={off} disabled={off} tabIndex={off ? -1 : undefined}
        aria-hidden={off ? "true" : undefined} aria-label={off ? undefined : c.label}
        placeholder={phOf(c)} min={c.min} max={c.max} maxLength={c.maxLength}
        onChange={off ? undefined : e => set(i, c.key, e.target.value)} />
    );
  };

  /* 아랫줄 — 이름표가 **칸 위**에 선다 (2026-08-25. 머리말). 열 이름 줄이 가리키지 못하는
     자리라 이름을 직접 달되, 붙이는 자리는 윗줄·폼의 나머지 칸과 같다.
     오른쪽을 비워 두는 폭은 윗줄과 같은 RESERVE 다 — 그래야 칸 끝이 한 자리에서 만난다. */
  const lower = (row, i, off) => (bottom.length ? (
    <div style={{ display: "flex", gap: "var(--space-2)", paddingLeft: lead, paddingRight: tail }}>
      {bottom.map(c => (
        <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
          <div style={{ marginBottom: 4, fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
            {c.label}{c.required ? <b style={{ color: "var(--state-danger)" }}> *</b> : null}
          </div>
          {cell(c, row, i, off)}
        </div>
      ))}
    </div>
  ) : null);

  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 6 }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
          {title}
        </span>
        {badge}
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-caption)", color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums" }}>
          {list.length}건
        </span>
      </div>

      {list.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {/* 열 이름은 한 번만 적는다. 줄마다 label 을 붙이면 세 줄짜리 목록이
              화면 절반을 먹는다 */}
          {head}

          {/* 줄 하나가 카드 하나다 (머리말 ②) — 가는 선으로 가르지 않는다 */}
          {list.map((row, i) => {
            /* 끄는 동안의 이 줄 (위 startDrag 머리말)
                 dragging  잡힌 줄. 손가락을 따라간다
                 moved     비켜 주려고 위(-1)/아래(+1)로 한 칸 밀리는 줄
                 num       놓았을 때 붙을 번호 — 배열은 그대로이므로 화면용으로만 센다 */
            const dragging = !!drag && drag.from === i;
            const moved = !drag || dragging ? 0
              : (drag.to > drag.from && i > drag.from && i <= drag.to) ? -1
              : (drag.to < drag.from && i >= drag.to && i < drag.from) ? 1 : 0;
            const num = dragging ? drag.to + 1 : i + 1 + moved;
            const shiftY = dragging ? drag.y : moved * (drag ? drag.h : 0);

            return (
            <div key={i}
              ref={el => { if (el) rowEls.current.set(i, el); else rowEls.current.delete(i); }}
              style={{ ...(carded ? CARD : PLAIN),
                ...(ordered ? {
                  position: "relative",
                  /* 들어올린 것처럼 보여야 한다 — 아래 줄들과 층을 나눈다. 크기는 건드리지
                     않는다: 줄 높이가 변하면 잡을 때 재둔 h 와 어긋나 비워둔 틈이 실제
                     줄보다 크거나 작아진다 */
                  background: dragging ? "var(--surface-card)" : (carded ? CARD.background : undefined),
                  boxShadow: dragging ? "var(--shadow-raised)" : undefined,
                  borderColor: dragging ? "var(--border-strong)" : undefined,
                  zIndex: dragging ? 2 : undefined,
                  transform: shiftY ? `translateY(${shiftY}px)` : undefined,
                  transition: drag && !dragging
                    ? "transform var(--dur-fast) var(--ease-standard)" : "none",
                  willChange: drag ? "transform" : undefined,
                  /* 끄는 동안에는 글자가 잡히지 않는다 — 손잡이에서 시작한 끌기가 옆 칸의
                     글자를 파랗게 칠하며 지나가면 무엇을 하고 있는지 흐려진다 */
                  userSelect: drag ? "none" : undefined,
                } : null) }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {/* 순번 — 시민 화면의 ①②③ 과 같은 수다. 눌리지 않는 표시라 배지 모양이
                    아니라 숫자 하나로 둔다 (알약을 쓰면 필터 칩으로 읽힌다).
                    **줄 맨 앞이다** — 읽는 값이 먼저고 누르는 것은 오른쪽 끝이다 (LEAD 머리말) */}
                {ordered ? (
                  <span aria-hidden="true" style={{ flex: "0 0 24px", textAlign: "center",
                    fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)",
                    color: dragging ? "var(--brand-primary)" : "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums" }}>
                    {num}
                  </span>
                ) : null}
                {top.map(c => (
                  <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                    {cell(c, row, i, false)}
                  </div>
                ))}
                {/* ── 손잡이 — 칸 오른쪽, 휴지통 앞 (위 LEAD 머리말) ─────────────
                    `touch-action: none` 이 **여기에만** 걸린다 — 이 36px 안에서만 브라우저의
                    스크롤을 끄고, 손잡이 밖에서는 폼이 예전처럼 흐른다.
                    단추라 초점을 받고 ↑/↓ 키로도 옮긴다. 이름에 지금 자리를 적는다 —
                    소리로 훑으면 「순서 옮기기」가 줄줄이 지나갈 뿐이라, 무엇이 몇 번째인지가
                    이름 안에 있어야 한다. */}
                {ordered ? (
                  <button type="button"
                    aria-label={`${nameOf(row, i)} 순서 옮기기, ${list.length}개 중 ${num}번. 위아래 화살표 키로 옮깁니다`}
                    onKeyDown={e => onHandleKey(i, e)}
                    onPointerDown={e => {
                      /* 포인터를 이 단추에 가둔다 — 손가락이 폼 밖으로 나가도 아래
                         onPointerMove 로 계속 들어온다. `preventDefault` 는 하지 않는다:
                         그러면 단추가 초점을 받지 못해 놓자마자 ↑/↓ 키를 쓸 수 없다 */
                      e.currentTarget.setPointerCapture(e.pointerId);
                      startDrag(i, e);
                    }}
                    onPointerMove={e => { if (dragging) moveDrag(e); }}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    style={{ flex: "0 0 36px", height: 36, display: "inline-flex",
                      alignItems: "center", justifyContent: "center",
                      background: "none", border: "none", borderRadius: "var(--radius-sm)",
                      touchAction: "none", userSelect: "none",
                      cursor: dragging ? "grabbing" : "grab",
                      color: dragging ? "var(--text-heading)" : "var(--text-muted)" }}>
                    <Icon name="grip-vertical" size={18} />
                  </button>
                ) : null}
                {/* 줄 수가 정해진 목록에는 휴지통이 없다 (위 fixedRows 머리말).
                    묻고 있는 동안에는 자리째 비운다 — 같은 줄에 「지울까요?」와 다시 누를
                    수 있는 삭제 단추가 함께 서면 어느 쪽이 지금 할 일인지 흐려진다.
                    폭은 그대로 잡아 두어야 칸이 흔들리지 않는다 */}
                {fixed ? null : asking === i ? (
                  <span aria-hidden="true" style={{ flex: "0 0 36px" }} />
                ) : (
                  <IconButton name="trash-2" label={`${i + 1}번째 줄 삭제`} size={36}
                    onClick={() => setPending(i)} style={{ flex: "0 0 auto", color: "var(--state-danger)" }} />
                )}
              </div>
              {bottom.length && lowerOpen(row, i) ? lower(row, i, false) : null}
              {/* 접는 단추는 **비어 있을 때만** 선다 (머리말 ①). 글이 들어 있으면 칸이
                  그대로 서 있고 접을 길이 없다 — 화면에 없는 값이 저장되어 있는 상태를
                  만들지 않는다. 높이를 32 로 줄인 것은 여기가 데스크톱 화면이고, 이
                  단추가 카드 안에서 칸보다 커 보이면 안 되기 때문이다 */}
              {bottom.length && !filledLower(row) ? (
                <TextButton icon={openLower.includes(i) ? "chevron-up" : "plus"} tone="muted"
                  onClick={() => toggleLower(i)}
                  style={{ alignSelf: "flex-start", minHeight: 32, padding: "0 2px" }}>
                  {lowerLabel} {openLower.includes(i) ? "접기" : "추가"}
                </TextButton>
              ) : null}

              {asking === i ? (
                <div role="group" aria-label="삭제 확인"
                  style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)",
                    padding: "var(--space-2) var(--space-3)", background: "var(--state-danger-tint)",
                    border: "var(--stroke-hairline) solid var(--state-danger-soft)",
                    borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", lineHeight: 1.5 }}>
                    <b style={{ color: "var(--text-heading)" }}>{nameOf(row, i)}</b> 을(를) 지울까요?
                  </span>
                  <span style={{ marginLeft: "auto", display: "flex", gap: "var(--space-2)" }}>
                    <Button variant="ghost" size="sm" onClick={() => setPending(null)}>취소</Button>
                    <Button variant="danger" size="sm" onClick={() => drop(i)}>삭제</Button>
                  </span>
                </div>
              ) : null}
            </div>
            );
          })}
          {/* 옮긴 결과를 소리로 알린다 (위 startDrag 머리말) */}
          {ordered ? <VisuallyHidden role="status">{say}</VisuallyHidden> : null}
        </div>
      ) : (
        /* ── 비었을 때는 글로 설명하지 않고 **한 줄을 그려 보인다** (2026-08-20) ──
           전에는 회색 상자에 "프로그램 일정이 없으면 시민 화면에 그 구획이 그려지지
           않습니다" 같은 문장이 있었다. 그 문장은 [추가]를 눌렀을 때 **무엇이 생기는지**를
           말해 주지 않는다 — 담당자가 알고 싶은 것은 그것이다. 열 이름과 비활성 칸 한 줄을
           그려 두면 누르기 전에 이미 답이 나와 있다.

           칸은 disabled 이고 안의 글자가 「예)」로 시작한다 — 데이터가 아니라는 말을 그 두
           글자가 한다. 머리의 「0건」도 같은 말을 한다. */
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {head}
          {/* 예시도 **줄과 같은 모양으로** 그린다 — [추가]를 눌렀을 때 실제로 생기는
              모양 그대로여야 이 줄이 예시 노릇을 한다 */}
          <div style={carded ? CARD : PLAIN}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {/* 차례가 있는 목록이면 순번 자리도 그려 둔다 — 눌러서 생기는 줄이 그
                  모양이다. 첫 줄이므로 1 번이다 */}
              {ordered ? (
                <span aria-hidden="true" style={{ flex: "0 0 24px", textAlign: "center",
                  fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)",
                  color: "var(--text-disabled)", fontVariantNumeric: "tabular-nums" }}>1</span>
              ) : null}
              {/* 고르는 칸의 예시는 **첫 선택지**다. 빈 값으로 두면 예시 줄에서 그 칸만
                  비어 보여, 고르는 칸이라는 사실이 오히려 흐려진다 (cell 의 off 갈래) */}
              {top.map(c => (
                <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                  {cell(c, {}, -1, true)}
                </div>
              ))}
              {/* 손잡이도 칸 오른쪽에 그려 둔다 — 실제 줄과 같은 자리다 */}
              {ordered ? (
                <span aria-hidden="true" style={{ flex: "0 0 36px", height: 36,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-disabled)" }}>
                  <Icon name="grip-vertical" size={18} />
                </span>
              ) : null}
              {/* 삭제 단추 자리를 비워 둔다 — 열 이름 줄의 tail 과 맞춰야 칸이 어긋나지
                  않는다. 여기 「예시」라고 적었던 것을 뺐다 (2026-08-20): 칸 안이 이미
                  「예)」로 시작해 같은 말을 두 번 하고 있었다. */}
              <span aria-hidden="true" style={{ flex: "0 0 36px" }} />
            </div>
            {/* 아랫줄은 **접힌 모양으로** 보여준다 — 새 줄이 실제로 그렇게 생긴다 */}
            {bottom.length ? (
              <TextButton icon="plus" tone="muted" disabled tabIndex={-1} aria-hidden="true"
                style={{ alignSelf: "flex-start", minHeight: 32, padding: "0 2px", cursor: "default" }}>
                {lowerLabel} 추가
              </TextButton>
            ) : null}
          </div>
          {/* 눈으로 보는 사람에게는 위 한 줄이 곧 설명이다. 읽어주는 도구에는 그 줄이
              비활성 칸 더미로만 들리므로, 같은 뜻을 한 문장으로 남긴다 */}
          <VisuallyHidden>
            아직 없습니다. 위 줄은 {addLabel} 을 눌렀을 때 생기는 칸을 보여주는 예시입니다.
          </VisuallyHidden>
        </div>
      )}

      {/* 줄 수가 정해진 목록에는 [추가]가 없다 (위 fixedRows 머리말) — 자리째 비운다 */}
      {fixed ? null : (
        <div style={{ marginTop: "var(--space-3)" }}>
          <Button variant="outline" size="sm" icon="plus" onClick={add}>{addLabel}</Button>
        </div>
      )}

      {/* 저장할 때 나는 오류(`error`)와 **[추가]를 눌러 막힌 말**이 같은 자리에 선다 —
          둘 다 「지금 이 목록에서 걸린 것」이고, 자리를 나누면 담당자가 두 곳을 보게 된다.
          저장 오류가 먼저다: 그쪽은 이미 들어간 값의 문제라 새 줄을 만드는 것보다 앞선다.
          `role="alert"` 인 것은 [추가]를 눌러 **방금 생긴** 말이기 때문이다 — 눌렀는데
          아무 줄도 생기지 않은 사람에게 그 이유가 소리로도 가야 한다 */}
      {error || blockedNow ? (
        <p role={error ? undefined : "alert"}
          style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--state-danger)", lineHeight: 1.5 }}>
          {error || addBlocked}
        </p>
      ) : null}
      {note ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

/* ── 여기 있던 `ConditionalBadge` 를 없앴다 (2026-08-20, 사용자 요청) ──────────
   「조건부 · 자료 확보 시」라고 적던 이름표다. 자료를 받을지 아직 모른다는 것은 **우리 쪽
   사정**이고, 이 칸을 채우는 사람에게 그것은 "있으면 넣고 없으면 비운다"와 똑같이 행동한다 —
   즉 그냥 선택 항목이다. 우리 사정을 화면에 적으면 담당자는 그 배지가 자기에게 무엇을
   요구하는지 알아내려 애쓴다.

   `badge` 슬롯 자체는 남아 있다 (제목 옆에 무엇이든 세울 수 있는 자리다). */

export default Repeater;
