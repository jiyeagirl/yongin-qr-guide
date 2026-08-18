/* 저장소 정적 서버 — 의존성 없음, 설치 없음.
 *
 *   node tools/serve.mjs          기본 8000
 *   node tools/serve.mjs 8080     포트 지정
 *
 * 왜 필요한가: 화면이 `_ds_loader.js` 를 통해 디자인 시스템 원본(components/**.jsx)을
 * fetch 하므로 file:// 로 열면 동작하지 않는다. HTTP 로 열어야 한다.
 *
 * Windows 주의: `python -m http.server` 는 python 이 Microsoft Store 앱 실행 별칭
 * (%LOCALAPPDATA%\Microsoft\WindowsApps\python) 인 경우 아무 것도 하지 않고 조용히 끝난다.
 * 서버가 뜬 것처럼 보여도 실제로는 리스닝하지 않으므로 이 스크립트를 쓴다.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  /* .jsx 원본을 로더가 fetch 한다 — 브라우저가 저장 파일로 취급하지 않도록 JS 로 내보낸다 */
  ".jsx": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const send = (res, status, body, type = "text/plain; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
};

http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "400 잘못된 경로");
  }

  let file = path.resolve(ROOT, "." + pathname);

  /* 경로 이탈 차단 — 저장소 밖 파일은 내주지 않는다 */
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, "403 접근 불가");

  /* 디렉터리 요청이면 index.html — /screens/main/ 가 그대로 열린다 */
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");

  fs.readFile(file, (err, buf) => {
    if (err) {
      return send(res, 404, `404 ${pathname}\n\n찾은 위치: ${file}`);
    }
    send(res, 200, buf, TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
  });
})
  .on("error", err => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n  ✗ ${PORT} 포트가 이미 사용 중입니다.`);
      console.error(`    다른 포트로 실행하세요:  node tools/serve.mjs ${PORT + 1}`);
      console.error(`    (포트를 바꾸면 카카오 SDK 도메인에도 그 주소를 등록해야 합니다)\n`);
      process.exit(1);
    }
    throw err;
  })
  .listen(PORT, () => {
    const origin = `http://localhost:${PORT}`;
    console.log(`\n  yongin 정적 서버 → ${origin}`);
    console.log(`    본 화면(3탭)      ${origin}/screens/main/`);
    console.log(`\n  지도가 회색으로만 보인다면 카카오 개발자 콘솔에서`);
    console.log(`  [앱 설정 > 앱 > 플랫폼 키 > JavaScript 키 > SDK 도메인] 에`);
    console.log(`  ${origin} 을 등록했는지 확인하세요. (127.0.0.1 은 별도 도메인으로 취급됩니다)`);
    console.log(`\n  종료: Ctrl+C\n`);
  });
