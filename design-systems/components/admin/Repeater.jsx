import React from "react";
import { Input } from "../core/Input.jsx";
import { Select } from "../core/Select.jsx";
import { Switch } from "../core/Switch.jsx";
import { Button } from "../core/Button.jsx";
import { IconButton } from "../core/IconButton.jsx";
import { TextButton } from "../core/TextButton.jsx";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";

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

/* 오른쪽에 비워 두는 폭 — 삭제 버튼(36) + 그 앞의 gap. 열 이름 줄 · 아랫줄 · 예시 줄이
   **같은 값을 써야** 세 줄의 칸 끝이 한 자리에서 만난다. 전에는 40 이라고 적혀 있어
   4px 씩 어긋나 있었다 (2026-08-25). */
const RESERVE = "calc(36px + var(--space-2))";

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
  /* 지울 때 무엇을 지우는지 이름으로 적기 위한 열쇠 (아래 `pending`). 목록마다 이름 칸이
     다르다 — 프로그램은 `title`, 부스는 `name`. 없으면 「n번째 줄」로 부른다 */
  nameKey = "name",
  minRows = 0, error, span = 2,
}) {
  const list = Array.isArray(rows) ? rows : [];
  const top = columns.filter(c => !c.row2);
  const bottom = columns.filter(c => c.row2);
  /* 아랫줄이 있는 목록만 카드를 두른다 (위 PLAIN 머리말). 열 이름 줄의 들여쓰기도
     여기에 따라간다 — 카드가 없으면 들일 것이 없다 */
  const carded = bottom.length > 0;
  const inset = carded ? CARD_INSET : "0px";

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
  const asking = pending != null && pending < list.length ? pending : null;

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
  const add = () => { setPending(null); if (onChange) onChange(list.concat(newRow())); };
  const drop = i => {
    setPending(null);
    setOpenLower([]);            /* 뒤 번호가 당겨진다 — 위 openLower 머리말 */
    if (onChange) onChange(list.filter((_, n) => n !== i));
  };
  const nameOf = (row, i) => {
    const v = row && row[nameKey];
    return v && String(v).trim() ? String(v).trim() : `${i + 1}번째 줄`;
  };

  /* 열 이름 줄. 비었을 때도 그린다 — 아래 예시 줄이 어느 칸에 무엇을 넣는 자리인지
     말해 주는 것이 이 줄이다. 오른쪽은 삭제 버튼 자리(RESERVE)를, 양쪽은 카드 안쪽
     여백(CARD_PAD)을 함께 비워 둔다 — 그래야 머리글과 카드 안의 칸이 한 세로선에 선다.
     **윗줄 칸만 가리킨다** — 아랫줄 칸은 자기 이름표를 위에 달고 있다. */
  const head = (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
      padding: `0 calc(${RESERVE} + ${inset}) 0 ${inset}`,
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
    <div style={{ display: "flex", gap: "var(--space-2)", paddingRight: RESERVE }}>
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
          {list.length}건{minRows ? ` · 최소 ${minRows}건` : ""}
        </span>
      </div>

      {list.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {/* 열 이름은 한 번만 적는다. 줄마다 label 을 붙이면 세 줄짜리 목록이
              화면 절반을 먹는다 */}
          {head}

          {/* 줄 하나가 카드 하나다 (머리말 ②) — 가는 선으로 가르지 않는다 */}
          {list.map((row, i) => (
            <div key={i} style={carded ? CARD : PLAIN}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {top.map(c => (
                  <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                    {cell(c, row, i, false)}
                  </div>
                ))}
                {/* 묻고 있는 동안에는 휴지통을 자리째 비운다 — 같은 줄에 「지울까요?」와
                    다시 누를 수 있는 삭제 단추가 함께 서면 어느 쪽이 지금 할 일인지
                    흐려진다. 폭은 그대로 잡아 두어야 칸이 흔들리지 않는다 */}
                {asking === i ? (
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
          ))}
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
              {/* 고르는 칸의 예시는 **첫 선택지**다. 빈 값으로 두면 예시 줄에서 그 칸만
                  비어 보여, 고르는 칸이라는 사실이 오히려 흐려진다 (cell 의 off 갈래) */}
              {top.map(c => (
                <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}px` : 1, minWidth: 0 }}>
                  {cell(c, {}, -1, true)}
                </div>
              ))}
              {/* 삭제 버튼 자리를 비워 둔다 — 열 이름 줄의 RESERVE 와 맞춰야 칸이
                  어긋나지 않는다. 여기 「예시」라고 적었던 것을 뺐다 (2026-08-20): 칸 안이
                  이미 「예)」로 시작해 같은 말을 두 번 하고 있었다. */}
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

      <div style={{ marginTop: "var(--space-3)" }}>
        <Button variant="outline" size="sm" icon="plus" onClick={add}>{addLabel}</Button>
      </div>

      {error ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--state-danger)", lineHeight: 1.5 }}>
          {error}
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
