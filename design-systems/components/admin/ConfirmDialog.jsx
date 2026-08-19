import React from "react";
import { Modal } from "./Modal.jsx";
import { Button } from "../core/Button.jsx";

/* 되돌릴 수 없는 일을 하기 전에 한 번 묻는다 — 삭제, 노출 중단.
 *
 * ── 무엇을 지우는지 이름으로 적는다 ─────────────────────────────────────────
 * "정말 삭제하시겠습니까?" 만 띄우면 담당자는 자기가 어느 행을 눌렀는지 확인할 방법이
 * 없다. 335곳짜리 목록에서 한 칸 어긋나게 누르는 일은 드물지 않고, 그때 이 문장은
 * 아무 것도 막지 못한다. `name` 을 굵게 적어 되묻는 문장 안에 넣는다.
 *
 * ── 주 버튼이 [삭제]다 ──────────────────────────────────────────────────────
 * 확인 대화상자에서 취소를 주 버튼으로 두는 관행이 있지만, 여기서는 담당자가
 * **이미 삭제를 누르고 들어왔다.** 하려던 일을 다시 한 번 찾게 만들 이유가 없다.
 * 대신 danger 색으로 그것이 되돌릴 수 없는 일임을 말한다.
 */
export function ConfirmDialog({
  open, title = "삭제할까요?", name, description,
  confirmLabel = "삭제", tone = "danger",
  onConfirm, onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>취소</Button>
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
      <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-label)", color: "var(--text-muted)", lineHeight: 1.6 }}>
        삭제하면 시민용 화면에서도 즉시 사라집니다. 되돌릴 수 없습니다.
      </p>
    </Modal>
  );
}

export default ConfirmDialog;
