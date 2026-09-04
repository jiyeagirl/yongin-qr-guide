import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";

/* 파일 한 개를 고르는 칸 — 일괄 등록 다이얼로그가 쓴다 (관리자 명세서 M03 · M05).
 *
 * ── 왜 <input type="file"> 을 그대로 쓰지 않는가 ────────────────────────────
 * 브라우저 기본 칸은 [파일 선택] 단추와 「선택된 파일 없음」 한 줄이고, 그 모양과 글자를
 * 우리가 정하지 못한다 — 크롬·엣지·사파리가 각각 다른 말을 적고, 그 줄만 이 화면의
 * 글꼴과 크기 밖에 선다. 무엇보다 **끌어다 놓기가 되지 않는다**: 담당자가 손에 들고
 * 있는 것은 방금 내려받은 엑셀 파일이고, 그것을 창에 끌어다 놓는 것이 파일 탐색기를
 * 열어 다시 찾아가는 것보다 짧다.
 *
 * 그래서 진짜 입력칸은 숨겨 두고(값을 실어 나르는 일만 한다) 눈에 보이는 것은 **끌어다
 * 놓는 자리이자 누르면 열리는 단추** 하나다. 그 자리가 `<button>` 인 것이 요점이다 —
 * div 에 onClick 을 달면 키보드로는 파일을 고를 수 없다.
 *
 * ── 검사는 이 칸이 한다 ────────────────────────────────────────────────────
 * 확장자와 크기는 이 칸이 받은 규칙(`accept` · `maxSize`)이므로, 어겼을 때 하는 말도
 * 여기서 적는다. 부르는 쪽마다 같은 검사를 다시 쓰면 화면마다 문구가 갈리고, 그중
 * 하나는 반드시 규칙과 어긋난다. **밖에서 온 오류(`error`)가 먼저다** — 이 칸이 말할
 * 수 있는 것은 「이 파일이 아니다」까지이고, 「파일을 아직 고르지 않았다」는 저장을
 * 누른 쪽이 안다.
 *
 * ── 잘못 고른 파일이 이미 고른 파일을 지우지 않는다 ────────────────────────
 * 규칙에 걸린 파일은 이유만 적고 **값은 그대로 둔다.** 엑셀을 올리려다 옆의 PDF 를
 * 잘못 끌어다 놓았을 때, 화면이 하는 일이 「아까 고른 것마저 없애기」면 담당자는
 * 처음부터 다시 한다.
 */

const KB = 1024;
const sizeText = n => (n >= KB * KB
  ? `${(n / KB / KB).toFixed(1)}MB`
  : `${Math.max(1, Math.round(n / KB)).toLocaleString("ko-KR")}KB`);

const extOf = name => {
  const at = String(name).lastIndexOf(".");
  return at < 0 ? "" : String(name).slice(at).toLowerCase();
};

export function FileField({
  accept = ".xlsx,.xls",
  maxSize = 10 * KB * KB,
  file, onChange,
  /* ── `blocked` 는 「아직 이 칸을 쓸 때가 아니다」를 **이유와 함께** 받는다 ─────────
     (2026-09-04) 앞 칸을 채워야 열리는 자리에 쓴다 — 일괄 등록 창에서 시설 유형이나
     소속 상점가를 고르기 전이 그렇다. `disabled` 와 나눠 둔 이유는 **흐리기만 하고
     왜인지 말하지 않는 상태를 만들 수 없게** 하기 위해서다(이 시스템이 흐린 단추에서
     반복해 내린 결론이다 — 못 누른다는 것만 말하는 표시는 담당자가 이유를 잘못 짚는다).
     문장은 규칙 줄(`.xlsx · .xls · 최대 10MB`) **자리에 대신 선다** — 고를 수 없는
     동안에는 무엇을 받는지보다 **무엇을 먼저 해야 하는지**가 그 자리에서 할 말이다. */
  blocked,
  disabled, error, style, ...rest
}) {
  const input = React.useRef(null);
  const [over, setOver] = React.useState(false);
  /* 규칙에 걸린 이유. 새 파일을 고르면 지워진다 — 방금 일어난 일에 대한 말이지
     이 칸에 늘 붙어 있는 설명이 아니다 */
  const [deny, setDeny] = React.useState("");

  const exts = String(accept).split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const rule = `${exts.join(" · ")} · 최대 ${sizeText(maxSize)}`;

  const take = f => {
    if (!f) return;
    if (exts.length && !exts.includes(extOf(f.name))) {
      setDeny(`${exts.join(" · ")} 파일만 올릴 수 있습니다.`);
      return;
    }
    if (maxSize && f.size > maxSize) {
      setDeny(`파일이 ${sizeText(maxSize)}를 넘습니다. (${sizeText(f.size)})`);
      return;
    }
    setDeny("");
    if (onChange) onChange(f);
  };

  /* 막힌 것과 잠긴 것은 화면에서 같은 일을 한다 — 고를 수 없다 */
  const off = disabled || !!blocked;

  const open = () => { if (!off && input.current) input.current.click(); };

  /* 같은 파일을 두 번 고를 수 있어야 한다 — 값을 비우지 않으면 두 번째 선택에서
     change 가 오지 않는다 (파일을 고쳐 저장하고 다시 올리는 일이 그것이다) */
  const onInput = e => { take(e.target.files && e.target.files[0]); e.target.value = ""; };

  const onDrop = e => {
    e.preventDefault();
    setOver(false);
    if (off) return;
    const dt = e.dataTransfer;
    take(dt && dt.files && dt.files[0]);
  };

  /* 자식 위로 들어가도 dragleave 가 온다 — 그때마다 테두리가 깜빡이지 않게
     상자 밖으로 나갔을 때만 끈다 */
  const onLeave = e => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setOver(false);
  };

  const msg = error || deny;
  /* ── 막힌 이유는 **한 자리에서만** 말한다 ─────────────────────────────────────
     칸 안에 안내로 서 있다가, [업로드]를 눌러 그 이유로 막힌 순간 **같은 줄이 붉어진다.**
     같은 문장을 칸 안과 칸 아래에 두 번 적으면 담당자는 두 줄을 견주게 되고(둘이 같은
     말인지 다른 말인지부터 읽는다), 아래 줄만 두면 **막힌 칸 자체는 왜 흐린지 말하지
     않는다.** 그래서 아래 줄은 그 문장이 아닐 때만 선다. */
  /* 그 문장이 칸 **안**에 설 수 있는 것은 아직 파일을 고르지 않았을 때뿐이다 — 파일을
     고른 뒤에 위 칸이 다시 비워지면(고른 유형을 「— 선택 —」으로 되돌리는 일이 있다)
     칸 안에는 파일 이름이 서 있으므로, 그때는 이유가 **칸 아래**로 내려온다.
     그 자리를 두지 않으면 [업로드]가 아무 말 없이 아무 일도 하지 않는 상태가 생긴다. */
  const inZone = !file && !!blocked;
  const stopped = inZone && msg === blocked;
  const foot = msg && !stopped ? msg : null;

  return (
    <div style={style} {...rest}
      onDragOver={e => { e.preventDefault(); if (!off) setOver(true); }}
      onDragLeave={onLeave}
      onDrop={onDrop}>

      {file ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)",
          padding: "var(--space-4)", background: "var(--surface-card)",
          border: `var(--stroke-hairline) solid ${over ? "var(--border-brand)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md)" }}>
          <Icon name="file-spreadsheet" size={22} color="var(--brand-primary)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
              color: "var(--text-heading)", wordBreak: "break-all", lineHeight: 1.45 }}>
              {file.name}
            </div>
            <div style={{ marginTop: 2, fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {sizeText(file.size)}
            </div>
          </div>
          {/* 단추 하나다. [제거]를 나란히 두지 않는 이유는 **파일을 비우는 것 자체가
              담당자가 하려는 일이 아니기** 때문이다 — 잘못 골랐으면 다른 것을 고르고,
              그만두려면 창을 닫는다. 지우고 나서 다시 고르는 두 걸음을 한 걸음으로 둔다 */}
          <Button variant="outline" size="sm" icon="repeat" onClick={open} disabled={off}>
            파일 바꾸기
          </Button>
        </div>
      ) : (
        <button type="button" onClick={open} disabled={off}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center",
            gap: "var(--space-2)", padding: "var(--space-6) var(--space-5)",
            background: over ? "var(--brand-primary-soft)" : "var(--surface-sunken)",
            /* 막혔을 때 붉은 테를 두르지 않는다 — 붉은색은 「고쳐야 할 것이 여기 있다」는
               뜻인데, 고칠 것은 이 칸이 아니라 **위 칸**이다. 흐리게 두고 이유만 적는다 */
            border: `var(--stroke-outline) dashed ${over ? "var(--border-brand)" : "var(--border-strong)"}`,
            borderRadius: "var(--radius-md)", cursor: off ? "not-allowed" : "pointer",
            opacity: off ? 0.55 : 1, fontFamily: "var(--font-sans)",
            transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)" }}>
          <Icon name="upload" size={24} color={over ? "var(--brand-primary)" : "var(--text-muted)"} />
          {/* 이 한 줄이 지금 「엑셀」이라고 못박는다 (2026-09-04, 사용자 요청) — 이 칸을
              쓰는 자리가 일괄 등록 창 하나이고 거기서 받는 것이 엑셀뿐이라, 「파일」이라고
              두는 것보다 받는 것을 이름으로 부르는 편이 짧다. 다른 종류를 받는 자리가
              생기는 날 이 줄이 prop 이 된다 — 그전에 미리 열어 두지 않는다(부르는 쪽이
              하나뿐인 prop 은 갈아끼울 일 없이 자리만 차지한다) */}
          <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)",
            color: "var(--text-heading)", letterSpacing: "var(--ls-snug)", wordBreak: "keep-all" }}>
            엑셀 파일을 드래그하거나 클릭하여 업로드하세요.
          </span>
          {/* 규칙은 고르기 **전에** 읽는 값이라 칸 안에 있다 — 아래에 적으면 걸리고 나서야
              읽는 줄이 되고, 그때는 오류가 같은 말을 한 번 더 한다.
              막혀 있는 동안에는 그 자리에 **무엇을 먼저 해야 하는지**가 대신 선다 (위 머리말) */}
          <span style={{ fontSize: "var(--fs-caption)", lineHeight: 1.5, wordBreak: "keep-all",
            color: stopped ? "var(--state-danger)" : "var(--text-muted)",
            fontWeight: stopped ? "var(--fw-semibold)" : "var(--fw-regular)" }}>
            {blocked || rule}
          </span>
        </button>
      )}

      {foot ? (
        <p role="alert" style={{ marginTop: "var(--space-2)", fontSize: "var(--fs-caption)",
          color: "var(--state-danger)", lineHeight: 1.5 }}>
          {foot}
        </p>
      ) : null}

      {/* 고른 파일이 있는데 위 칸이 비워진 상태 — 칸 안에는 파일 이름이 서 있으므로 이유가
          여기 선다. 아직 막힌 것이 아니라 **막힐 것**이라 회색이다 (붉어지는 것은 위 `foot`) */}
      {blocked && file && !foot ? (
        <p style={{ marginTop: "var(--space-2)", fontSize: "var(--fs-caption)",
          color: "var(--text-muted)", lineHeight: 1.5 }}>
          {blocked}
        </p>
      ) : null}

      {/* 눈으로는 위 줄이 붉어진 것으로 알지만, **읽어주는 도구에는 그 색이 없다** —
          글자가 그대로이므로 아무 일도 일어나지 않은 것과 같다. 막힌 순간에만 서는
          줄을 하나 두어 그때 읽히게 한다 (`VisuallyHidden` — 화면에는 나오지 않는다) */}
      {stopped ? <VisuallyHidden role="alert">{blocked}</VisuallyHidden> : null}

      {/* ── 진짜 입력칸은 **맨 뒤에, display:none 으로** 둔다 ──────────────────────
          이 칸이 서는 자리가 다이얼로그 안이라서다. `Modal` 은 열릴 때 본문의 **첫
          포커스 가능한 요소**로 포커스를 보내고 탭을 상자 안에 가두는데, 그 목록을
          고르는 선택자에 `input:not([disabled])` 가 들어 있다 — 눈에 보이지 않게
          밀어 둔 칸(`clip` · 1px)은 그 목록에 그대로 걸리고, 위에 두면 **창을 연 순간
          포커스가 보이지 않는 칸에 가 있다.**

          `display:none` 이면 목록에 이름은 올라도 브라우저가 포커스를 주지 않으므로
          탭이 조용히 건너뛴다. 그래도 **프로그램이 부르는 `.click()` 은 그대로 열린다** —
          그것이 이 칸이 하는 일의 전부다. 자리를 맨 뒤로 옮긴 것은 그와 별개로, 위
          단추가 언제나 「본문의 첫 칸」이 되게 하기 위해서다. */}
      <input ref={input} type="file" accept={accept} onChange={onInput} disabled={disabled}
        tabIndex={-1} aria-hidden="true" style={{ display: "none" }} />
    </div>
  );
}

export default FileField;
