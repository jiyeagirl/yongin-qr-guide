import React from "react";
import { Button } from "../core/Button.jsx";
import { TextButton } from "../core/TextButton.jsx";
import { IconButton } from "../core/IconButton.jsx";
import { Icon } from "../core/Icon.jsx";
import { Textarea } from "../core/Textarea.jsx";

/* 만족도 한 문항을 화면 아래에서 묻는 카드 (2026-11-09 추가 — 사용자 만족도 조사).
 *
 *   ┌──────────────────────────────────────┐
 *   │ 오늘 확인하신 정보,              [×] │
 *   │ 만족스러우셨나요?                    │
 *   │  😞    🙁    😐    🙂    😄          │
 *   │ 매우   불만족 보통  만족  매우        │
 *   │ 불만족                    만족        │
 *   │ 다시 보지 않기              [제출]   │
 *   └──────────────────────────────────────┘
 *        ↓ [제출] — 점수는 여기서 저장된다
 *   ┌──────────────────────────────────────┐
 *   │ 응답해 주셔서 감사합니다         [×] │
 *   │ 아쉬운 점이 있다면 알려주세요. (선택) │
 *   │ ┌──────────────────────────────────┐ │
 *   │ └──────────────────────────────────┘ │
 *   │                            [보내기]  │
 *   └──────────────────────────────────────┘
 *        ↓ [보내기]
 *   ┌──────────────────────────────────────┐
 *   │ ♥ 소중한 의견 감사합니다         [×] │
 *   └──────────────────────────────────────┘
 *
 * ── `WelcomeDialog` 과 무엇이 다른가 ────────────────────────────────────────
 * 저쪽은 막을 깔고 가운데 서서 **갈림길을 고르게** 한다. 이쪽은 막이 없다 — 사람이 보던
 * 상세 화면을 가리고 대답을 요구하면 설문이 서비스보다 앞에 서게 된다. 아래에 붙어
 * 있다가 무시하면 [×] 한 번으로 물러난다.
 *
 * ── 누르면 고르기만 하고, 저장은 [제출] 이 한다 ─────────────────────────────
 * 이모지를 누르는 즉시 저장하면 손끝이 옆 칸을 스쳤을 때 고칠 길이 없다(사용자 요청).
 * 그래서 누르면 고른 표시만 바뀌고, [제출] 이 눌려야 `onSubmit(value)` 가 불린다.
 * [제출] 은 고르기 전에는 꺼져 있다.
 *
 * ── 이유는 점수 뒤에, 고르게 둔다 (2026-11-09 추가, 사용자 요청) ───────────────
 * 점수를 보낸 뒤에 한 줄 더 묻는다. 쓰지 않아도 된다 — [×] 로 닫으면 점수만 남는다. 처음부터 칸을
 * 함께 펼쳐두면 이모지 한 번이면 끝날 일이 「글도 써야 하나」로 읽혀 대답 자체를 덜 하게 된다.
 * [보내기] 는 빈 칸일 때 꺼져 있다 — 빈 이유를 보내는 단추는 [×] 와 같은 일을 하는 둘째 단추다.
 *
 * ── 닫는 길이 둘인 이유 ─────────────────────────────────────────────────────
 * [×] 와 [다시 보지 않기] 는 **다음 방문에서의 일이 다르다**. [×] 는 이번만 물러나고,
 * [다시 보지 않기] 는 다시 묻지 않는다. 그 차이는 부르는 쪽(`onClose` · `onNever`)이 적는다.
 *
 * 높이는 고정하지 않는다 — 2차 글자 확대에서 라벨이 두 줄이 되며 늘어난다.
 *
 * options: [{ value, emoji, label }] — 기본은 5단계(1 매우 불만족 ~ 5 매우 만족)
 * step: "ask"(묻는 중) · "comment"(이유 쓰기) · "thanks"(감사 문구). 단계를 넘기는 것과 언제 닫을지는 부르는 쪽이 정한다.
 */

export const SURVEY_SCALE = [
  { value: 1, emoji: "😞", label: "매우 불만족" },
  { value: 2, emoji: "🙁", label: "불만족" },
  { value: 3, emoji: "😐", label: "보통" },
  { value: 4, emoji: "🙂", label: "만족" },
  { value: 5, emoji: "😄", label: "매우 만족" },
];

export function SurveyPrompt({
  question,
  options = SURVEY_SCALE,
  step = "ask",
  thanks = "소중한 의견 감사합니다",
  commentTitle = "응답해 주셔서 감사합니다",
  commentLabel = "아쉬운 점이 있다면 알려주세요.",
  commentMax = 300,
  onSubmit,
  onComment,
  onClose,
  onNever,
  style,
  ...rest
}) {
  const [picked, setPicked] = React.useState(null);
  const [text, setText] = React.useState("");
  const submitted = step === "thanks";
  const heading = step === "comment" ? commentTitle : question;

  return (
    <div role="dialog" aria-label={submitted ? thanks : heading}
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: "var(--z-prompt)",
        padding: "0 var(--space-3) calc(var(--space-3) + env(safe-area-inset-bottom))",
        pointerEvents: "none", ...style }} {...rest}>
      <div style={{ pointerEvents: "auto", background: "var(--surface-card)",
        borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-raised)",
        padding: "var(--space-4)", animation: "yong-pop var(--dur-base) var(--ease-bounce)" }}>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
          {submitted ? (
            <p aria-live="polite" style={{ flex: 1, margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)",
              fontSize: "var(--fs-body)", lineHeight: "var(--lh-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)",
              paddingTop: 10 }}>
              <Icon name="heart" size={20} style={{ color: "var(--brand-primary)", flex: "0 0 auto" }} />
              {thanks}
            </p>
          ) : (
            <p aria-live={step === "comment" ? "polite" : undefined}
              style={{ flex: 1, margin: 0, paddingTop: 10, fontSize: "var(--fs-body)", lineHeight: "var(--lh-body)",
              fontWeight: "var(--fw-bold)", color: "var(--text-heading)" }}>{heading}</p>
          )}
          <IconButton name="x" label="닫기" onClick={onClose} style={{ flex: "0 0 auto", marginTop: -2, marginRight: -6 }} />
        </div>

        {step === "comment" ? (
          <>
            <Textarea label={`${commentLabel} (선택)`} value={text} rows={3} maxLength={commentMax}
              onChange={e => setText(e.target.value)} style={{ marginTop: "var(--space-3)" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
              <Button variant="primary" disabled={!text.trim()}
                onClick={() => { if (text.trim() && onComment) onComment(text.trim()); }}>보내기</Button>
            </div>
          </>
        ) : submitted ? null : (
          <>
            <div role="radiogroup" aria-label={question}
              style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-3)" }}>
              {options.map(o => {
                const on = picked === o.value;
                return (
                  <button key={o.value} type="button" role="radio" aria-checked={on} aria-label={o.label}
                    onClick={() => setPicked(o.value)}
                    style={{ flex: "1 1 0", minWidth: 0, minHeight: 64, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "flex-start", gap: 2, padding: "var(--space-2) 2px",
                      borderRadius: "var(--radius-control)", cursor: "pointer", font: "inherit",
                      background: on ? "var(--brand-primary-soft)" : "transparent",
                      border: `2px solid ${on ? "var(--brand-primary)" : "transparent"}`,
                      transition: "background var(--dur-fast), border-color var(--dur-fast)" }}>
                    <span aria-hidden="true" style={{ fontSize: 30, lineHeight: 1.1,
                      filter: picked != null && !on ? "grayscale(.6)" : "none",
                      opacity: picked != null && !on ? 0.6 : 1 }}>{o.emoji}</span>
                    <span aria-hidden="true" style={{ fontSize: "var(--fs-caption)", lineHeight: "var(--lh-caption)",
                      color: on ? "var(--brand-primary)" : "var(--text-muted)", fontWeight: on ? "var(--fw-bold)" : "var(--fw-regular)",
                      textAlign: "center", wordBreak: "keep-all" }}>{o.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
              <TextButton tone="muted" onClick={onNever}>다시 보지 않기</TextButton>
              <Button variant="primary" disabled={picked == null}
                onClick={() => { if (picked != null && onSubmit) onSubmit(picked); }}>제출</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SurveyPrompt;
