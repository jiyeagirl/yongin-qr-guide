import React from "react";
import { Modal, Button, FileField } from "../../design-systems/admin.js";

/* 엑셀 일괄 등록 다이얼로그 — **점포(M05) 하나가 쓴다.**
 *
 * 처음에는 골목형 상점가(M03)도 함께 썼는데, 그쪽은 같은 날 **폼 등록**으로 바뀌었다
 * (2026-09-04, 사용자 요청). 가르는 것은 자료의 성격이 아니라 **한 번에 몇 줄이
 * 오는가**다 — 새 상점가는 한 달에 두세 곳이라 한 건씩 폼으로 받는 편이 짧고(축제·코스와
 * 같다), 점포는 둔전 한 곳이 335줄이라 그럴 수가 없다.
 *
 * **부르는 곳이 하나가 되었어도 화면 파일 밖에 남긴다.** 여기 있는 것은 목록 화면의
 * 사정이 아니라 **창의 규칙**이다(닫으면 파일을 버린다 · [업로드]를 흐리게 두지 않는다 ·
 * 파일 검사는 칸이 한다). 그것을 `Stores.jsx` 안에 풀어 놓으면 335곳을 다루는 목록 코드
 * 사이에 묻히고, 다음에 다른 화면이 파일을 받게 될 때 그 규칙이 따라가지 않는다.
 *
 * ── 창을 닫으면 고른 파일을 버린다 ─────────────────────────────────────────
 * 다시 열었을 때 지난번 파일이 남아 있으면, 담당자는 그것을 **방금 고른 것**으로 읽고
 * [업로드]를 누른다. 파일 이름이 대개 비슷하게 생겨서(둔전_점포_0902.xlsx) 눈으로
 * 가려지지도 않는다.
 *
 * ── [업로드]를 흐리게 두지 않는다 ──────────────────────────────────────────
 * 파일을 고르기 전에도 눌린다. 흐린 단추는 **못 누른다는 것만 말하고 왜인지는 말하지
 * 않는데**(축제 폼의 [추가]에서 같은 결론에 닿았다 — 명세서 v1.23), 여기서 담당자가
 * 그 이유를 잘못 짚기 쉽다: 「파일을 아직 안 골랐다」가 아니라 「이 계정은 일괄 등록을
 * 못 한다」로 읽는다. 눌리게 두고 무엇이 빠졌는지 그 자리에 적는다.
 *
 * ── 파일 칸 **위**가 열려 있다 (`children`, 2026-09-04) ─────────────────────
 * 점포 창이 「소속 골목형 상점가」 고르개를 세우는 자리다 (Stores.jsx). 파일보다 위인
 * 이유는 그것이 **파일을 고르기 전에 정해지는 값**이기 때문이다 — 어느 상점가 파일인지는
 * 파일을 손에 들 때 이미 알고 있고, 아래에 두면 다 골라 놓고 [업로드]를 누른 뒤에야
 * 빠진 것을 알게 된다. 넘기지 않으면 파일 칸 하나다 — 슬롯을 그대로 둔 이유는 이 창을
 * 쓰는 화면이 지금 하나이더라도 **파일 앞에 물어야 할 것이 화면마다 다르기** 때문이다.
 *
 * ── 그 칸을 고르기 전에는 **파일 칸이 잠긴다** (`blocked`, 2026-09-04) ────────
 * 넘긴 쪽이 이유를 문장으로 준다(「시설 유형을 먼저 선택해주세요.」). 잠그는 이유는
 * 순서가 실제로 있기 때문이다 — 시설은 **유형마다 항목표가 통째로 다르고**(AED 2항목 ·
 * 화장실 10항목) 점포는 **소속이 파일 밖에서 정해진다.** 고르지 않은 채 올린 파일은
 * 어느 표로 읽어야 하는지, 어디로 넣어야 하는지가 정해지지 않는다.
 *
 * **잠그기만 하고 왜인지 말하지 않는 상태는 만들지 않는다** — 이유는 `FileField` 가 칸
 * 안에 적고, [업로드]를 눌러 그 이유로 막히면 **같은 줄이 붉어진다.** 그래서 이 창은
 * 파일 검사보다 `blocked` 를 **먼저** 본다: 잠긴 칸을 두고 「파일을 먼저 골라 주세요」는
 * 고를 수 없는 것을 고르라는 말이 된다.
 */
export function BulkUploadModal({ open, title, description, children, blocked, onClose, onUpload }) {
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) return;
    setFile(null);
    setError("");
  }, [open]);

  const pick = f => { setFile(f); setError(""); };

  /* 막힌 이유가 먼저다 (2026-09-04) — 위 칸을 고르기 전에는 파일 칸이 잠겨 있으므로,
     그 상태에서 「파일을 먼저 골라 주세요」라고 답하면 **고를 수 없는 것을 고르라는 말**이
     된다. `blocked` 를 그대로 오류로 넘기면 파일 칸 안에 안내로 서 있던 그 문장이 붉어진다
     (FileField 가 같은 문장을 두 번 적지 않는다) */
  const submit = () => {
    if (blocked) { setError(blocked); return; }
    if (!file) { setError("올릴 엑셀 파일을 먼저 골라 주세요."); return; }
    if (onUpload) onUpload(file);
  };

  return (
    <Modal open={open} size="md" title={title} description={description} onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button variant="primary" icon="upload" onClick={submit}>업로드</Button>
        </>
      }>
      {children ? (
        <div style={{ marginBottom: "var(--space-4)" }}>{children}</div>
      ) : null}

      {/* 열 이름과 양식 규칙을 여기에 적지 않는 이유는 **아직 정해지지 않았기 때문**이다 —
          읽는 쪽(파서)이 없는 상태에서 「첫 줄은 열 이름」 같은 규칙을 화면에 적으면,
          그것이 어디에도 없는 규칙인 채로 담당자에게는 약속이 된다. 양식 파일과 열
          규칙은 다음 판이다. */}
      <FileField accept=".xlsx,.xls" file={file} onChange={pick} error={error} blocked={blocked} />
    </Modal>
  );
}

export default BulkUploadModal;
