import React from "react";
import {
  DetailPage, DetailBody, Button, Input, Textarea, RadioGroup,
  Notice, EmptyState, FacilityIcon, CategoryIcon, Icon, InfoList,
} from "../../design-systems/index.js";

/* S10 오류신고 및 문의 (U-CM-10).
 *
 * 폼 항목은 셋이다 — **대상 · 유형 · 내용.**
 *
 * ── 대상은 사용자가 고르지 않는다 ──────────────────────────────────────────
 * 이 화면에 들어오는 길은 S05 시설 상세 · S06 점포 상세 · S07 길찾기의 [정보 오류 신고]
 * 뿐이고, 셋 다 대상을 해시에 싣고 온다. (축제 상세와 코스 상세에도 같은 단추가 있었는데
 * 2026-08-19 에 뺐다 — 실을 대상이 없어 빈 폼이 열렸다. 그쪽 주석 참조.)
 * 즉 대상은 이미 정해져 있고, 그것을 다시 고르게 하면 사용자가 방금 보던 곳을 335곳
 * 목록에서 다시 찾아야 한다. 그래서 대상은 **읽기 전용 카드**로 보여주기만 한다.
 * (대상 없이 딥링크로 들어온 경우에만 이름을 적는 칸이 열린다. 그때도 선택 항목이다 —
 *  "어디가 틀렸는지는 모르겠지만 뭔가 이상하다"는 신고를 막을 이유가 없다.)
 *
 * ── 회신처를 받지 않는다 (2026-08-18 결정) ───────────────────────────────
 * 개별 회신을 할 계획이 없다. 계획이 없는데 연락처 칸을 열어두면 적은 사람은 답을 기다리고,
 * 우리는 쓰지도 않을 개인정보를 받아 보관 책임만 진다. 칸을 없애면 그에 딸린 개인정보
 * 수집 동의 체크도 함께 사라진다 — 수집하지 않으니 받을 동의가 없다.
 * 접수 결과 화면의 접수번호는 그대로 둔다. 회신이 없는 만큼 사용자가 나중에 이 신고를
 * 가리킬 유일한 단서다.
 *
 * ── 검증은 제출할 때 한 번에 한다 ──────────────────────────────────────────
 * 타이핑 중에 붉은 글씨가 붙었다 떨어지면 아직 다 쓰지도 않은 사람을 재촉하게 된다.
 * 제출을 누른 뒤에는 고칠 때마다 즉시 풀린다 (submitted 이후에만 실시간 검증).
 * 첫 오류 칸으로 포커스를 옮기고 aria-live 로 개수를 알린다 — 화면 아래쪽 오류는
 * 스크롤 밖이라 "제출이 안 눌린다"로 읽힌다.
 *
 * ── 접수는 이 화면이 하지 않는다 ───────────────────────────────────────────
 * onSubmit 으로 올려보내기만 한다. 지금은 셸이 접수번호를 만들어 돌려주지만(서버가 없다),
 * 실연동 때 바뀌는 것은 셸의 그 함수 하나다.
 */

/* 유형은 관리자 검수 큐가 처리 방법을 나누는 축이다 (제안서 3-5: 폐업 점포 보정).
   자유 서술만 받으면 그 분류를 사람이 매번 다시 해야 한다. */
export const REPORT_KINDS = [
  { value: "location", label: "위치가 실제와 다릅니다" },
  { value: "hours",    label: "운영시간, 휴무 정보가 다릅니다" },
  { value: "closed",   label: "폐업, 철거되어 지금은 없습니다" },
  { value: "name",     label: "이름, 연락처 등 표기가 다릅니다" },
  { value: "etc",      label: "그 밖의 오류나 문의" },
];

const MIN_BODY = 10;
const MAX_BODY = 500;

export function ReportForm({ target, targetKind, onBack, onSubmit, receipt, base = "../../design-systems/" }) {
  const [kind, setKind] = React.useState("");
  const [body, setBody] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const form = React.useRef(null);

  const errors = React.useMemo(() => {
    const e = {};
    if (!kind) e.kind = "어떤 오류인지 골라 주세요.";
    if (body.trim().length < MIN_BODY) e.body = `무엇이 어떻게 다른지 ${MIN_BODY}자 이상 적어 주세요.`;
    return e;
  }, [kind, body]);

  const shown = submitted ? errors : {};
  const count = Object.keys(errors).length;

  const submit = e => {
    if (e) e.preventDefault();
    setSubmitted(true);
    if (count) {
      /* 첫 오류로 포커스를 옮긴다. 순서는 화면에 놓인 순서와 같아야 한다 —
         객체 키 순서에 기대면 검증 조건을 추가할 때 조용히 어긋난다. */
      const first = ["kind", "body"].find(k => errors[k]);
      const box = form.current && form.current.querySelector(`[data-field="${first}"]`);
      if (box) {
        const focusable = box.querySelector("input, textarea, select");
        if (focusable && focusable.focus) focusable.focus();
        if (box.scrollIntoView) box.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }
    setBusy(true);
    onSubmit({
      kind,
      kindLabel: (REPORT_KINDS.find(k => k.value === kind) || {}).label,
      body: body.trim(),
      target: target
        ? { id: target.id, name: target.name, type: targetKind }
        : { id: null, name: name.trim() || null, type: null },
    });
  };

  /* ── 제출 완료 ─────────────────────────────────────────────────────────
        접수번호를 크게 둔다. 회신을 하지 않으므로 이 번호가 나중에 이 신고를 가리킬 유일한 단서다. */
  if (receipt) {
    return (
      <DetailPage title="신고 접수 완료" onBack={onBack}
        footer={<Button block onClick={onBack}>닫기</Button>}>
        <DetailBody>
          <EmptyState pose="thanks" base={base}
            title="접수되었습니다"
            description="보내주신 내용은 담당 부서 확인을 거쳐 반영됩니다."
            style={{ padding: "var(--space-6) 0 var(--space-2)" }} />

          <div style={{ padding: "var(--space-4)", background: "var(--surface-sunken)",
            borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>접수번호</p>
            <p style={{ marginTop: 4, fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-bold)",
              color: "var(--text-heading)", letterSpacing: "var(--ls-wide)" }}>
              {receipt.no}
            </p>
          </div>

          <InfoList items={[
            { label: "대상", value: receipt.target && receipt.target.name },
            { label: "유형", value: receipt.kindLabel },
          ]} />

          {/* 개별 회신이 없다는 것은 접수 직후에 분명히 해둔다. 적어두지 않으면
              연락을 기다리다가 "신고해도 아무 답이 없다"로 남는다 */}
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
            개별 회신은 드리지 않습니다. 확인된 내용은 안내 정보에 바로 반영됩니다.
          </p>
        </DetailBody>
      </DetailPage>
    );
  }

  return (
    <DetailPage title="정보 오류 신고" onBack={onBack}
      footer={
        <Button block onClick={submit} disabled={busy}>
          {busy ? "접수 중…" : "신고 접수"}
        </Button>
      }>
      <form ref={form} onSubmit={submit} noValidate>
        <DetailBody>

          {/* ── 대상 ─────────────────────────────────────────────────── */}
          {target ? (
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start",
              padding: "var(--space-4)", background: "var(--surface-sunken)",
              borderRadius: "var(--radius-md)" }}>
              <span style={{ flex: "0 0 auto", paddingTop: 2 }}>
                {targetKind === "facility"
                  ? <FacilityIcon type={target.type} size={24} />
                  : <CategoryIcon type={target.cat} size={24} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>신고 대상</p>
                <p style={{ marginTop: 2, fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)",
                  color: "var(--text-heading)", lineHeight: 1.4 }}>
                  {target.name}
                </p>
                {target.addr || target.place ? (
                  <p style={{ marginTop: 2, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {target.addr || target.place}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <Notice tone="info" title="대상이 지정되지 않았습니다">
                시설이나 점포 화면에서 [정보 오류 신고]를 누르면 대상이 자동으로 채워집니다.
              </Notice>
              <Input label="대상 이름" hint="아는 만큼만 적어 주세요 (선택)"
                placeholder="예) 둔전마을회관 AED"
                value={name} onChange={e => setName(e.target.value)} />
            </>
          )}

          {/* ── 유형 ─────────────────────────────────────────────────── */}
          <div data-field="kind">
            <RadioGroup label="어떤 오류인가요" name="report-kind" required
              options={REPORT_KINDS} value={kind} onChange={setKind}
              error={shown.kind} />
          </div>

          {/* ── 내용 ─────────────────────────────────────────────────── */}
          <div data-field="body">
            <Textarea label="자세한 내용" required rows={5} maxLength={MAX_BODY}
              placeholder="예) 안내된 위치보다 한 블록 위, 주민센터 정문 옆에 있습니다."
              /* 도움말 줄을 뺐다 (2026-08-24) — "언제 보신 것인지 함께 적어주시면
                 확인이 빠릅니다." 였다. 아래 placeholder 가 이미 무엇을 적으면 되는지
                 예로 보여주고 있어, 그 위에 요구가 한 줄 더 붙으면 신고 한 건에
                 적어야 할 것이 늘어난 것처럼 읽힌다. */
              value={body} onChange={e => setBody(e.target.value)}
              error={shown.body} />
          </div>

          {/* 회신처 칸은 없다 — 위 머리 주석 참조. 연락처를 받지 않으므로
              개인정보 수집 동의도 함께 빠졌다. */}

          {/* 제출을 눌렀는데 아무 일도 안 일어난 것처럼 보이지 않게 개수를 알린다.
              화면 아래쪽 오류는 스크롤 밖이라 눈에 들어오지 않는다 */}
          <p aria-live="assertive" style={{ fontSize: "var(--fs-caption)", color: "var(--state-danger)", lineHeight: 1.5 }}>
            {submitted && count ? `입력하지 않은 항목이 ${count}개 있습니다.` : ""}
          </p>

          <p style={{ display: "flex", gap: "var(--space-2)", fontSize: "var(--fs-caption)",
            color: "var(--text-muted)", lineHeight: 1.55 }}>
            <Icon name="shield-check" size={16} style={{ marginTop: 2 }} />
            <span>
              접수된 내용은 안내 정보를 수정하는 데 활용됩니다. 개별 답변은 어려운 점 양해 부탁드립니다.
              긴급한 상황이나 신고가 필요한 경우에는 119 등 공식 채널을 이용해 주세요.
            </span>
          </p>
        </DetailBody>
      </form>
    </DetailPage>
  );
}

export default ReportForm;
