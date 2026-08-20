import React from "react";
import { Modal, ConfirmDialog, Button } from "../../design-systems/admin.js";

/* 등록·수정 다이얼로그 한 벌 — 아홉 화면이 같은 것을 쓴다.
 *
 * Modal 을 화면마다 직접 세우면 footer 의 버튼 차례([취소]가 왼쪽인지 오른쪽인지)와
 * 제목 문구("… 등록" / "… 추가")가 화면마다 조금씩 달라진다. 담당자는 그 차이를 말로
 * 설명하지 못하면서 "화면이 뭔가 다르다"고 느낀다.
 *
 * ── 이탈 확인이 여기 있는 이유 ──────────────────────────────────────────────
 * 명세서 1장의 "수정 중 이탈 시 확인"인데, 이것은 **다이얼로그의 성질**이지 화면의
 * 성질이 아니다 — 어느 폼에서 나가든 잃는 것은 같다. 판단(dirty)은 useRecordEditor 가,
 * 묻는 일은 여기가 한다.
 *
 * 확인 다이얼로그를 Modal 위에 겹치지 않고 **폼을 닫으면서 대신 띄운다.** 겹치면
 * ESC 가 둘을 한꺼번에 닫는다 (두 리스너가 같은 document 에 걸린다).
 */
export function EditorModal({
  ed, title, description, size = "lg", children,
  saveLabel = "저장", extraFooter,
}) {
  return (
    <>
      <Modal open={!!ed.draft && !ed.leaving} size={size} onClose={ed.close}
        title={title} description={description}
        footer={
          <>
            {extraFooter}
            <Button variant="ghost" onClick={ed.close}>취소</Button>
            <Button variant="primary" onClick={ed.save}>{saveLabel}</Button>
          </>
        }>
        {ed.draft ? children : null}
      </Modal>

      <ConfirmDialog open={!!ed.leaving} title="저장하지 않고 닫을까요?"
        description="고친 내용이 사라집니다."
        footnote="저장하려면 [계속 편집]으로 돌아가 [저장]을 눌러 주세요."
        confirmLabel="닫기" cancelLabel="계속 편집" tone="danger"
        onClose={ed.cancelLeave} onConfirm={ed.discard} />
    </>
  );
}

export default EditorModal;
