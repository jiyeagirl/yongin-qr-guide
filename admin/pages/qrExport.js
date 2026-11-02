/* QR 지점 출력 — 인쇄 · SVG 내려받기 (2026-11-02, 사용자 요청. 같은 날 넣었던 CSV 저장은 빠졌다).
 *
 * QR 지점 관리의 세 자리가 같은 함수를 부른다: 수정 창의 QR 코드 판, [QR] 보기의 카드 창,
 * 그리고 체크박스로 고른 여러 건의 선택 액션바. 한 건이든 열두 건이든 같은 모양으로 나온다.
 *
 * ── 서버가 없어 화면이 흉내 내는 것 ─────────────────────────────────────────
 * - **QR 그림은 모든 지점이 같은 자리표시 그림이다** (`QR_IMAGE`). 코드를 그림으로 인코딩하는
 *   일은 개발 쪽이고(qrCodes.js 머리말), 실연동 때는 지점별 SVG 를 서버에서 받는다.
 *   여기서 바꿀 것은 `svgFor` 하나다.
 * - **QR 주소는 이 저장소의 시민 화면 주소다** (`/screens/main/?qr=…`). 실서버는 자기 도메인의
 *   짧은 주소를 쓴다.
 * - **여러 건 SVG 는 파일을 하나씩 내려받는다.** 묶어 줄 압축 라이브러리가 없다. 브라우저가
 *   처음 한 번 「여러 파일 다운로드 허용」을 묻는다.
 */

export const QR_IMAGE = "./assets/qr-placeholder.svg";

export function qrUrl(code) {
  return `${location.origin}/screens/main/?qr=${encodeURIComponent(code)}`;
}

let svgText = null;
function svgFor(/* code */) {
  if (!svgText) svgText = fetch(QR_IMAGE).then(r => r.text());
  return svgText;
}

function save(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/* items: [{ code, name, url }] — 화면이 표의 값으로 채워 넘긴다 (QrPoints 의 toItem) */
export async function downloadSvgs(items) {
  for (let i = 0; i < items.length; i++) {
    const svg = await svgFor(items[i].code);
    save(new Blob([svg], { type: "image/svg+xml" }), `${items[i].code}.svg`);
    /* 한꺼번에 누르면 브라우저가 앞의 몇 개만 받고 나머지를 떨어뜨린다 */
    if (i < items.length - 1) await wait(250);
  }
}

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* 인쇄 — 보이지 않는 iframe 에 인쇄용 쪽을 그려 그 창만 인쇄한다. 새 창(window.open)을
   쓰지 않는 이유: 팝업 차단에 걸리면 단추가 아무 일도 하지 않은 것처럼 보인다.
   A4 한 장에 3 × 4 = 12장. 한 장이면 가운데 크게 선다 */
export async function printQrs(items) {
  if (!items.length) return;
  const svg = await svgFor();
  const single = items.length === 1;
  const cards = items.map(it => `
    <figure class="card">
      <div class="qr">${svg}</div>
      <figcaption>
        <strong>${esc(it.name)}</strong>
        <span class="code">${esc(it.code)}</span>
        <span class="url">${esc(it.url)}</span>
      </figcaption>
    </figure>`).join("");
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>QR 인쇄</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Pretendard", system-ui, sans-serif; color: #1f2a24; }
  .grid { display: grid; grid-template-columns: ${single ? "1fr" : "repeat(3, 1fr)"}; gap: 6mm; }
  .card { margin: 0; padding: ${single ? "16mm" : "5mm"}; border: 0.3mm dashed #b8c2bc; border-radius: 3mm;
    text-align: center; break-inside: avoid; }
  .qr svg { width: ${single ? "110mm" : "100%"}; height: auto; display: block; margin: 0 auto; }
  figcaption { display: flex; flex-direction: column; gap: 1mm; margin-top: 3mm; }
  strong { font-size: ${single ? "16pt" : "10pt"}; word-break: keep-all; }
  .code { font-size: ${single ? "13pt" : "9pt"}; color: #2f9260; }
  .url { font-size: ${single ? "9pt" : "6.5pt"}; color: #5b6a62; word-break: break-all; }
</style></head><body><div class="grid">${cards}</div></body></html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open(); doc.write(html); doc.close();
  await wait(100);
  frame.contentWindow.focus();
  frame.contentWindow.print();
  /* print() 는 인쇄 대화상자가 닫힐 때까지 돌아오지 않는 브라우저가 많다. 그 뒤에 치운다 */
  setTimeout(() => frame.remove(), 1000);
}
