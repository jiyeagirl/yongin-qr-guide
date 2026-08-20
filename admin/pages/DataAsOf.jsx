import React from "react";
import { PageHeader, DataTable, Modal, Button, Input, Badge, Notice, EMPTY_MARK } from "../../design-systems/admin.js";
import { AS_OF_CATEGORIES, AS_OF_DEFAULTS, asOfPhrase } from "../data/settings.js";
import { V } from "../data/fields.js";
import { useSettings } from "../data/store.js";

/* M14 데이터 기준일 관리 (명세서 7장).
 *
 * ── 왜 개별 등록 화면에 두지 않는가 ─────────────────────────────────────────
 * 갱신이 **원천 파일 단위로** 일어나기 때문이다. 공중화장실 표준데이터를 한 번 받으면
 * 그 안의 수백 건이 전부 같은 달 기준이다. 건별로 적게 하면 같은 날 받은 자료에 다른
 * 날짜가 붙고, 그러면 시민 화면의 하단 고지가 가게마다 다른 달을 말한다.
 *
 * 명세서가 못 박은 그대로다: "카테고리 단위로 관리하며, 개별 점포·시설 등록 화면에는
 * 입력란을 두지 않는다."
 *
 * ── 공공시설 4종을 하나로 묶지 않는다 ───────────────────────────────────────
 * 원천의 갱신 주기가 유형마다 다르다. AED 는 월 단위로 갱신되는데 대피소는 반기에 한 번
 * 바뀐다. 한 값으로 묶으면 어느 한쪽은 반드시 틀린 날짜를 적게 되고, 틀린 날짜는
 * 없는 날짜보다 나쁘다 — 그것이 보증처럼 읽히기 때문이다.
 *
 * ── 기준일을 갖지 않는 카테고리를 목록에서 지우지 않는다 ────────────────────
 * 상점가 정보와 축제 정보는 공공데이터가 아니라 시·상인회가 그때그때 전달하는 자료라
 * "몇 월 기준"이라는 말이 성립하지 않는다. 목록에서 아예 빼면 **"기준일이 없는
 * 카테고리"와 "우리가 빠뜨린 카테고리"가 구분되지 않는다.** 줄은 남기고 사유를 적는다.
 *
 * ── 문구를 미리 보여준다 ────────────────────────────────────────────────────
 * 값을 넣는 사람은 `2026.04` 를 적지만 시민이 보는 것은 「공공시설 정보 2026.04. 기준」이다.
 * 끝 점 하나 때문에 형식을 다르게 적는 일이 실제로 생겨서, 저장되는 값과 나가는 문장을
 * 한 줄에 나란히 둔다.
 *
 * ── 기본은 잠겨 있다 (2026-08-20) ──────────────────────────────────────────
 * 전에는 화면을 열면 입력칸 넷이 바로 서 있었고, 지나가다 한 글자만 눌러도 값이 바뀌었다.
 * 이 값은 **시민용 상세 페이지 수백 장의 하단에 그대로 나가는 공시 문구**다. 다른 화면의
 * 실수는 그 한 건에서 끝나지만 여기서의 실수는 카테고리 전체가 틀린 달을 말하게 되고,
 * 틀린 날짜는 없는 날짜보다 나쁘다(위 문단과 같은 이유다).
 *
 * 그래서 세 걸음으로 만든다: **읽기 → [기준일 수정] → [제출]**. 읽기 상태에서는 글자만
 * 있어 누를 것이 없고, 고치겠다고 말한 뒤에야 입력칸이 선다. 제출은 바뀐 줄만 모아
 * 「무엇이 무엇으로」를 보여주고 한 번 더 묻는다 — 손이 미끄러져서는 여기까지 올 수 없다.
 */

/* 기준일 칸의 높이 — 읽기 상태의 글자와 고칠 때의 입력칸(Input size="sm")이 이 값을
   같이 쓴다. 표의 다른 행보다 조금 넉넉한 것은 일부러다: 일곱 줄짜리 표라 촘촘할 이유가
   없고, 이 화면에서 눈이 머무는 곳이 이 칸이다. */
const ROW_H = 36;

export function DataAsOf({ onToast }) {
  const asOf = useSettings("asOf", AS_OF_DEFAULTS, "데이터 기준일");
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(asOf.value);
  const [errors, setErrors] = React.useState({});
  const [asking, setAsking] = React.useState(null);   /* 제출 확인 — 바뀐 줄의 목록 */

  /* 저장된 값이 밖에서 바뀌면(초기화 버튼) 따라간다. 고치는 중이었다면 그 상태도 끝낸다 —
     내 화면의 입력칸이 이미 사라진 값을 붙들고 있으면 제출할 때 옛 값이 되살아난다 */
  React.useEffect(() => { setDraft(asOf.value); setErrors({}); setEditing(false); setAsking(null); },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [JSON.stringify(asOf.value)]);

  const managed = AS_OF_CATEGORIES.filter(c => c.managed);
  const changes = managed
    .map(c => ({ label: c.label, from: asOf.value[c.key], to: String(draft[c.key] || "").trim() }))
    .filter(x => x.from !== x.to);

  const startEdit = () => { setDraft(asOf.value); setErrors({}); setEditing(true); };
  const cancel = () => { setDraft(asOf.value); setErrors({}); setEditing(false); };

  /* [제출] 은 곧바로 저장하지 않는다. 형식을 먼저 보고, 통과하면 바뀐 줄을 모아 되묻는다 */
  const submit = () => {
    const bad = {};
    managed.forEach(c => {
      const v = String(draft[c.key] || "").trim();
      if (!v) bad[c.key] = "기준일을 적어야 합니다.";
      else if (!V.yearMonth.re.test(v)) bad[c.key] = V.yearMonth.msg;
    });
    if (Object.keys(bad).length) { setErrors(bad); onToast("입력 형식을 확인해 주세요."); return; }
    if (!changes.length) { setEditing(false); return; }   /* 고친 것이 없으면 조용히 닫는다 */
    setAsking(changes);
  };

  const confirmSubmit = () => {
    asOf.save(draft);
    setAsking(null);
    setEditing(false);
    setErrors({});
    onToast("데이터 기준일을 바꿨습니다.");
  };

  return (
    <>
      <PageHeader title="데이터 기준일 관리"
        note="카테고리마다 값 하나를 정하면, 그 카테고리에 속한 모든 시민용 상세 페이지 하단에 일괄 반영됩니다."
        /* 버튼은 sm 이다. 이 화면에서 실제로 하는 일은 [제출] 한 번뿐이고, 표가 일곱 줄인
           화면에서 md 버튼은 제목만큼 무게를 가져간다 */
        action={editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={cancel}>취소</Button>
            <Button variant="primary" size="sm" icon="check" onClick={submit}>제출</Button>
          </>
        ) : (
          <Button variant="outline" size="sm" icon="pencil" onClick={startEdit}>기준일 수정</Button>
        )} />

      <DataTable
        caption="카테고리별 데이터 기준일"
        rows={AS_OF_CATEGORIES} rowKey="key"
        empty={{ title: "카테고리가 없습니다." }}
        columns={[
          { key: "group", label: "구분", width: 130 },
          { key: "label", label: "카테고리", width: 160 },
          { key: "source", label: "원천", render: c => c.source || <span style={{ color: "var(--text-muted)" }}>{c.reason}</span> },
          { key: "managed", label: "기준일 관리", width: 110, align: "center",
            render: c => (
              <Badge tone={c.managed ? "success" : "neutral"} size="sm">
                {c.managed ? "적용" : "미적용"}
              </Badge>
            ) },
          /* 읽기 상태에서는 글자만 있다 — 누를 것이 없으면 실수로 바뀔 것도 없다.
             입력칸은 [기준일 수정] 을 누른 뒤에만 서고, 폭도 값에 맞춘다 (YYYY.MM 일곱 자).
             글자와 입력칸에 **같은 높이(ROW_H)** 를 준다. 그러지 않으면 [기준일 수정]을
             누르는 순간 그 줄만 키가 자라, 고치는 중일 때와 아닐 때가 다른 표처럼 보인다. */
          { key: "value", label: "기준일", width: 150,
            render: c => {
              if (!c.managed) {
                return <span style={{ display: "inline-flex", alignItems: "center", minHeight: ROW_H,
                  color: "var(--text-muted)" }}>{EMPTY_MARK}</span>;
              }
              if (!editing) {
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", minHeight: ROW_H,
                    fontVariantNumeric: "tabular-nums", fontWeight: "var(--fw-semibold)",
                    color: "var(--text-heading)" }}>
                    {asOf.value[c.key] || <span style={{ color: "var(--text-muted)", fontWeight: "var(--fw-regular)" }}>기준일 미설정</span>}
                  </span>
                );
              }
              return (
                <div>
                  <Input size="sm" value={draft[c.key] == null ? "" : draft[c.key]}
                    placeholder="2026.04" maxLength={7}
                    error={errors[c.key] || undefined} style={{ width: 96 }}
                    onChange={e => {
                      setDraft(d => ({ ...d, [c.key]: e.target.value }));
                      setErrors(x => { const n = { ...x }; delete n[c.key]; return n; });
                    }} />
                  {errors[c.key] ? (
                    <p style={{ marginTop: 4, fontSize: "var(--fs-micro)", color: "var(--state-danger)" }}>
                      {errors[c.key]}
                    </p>
                  ) : null}
                </div>
              );
            } },
          { key: "phrase", label: "시민 화면 노출 문구",
            render: c => {
              const p = asOfPhrase(c, draft[c.key]);
              return p
                ? <span style={{ color: "var(--text-body)" }}>{p}</span>
                : <span style={{ color: "var(--text-muted)" }}>노출하지 않습니다</span>;
            } },
        ]} />

      {/* 안내는 고치는 동안에만 세운다. 읽으러 온 사람에게 할 말이 없다 —
          기준일을 두지 않는 두 카테고리의 사유는 표의 [원천] 칸이 이미 적고 있다 */}
      {editing ? (
        <Notice tone="warning" size="sm" style={{ marginTop: "var(--space-5)" }}>
          입력 형식은 <b>YYYY.MM</b> 입니다 (예: 2026.04).
          <b>제출하면 그 카테고리의 시민용 상세 페이지 전체에 곧바로 반영됩니다.</b>
        </Notice>
      ) : null}

      {/* 제출 확인 — 바뀐 줄만, 「무엇이 무엇으로」 */}
      <Modal open={!!asking} size="md" title="데이터 기준일을 바꿉니다"
        description="아래 값이 시민용 상세 페이지 하단에 그대로 나갑니다."
        onClose={() => setAsking(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(null)}>취소</Button>
            <Button variant="primary" icon="check" onClick={confirmSubmit}>제출</Button>
          </>
        }>
        {asking ? (
          <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {asking.map(x => (
              <li key={x.label} style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)",
                fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
                <span style={{ minWidth: 130, fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
                  {x.label}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-muted)",
                  textDecorationLine: "line-through" }}>{x.from || "미설정"}</span>
                <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>→</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: "var(--fw-bold)",
                  color: "var(--brand-primary)" }}>{x.to}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </>
  );
}

export default DataAsOf;
