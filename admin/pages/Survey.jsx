import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, Button, Select, Badge, Pagination, InfoList, StatTile, Notice,
  SURVEY_SCALE, EMPTY_MARK,
} from "../../design-systems/admin.js";
import {
  readSurveyResponses, itemName, qrName, formatAt, PAGE_TYPE_LABEL,
} from "../data/surveys.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";

/* 사용자 만족도 조사 (2026-11-09, 사용자 요청).
 *
 * 시민 화면의 만족도 카드(docs/spec/citizen-survey.md)로 들어온 응답을 **보기만** 한다. 응답은 시민이 만든
 * 기록이라 [등록]도 [삭제]도 없다 — 오류신고 관리와 같은 이유다.
 *
 * 한 줄에 서는 값은 시민 화면이 응답과 함께 남기는 것 그대로다:
 *   응답 일시 · 응답 값 · 페이지 유형과 항목(ID) · QR 유입 위치 · 이유(고르게 쓴 것)
 * URL 파라미터 원문 · 어느 때 떴는지 같은 나머지는 줄을 눌러 여는 상세에 둔다.
 *
 * 위 네 칸(응답 수 · 평균 · 만족 비율 · 이유 작성)과 점수 분포는 **지금 걸린 필터**를 따른다 —
 * 「축제 페이지에서 받은 점수」처럼 좁혀 보는 것이 이 화면을 여는 이유다.
 */

const SCALE = Object.fromEntries(SURVEY_SCALE.map(s => [s.value, s]));
const VALUE_TONE = { 1: "danger", 2: "warning", 3: "neutral", 4: "success", 5: "success" };

const opt = (pairs, all) => [{ value: "", label: all }].concat(pairs.map(([value, label]) => ({ value: String(value), label })));

function ValueCell({ value }) {
  const s = SCALE[value];
  if (!s) return EMPTY_MARK;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{s.emoji}</span>
      <Badge tone={VALUE_TONE[value]} size="sm">{value} · {s.label}</Badge>
    </span>
  );
}

export function Survey() {
  const rows = React.useMemo(() => readSurveyResponses(), []);
  const [pageType, setPageType] = React.useState("");
  const [value, setValue] = React.useState("");
  const [qr, setQr] = React.useState("");
  const list0 = useListState([pageType, value, qr]);
  const [open, setOpen] = React.useState(null);

  const qrOptions = React.useMemo(() => {
    const codes = Array.from(new Set(rows.map(r => r.qr).filter(Boolean))).sort();
    return codes.map(c => [c, qrName(c) ? `${c} ${qrName(c)}` : c]);
  }, [rows]);

  const filtered = React.useMemo(() => rows
    .filter(r => {
      if (pageType && r.pageType !== pageType) return false;
      if (value && String(r.value) !== value) return false;
      if (qr && r.qr !== qr) return false;
      if (!list0.term) return true;
      const name = itemName(r.pageType, r.itemId) || "";
      return name.includes(list0.term) || String(r.comment || "").includes(list0.term);
    })
    .sort((a, b) => String(b.answeredAt).localeCompare(String(a.answeredAt))),
  [rows, pageType, value, qr, list0.term]);

  const paged = list0.paginate(filtered);

  const total = filtered.length;
  const avg = total ? filtered.reduce((s, r) => s + (Number(r.value) || 0), 0) / total : 0;
  const good = filtered.filter(r => r.value >= 4).length;
  const commented = filtered.filter(r => r.comment).length;
  const dist = SURVEY_SCALE.map(s => ({ ...s, count: filtered.filter(r => r.value === s.value).length }));
  const maxCount = Math.max(1, ...dist.map(d => d.count));
  const localCount = rows.filter(r => r.source === "local").length;

  return (
    <>
      <PageHeader title="사용자 만족도 조사" count={`${total}건`} />

      <Notice size="sm" style={{ marginBottom: "var(--space-5)" }}>
        서버 연동 전이라 예시 응답과, 이 브라우저에서 사용자 화면으로 제출한 응답(「이 브라우저」 표시{localCount ? ` ${localCount}건` : ""})을 함께 보여줍니다.
      </Notice>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--space-4)" }}>
        <StatTile label="응답 수" value={total.toLocaleString("ko-KR")} unit="건" icon="inbox" tone="brand" />
        <StatTile label="평균 만족도" value={total ? avg.toFixed(1) : "-"} unit="/ 5" icon="smile" />
        <StatTile label="만족 비율 (만족 · 매우 만족)" value={total ? Math.round((good / total) * 100) : "-"} unit="%" icon="heart" />
        <StatTile label="이유 작성" value={commented.toLocaleString("ko-KR")} unit="건" icon="message-square" />
      </div>

      {/* 점수 분포 — 5단계 막대 */}
      <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4) var(--space-5)",
        border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-card)",
        background: "var(--surface-card)", display: "grid", gap: "var(--space-2)" }}>
        {dist.slice().reverse().map(d => (
          <div key={d.value} style={{ display: "grid", gridTemplateColumns: "150px 1fr 72px", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-label)", color: "var(--text-body)" }}>
              <span aria-hidden="true" style={{ fontSize: 18 }}>{d.emoji}</span>{d.label}
            </span>
            <span style={{ height: 10, borderRadius: "var(--radius-pill)", background: "var(--surface-sunken)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(d.count / maxCount) * 100}%`,
                background: d.value >= 4 ? "var(--brand-primary)" : d.value === 3 ? "var(--yong-ink-300)" : "var(--state-warning)" }} />
            </span>
            <span style={{ textAlign: "right", fontSize: "var(--fs-label)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {d.count}건 {total ? `(${Math.round((d.count / total) * 100)}%)` : ""}
            </span>
          </div>
        ))}
      </div>

      <Toolbar style={{ marginTop: "var(--space-6)" }}>
        <Select value={pageType} options={opt(Object.entries(PAGE_TYPE_LABEL), "전체 페이지 유형")}
          onChange={e => setPageType(e.target.value)} />
        <Select value={value} options={opt(SURVEY_SCALE.slice().reverse().map(s => [s.value, `${s.emoji} ${s.label}`]), "전체 응답 값")}
          onChange={e => setValue(e.target.value)} />
        <Select value={qr} options={opt(qrOptions, "전체 QR 유입 위치")} onChange={e => setQr(e.target.value)} />
        <ListSearch state={list0} placeholder="항목명, 이유 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="만족도 조사 응답 목록"
        rows={paged.rows} rowKey="id" onRowClick={setOpen}
        fixed
        empty={{ title: "조건에 맞는 응답이 없습니다." }}
        columns={[
          { key: "answeredAt", label: "응답 일시", width: 140, sortable: true,
            render: r => (
              <span style={{ whiteSpace: "nowrap" }}>
                {formatAt(r.answeredAt)}
              </span>
            ) },
          { key: "value", label: "응답 값", width: 150, sortable: true,
            render: r => <ValueCell value={r.value} /> },
          { key: "pageType", label: "페이지 유형", width: 92, sortable: true,
            render: r => PAGE_TYPE_LABEL[r.pageType] || EMPTY_MARK },
          { key: "itemId", label: "항목 (ID)", width: 190,
            render: r => r.itemId ? (
              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {itemName(r.pageType, r.itemId) || "이름 없음"}
                <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{r.itemId}</span>
              </span>
            ) : EMPTY_MARK },
          { key: "qr", label: "QR 유입 위치", width: 170, sortable: true,
            render: r => r.qr ? (
              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.qr}<span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{qrName(r.qr) || ""}</span>
              </span>
            ) : EMPTY_MARK },
          { key: "comment", label: "이유",
            render: r => r.comment ? (
              <span style={{ display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.comment}
              </span>
            ) : EMPTY_MARK },
          { key: "source", label: "구분", width: 96, align: "center",
            render: r => r.source === "local"
              ? <Badge tone="info" size="sm">이 브라우저</Badge>
              : <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-label)" }}>예시</span> },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <Modal open={!!open} size="md" onClose={() => setOpen(null)}
        title={open ? `만족도 응답 · ${SCALE[open.value] ? SCALE[open.value].label : open.value}` : ""}
        description={open ? `${formatAt(open.answeredAt)} 응답` : undefined}
        footer={<Button variant="ghost" onClick={() => setOpen(null)}>닫기</Button>}>
        {open ? (
          <InfoList items={[
            { label: "응답 값", value: <ValueCell value={open.value} /> },
            { label: "페이지 유형", value: PAGE_TYPE_LABEL[open.pageType] || null },
            { label: "항목", value: open.itemId ? `${itemName(open.pageType, open.itemId) || "이름 없음"} (${open.itemId})` : null },
            { label: "QR 유입 위치", value: open.qr ? `${open.qr}${qrName(open.qr) ? ` · ${qrName(open.qr)}` : ""}` : null },
            { label: "URL 파라미터", value: open.entryParams || "(없음 — 기본 진입)" },
            { label: "응답 일시", value: formatAt(open.answeredAt) },
            { label: "이유", value: open.comment ? <span style={{ whiteSpace: "pre-line" }}>{open.comment}</span> : null },
          ]} />
        ) : null}
      </Modal>
    </>
  );
}

export default Survey;
