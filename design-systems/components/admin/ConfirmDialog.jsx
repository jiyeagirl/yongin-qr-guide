import React from "react";
import { Modal } from "./Modal.jsx";
import { Button } from "../core/Button.jsx";

/* 되돌리기 어려운 일을 하기 전에 한 번 묻는다 — 삭제, 저장하지 않고 닫기, 일괄 처리.
 *
 * ── 무엇을 지우는지 이름으로 적는다 ─────────────────────────────────────────
 * "정말 삭제하시겠습니까?" 만 띄우면 담당자는 자기가 어느 행을 눌렀는지 확인할 방법이
 * 없다. 335곳짜리 목록에서 한 칸 어긋나게 누르는 일은 드물지 않고, 그때 이 문장은
 * 아무 것도 막지 못한다. `name` 을 굵게 적어 되묻는 문장 안에 넣는다.
 * (명세서 1장 공통 규격 — "삭제 시 대상 명칭 포함 확인 모달")
 *
 * ── 주 버튼이 [삭제]다 ──────────────────────────────────────────────────────
 * 확인 대화상자에서 취소를 주 버튼으로 두는 관행이 있지만, 여기서는 담당자가
 * **이미 삭제를 누르고 들어왔다.** 하려던 일을 다시 한 번 찾게 만들 이유가 없다.
 * 대신 danger 색으로 그것이 되돌리기 어려운 일임을 말한다.
 *
 * ── 아래 한 줄(footnote)을 고정하지 않는다 ──────────────────────────────────
 * 전에는 "되돌릴 수 없습니다"가 붙박이였다. 두 가지가 틀렸다:
 *   1. 이 상자는 삭제 말고 다른 것도 묻는다 (저장하지 않고 닫기, 일괄 상태 변경).
 *      거기에 삭제 문구가 붙으면 그 자리에서 거짓말이 된다.
 *   2. 명세서 10장이 **물리 삭제를 금지한다** — `is_deleted` 플래그이므로 서버에서는
 *      되돌릴 수 있다. 화면에서 사라지는 것은 맞지만 "되돌릴 수 없다"는 사실이 아니다.
 * 기본 문구는 삭제용으로 두되, 화면이 다른 말을 넘길 수 있게 열어 둔다.
 */
const DELETE_NOTE = "삭제하면 시민용 화면에서 즉시 사라집니다. "
  + "자료가 틀린 것이 아니라 폐업·폐쇄를 확인한 경우라면, 삭제 대신 노출 여부를 끄는 편이 맞습니다 "
  + "— 삭제한 항목은 다음 데이터 갱신 시 되살아납니다 (명세서 10장).";

export function ConfirmDialog({
  open, title = "삭제할까요?", name, description,
  confirmLabel = "삭제", cancelLabel = "취소", tone = "danger",
  footnote = DELETE_NOTE,
  onConfirm, onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
        {name ? (
          <>
            <b style={{ color: "var(--text-heading)" }}>{name}</b>
            {description ? <> {description}</> : <> 항목을 삭제합니다.</>}
          </>
        ) : description}
      </p>
      {footnote ? (
        <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-label)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {footnote}
        </p>
      ) : null}
    </Modal>
  );
}

export default ConfirmDialog;
