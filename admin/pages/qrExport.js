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

import { ASSET_BASE } from "../data/assets.js";

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

/* ── 인쇄 = A7 아크릴 거치대용 QR 안내 카드 (2026-11-02, 사용자 요청) ─────────────
   종전에는 A4 세로에 3 × 4 판(한 건이면 한 장 크게)이었다. 지금은 **거치대(외부 84×109mm)에
   넣는 74×105mm 세로 카드**를 A4 세로에 2열 × 2줄 = 4장씩 앉히고, 4장이 넘으면 다음 쪽으로
   잇는다. 한 건이어도 같은 카드 한 장이다(거치대에 들어가는 크기가 하나뿐이다).

   - **카드는 실제 크기 74 × 105mm, 한 쪽에 4장(A4 세로 2 × 2)이다.** 판이 148 × 210mm 라
     좌우 31mm · 위아래 43.5mm 가 남아 프린터의 인쇄 불가 여백에 걸리지 않는다. 같은 날
     A4 가로 4 × 2 = 8장(92% 축소 → 실제 크기)을 거쳤다 — 실제 크기 8장은 296 × 210mm 로
     종이를 꽉 채워 가장자리가 잘린다. 사용자 요청으로 「실제 크기 · 4장」에 섰다. A4 가로에
     4장을 놓는 배치(4 × 1, 2 × 2)는 어느 쪽이든 한 변이 종이 끝에 닿아 세로를 쓴다.
   - **카드 사이는 붙어 있고 재단선은 하나다** — 점선 한 줄을 자르면 양쪽 카드가 함께 나온다.
   - 글자와 QR 은 카드 가장자리에서 **5mm 안쪽**(재단 오차 대비 최소 4mm).
   - **QR 은 순수 검정(#000)으로 칠한다** — 받은 SVG 의 흰색이 아닌 채움을 전부 바꾼다. 아크릴
     반사 아래서 인식률을 지키려는 것이라, 실연동 SVG 가 무슨 색으로 오든 같다.
   - **색 · 글꼴은 디자인 시스템 토큰이다** — 인쇄 쪽은 별도 문서라 `tokens/` 의 :root 파일
     (fonts · colors · radius · typography)을 그대로 걸고 `var(--…)` 로 쓴다. 포인트 색은
     `--brand-primary`(녹색) 하나: 상점명 밑 짧은 줄. 안내 문구 바탕은 `--surface-brand-soft`.
     처음에는 빨강(`--yong-red-500`)이었다가 같은 날 바꿨다(사용자 요청) — 빨강은
     `--pin-emergency` 몫이라 장식에 쓰지 않는다(README 「Colour」).
   - **조아용 한 마리** (사용자 요청) — 안내 상자 모서리에 정면 서 있는 포즈(`front`)를 16mm(60px)로,
     안내 상자 오른쪽 위 모서리에 걸쳐 세운다(아래 .mascot).
     README 「Character vs icon」 대로 PNG 그대로 쓰고 자르거나 색을 바꾸지 않는다. 그림은
     `ASSET_BASE`(data/assets.js)에서 읽는다 — Mascot · AssetPicker 와 같은 자리다.
   - 상점명은 한 줄이다. 길면 글자를 줄여 맞추고(18pt → 9pt), 그래도 넘치면 말줄임.
   - 인쇄 배율: `@page { size: A4 portrait; margin: 0 }` 이면 크롬 · 엣지는 기본값이 100% 다.
     「용지에 맞춤」을 CSS 로 막을 수는 없어서 미리보기 띠가 그 점을 적는다. */
const CARD_W = 74;
const CARD_H = 105;
const COLS = 2;
const PER_SHEET = 4;
const MASCOT_POSE = "front";
const dsUrl = path => new URL(ASSET_BASE + path, location.href).href;
const TOKEN_CSS = ["fonts", "colors", "radius", "typography"].map(t => dsUrl(`tokens/${t}.css`));

const blackQr = svg => svg.replace(/fill="(?!#fff"|#ffffff"|white"|none")[^"]*"/gi, 'fill="#000"');

function cardHtml(it, svg) {
  /* 상점가 종류의 지점은 이름이 곧 상점가 이름이라 윗줄을 되풀이하지 않는다 */
  const district = it.district && it.district !== it.name ? it.district : "";
  return `
    <article class="card">
      <header>
        <p class="district">${esc(district) || "&nbsp;"}</p>
        <h2 class="name">${esc(it.name)}</h2>
        <span class="rule" aria-hidden="true"></span>
      </header>
      <div class="qr">${svg}</div>
      <div class="guide">
        <p class="title">매일 지나던 동네의 새로운 발견!</p>
        <p class="sub">QR을 찍고 골목 곳곳의 가게와<br>특별한 소식을 만나보세요.</p>
        <img class="mascot" src="${dsUrl(`assets/character/joayong-${MASCOT_POSE}.png`)}" alt="">
      </div>
    </article>`;
}

function sheetHtml(items, svg) {
  const sheets = [];
  for (let i = 0; i < items.length; i += PER_SHEET) {
    sheets.push(`<section class="sheet"><div class="grid">${items.slice(i, i + PER_SHEET).map(it => cardHtml(it, svg)).join("")}</div></section>`);
  }
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>QR 안내 카드</title>
${TOKEN_CSS.map(h => `<link rel="stylesheet" href="${h}">`).join("")}
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; }
  body { font-family: var(--font-sans), "Noto Sans KR"; color: var(--text-heading);
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center;
    background: #fff; break-after: page; overflow: hidden; }
  .sheet:last-child { break-after: auto; }
  /* 재단선 — 카드마다 오른쪽 · 아래, 첫 줄은 위, 첫 열은 왼쪽. 붙은 카드 사이에 선이 한 줄만
     서고, 덜 찬 마지막 쪽에서도 빈 칸 위로 선이 이어지지 않는다 */
  .grid { display: grid; grid-template-columns: repeat(${COLS}, ${CARD_W}mm); grid-auto-rows: ${CARD_H}mm;
    align-content: start; height: ${CARD_H * (PER_SHEET / COLS)}mm; }
  .card { display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 5mm; text-align: center; background: #fff;
    border-right: 0.2mm dashed var(--border-strong); border-bottom: 0.2mm dashed var(--border-strong); }
  .card:nth-child(-n+${COLS}) { border-top: 0.2mm dashed var(--border-strong); }
  .card:nth-child(${COLS}n+1) { border-left: 0.2mm dashed var(--border-strong); }
  header { width: 100%; display: flex; flex-direction: column; align-items: center; }
  .district { margin: 0; font-size: 7.5pt; line-height: 1.3; color: var(--text-muted); letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  /* 줄 높이는 mm 로 묶는다 — 긴 이름이 글자를 줄여도 QR 이 카드마다 같은 높이에 선다 */
  .name { margin: 1mm 0 0; width: 100%; font-size: 18pt; font-weight: 800; line-height: 8mm;
    letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rule { display: block; width: 9mm; height: 0.8mm; margin-top: 1.6mm; border-radius: var(--radius-pill); background: var(--brand-primary); }
  /* QR = 카드 폭의 65%. 둘레 3mm 는 흰 여백(그림 자체의 여백과 별개) — 줄 · 글자가 붙지 않는다 */
  .qr { width: ${(CARD_W * 0.65 + 6).toFixed(2)}mm; padding: 3mm; background: #fff; }
  .qr svg { display: block; width: 100%; height: auto; aspect-ratio: 1 / 1; }
  /* 안내 = 제목(굵게, 한 줄) + 설명 두 줄. 조아용은 줄에 서지 않고 **상자 오른쪽 위 모서리에 걸쳐**
     선다 — 발은 상자 안, 머리는 상자 위로 4mm (사용자 요청 「꼭 그 칸 안에 있을 필요는 없어」).
     줄에서 빠진 덕에 크기는 README 의 일러스트 하한 16mm(60px)로 돌아왔다. 상자 위로 나온 머리가
     QR 의 흰 여백을 먹지 않도록 상자는 QR 아래 4mm 이상 떨어진다(.guide margin-top). 오른쪽은
     **보이는 그림**이 카드 가장자리에서 4.4mm — PNG 오른쪽 2.4mm 가 투명이라 그림 상자는 3.3mm
     내민다(사용자 요청으로 오른쪽으로 옮겼다). 글은 조아용 자리를 비운 칸의 가운데, 같은 까닭으로
     왼쪽 여백을 오른쪽보다 넓게 둔다. */
  .guide { position: relative; width: 100%; margin-top: 4mm; padding: 2.4mm 10mm 2.4mm 4.5mm;
    border-radius: var(--radius-sm); background: var(--surface-brand-soft); text-align: center; }
  .guide p { margin: 0; }
  .title { width: 100%; overflow: hidden; white-space: nowrap; font-size: 11pt; font-weight: 800;
    line-height: 1.25; letter-spacing: -0.03em; color: var(--text-heading); }
  .sub { margin-top: 1.4mm !important; white-space: nowrap; font-size: 8.5pt; font-weight: 600; line-height: 1.75;
    letter-spacing: -0.02em; color: var(--text-body); }
  .mascot { position: absolute; top: -4mm; right: -3.3mm; width: 16mm; height: 16mm; object-fit: contain; }
  @media screen {
    html { background: #d9dcda; }
    body { background: transparent; padding: 24px 0; }
    .sheet { margin: 0 auto 24px; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
  }
</style></head><body>${sheets.join("")}</body></html>`;
}

/* 한 줄에 맞춘다 — 넘치는 동안 0.5pt 씩 줄이고, min 에서 멈춘다(그 뒤는 말줄임).
   상점명(18 → 9pt)과 안내 제목(11 → 9pt)이 쓴다 */
function fitText(doc, selector, max, min) {
  doc.querySelectorAll(selector).forEach(el => {
    let pt = max;
    el.style.fontSize = pt + "pt";
    while (el.scrollWidth > el.clientWidth && pt > min) {
      pt -= 0.5;
      el.style.fontSize = pt + "pt";
    }
  });
}

/* 인쇄 — 먼저 화면 위에 **인쇄 미리보기**를 띄운다(쪽이 실제 A4 세로 모양으로 선다). 띠의
   [인쇄]가 그 iframe 만 인쇄한다. 새 창(window.open)을 쓰지 않는 이유: 팝업 차단에 걸리면
   단추가 아무 일도 하지 않은 것처럼 보인다. 미리보기 창은 React 밖의 DOM 이다 — 세 자리
   (수정 창 · 카드 창 · 선택 액션바)가 같은 함수 하나를 부르고, 모달 위에도 떠야 해서다 */
export async function printQrs(items) {
  if (!items.length) return;
  const svg = blackQr(await svgFor());
  const pages = Math.ceil(items.length / PER_SHEET);

  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "QR 안내 카드 인쇄 미리보기");
  overlay.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:rgba(22,34,28,.42)";
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;background:#fff;border-bottom:1px solid #d9dcda;font:14px/1.4 'Pretendard Variable',Pretendard,sans-serif;color:#1f2a24">
      <strong style="font-size:16px">인쇄 미리보기</strong>
      <span>A7 거치대 카드 ${items.length}장 · A4 세로 ${pages}쪽 (한 쪽 ${PER_SHEET}장)</span>
      <span style="color:#5b6a62">인쇄 창에서 배율은 <b>기본값(100%)</b>, 「용지에 맞춤」은 끄고 찍어 주세요. 카드는 실제 크기 ${CARD_W} × ${CARD_H}mm 로 나옵니다.</span>
      <span style="flex:1"></span>
      <button type="button" data-act="print" style="padding:8px 16px;border-radius:8px;border:0;background:#2f9260;color:#fff;font:inherit;font-weight:700;cursor:pointer">인쇄</button>
      <button type="button" data-act="close" style="padding:8px 16px;border-radius:8px;border:1px solid #b8c2bc;background:#fff;color:inherit;font:inherit;cursor:pointer">닫기</button>
    </div>`;
  const frame = document.createElement("iframe");
  frame.title = "인쇄 미리보기";
  frame.style.cssText = "flex:1;width:100%;border:0;background:#d9dcda";
  overlay.appendChild(frame);
  document.body.appendChild(overlay);

  const prevFocus = document.activeElement;
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  };
  const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  document.addEventListener("keydown", onKey, true);
  overlay.querySelector('[data-act="close"]').onclick = close;
  overlay.querySelector('[data-act="print"]').onclick = () => { frame.contentWindow.focus(); frame.contentWindow.print(); };
  overlay.querySelector('[data-act="print"]').focus();

  const doc = frame.contentDocument;
  doc.open(); doc.write(sheetHtml(items, svg)); doc.close();
  doc.addEventListener("keydown", onKey, true);
  /* 글꼴이 들어온 뒤에 재야 상점명 폭이 맞다. 글꼴을 못 받아도 대체 글꼴로 잰다.
     조아용 그림도 같이 기다린다 — 다 받기 전에 [인쇄]를 누르면 빈 자리로 찍힌다 */
  const imgs = [...doc.images].map(im => (im.complete ? null : new Promise(r => { im.onload = im.onerror = r; })));
  try { await Promise.race([Promise.all([doc.fonts.ready, ...imgs]), wait(3000)]); } catch (e) { /* 대체 글꼴 */ }
  fitText(doc, ".name", 18, 9);
  fitText(doc, ".title", 11, 9);
  /* 미리보기 창이 A4 세로 폭(794px)보다 좁으면 화면에서만 줄여 보인다 — 인쇄에는 걸리지 않는다 */
  const zoom = Math.min(1, (frame.clientWidth - 48) / (210 * 96 / 25.4));
  const st = doc.createElement("style");
  st.textContent = `@media screen { body { zoom: ${zoom.toFixed(3)}; } }`;
  doc.head.appendChild(st);
}
