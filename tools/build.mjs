/* 화면 번들 빌드 — 브라우저에서 하던 JSX 변환을 배포 시점으로 옮긴다.
 *
 * ── 왜 필요한가 ──────────────────────────────────────────────────────────────
 * 지금 브라우저는 `@babel/standalone`(3MB)을 받아 `.jsx` 원본 60여 개를 개별 요청하며
 * 실시간으로 변환한다. 검수용으로는 견딜 만하지만 길에서 QR 을 찍는 사용자가 모바일
 * 데이터로 받을 양이 아니다. 이 스크립트가 같은 일을 미리 해서 파일 하나로 만든다.
 *
 * ── 반드시 지켜야 하는 것: 로더와 같은 규칙 ───────────────────────────────────
 * `design-systems/_ds_loader.js` 와 **해석 규칙이 한 글자도 달라선 안 된다.**
 * 다르면 로컬(로더)에서는 되고 배포(번들)에서만 깨지는, 가장 찾기 어려운 종류의 버그가 된다.
 * 그래서 아래 네 가지를 그대로 옮겼다:
 *
 *   1. 변환    preset-env(modules:"commonjs", targets:{esmodules:true}) + preset-react
 *   2. 의존성  변환 결과에서 require("...") 만 정규식으로 훑는다
 *   3. 외부    react / react-dom / react-dom/client 은 전역에서 가져온다
 *   4. 평가    순환 참조 대비로 module 을 레지스트리에 **먼저** 넣고 실행한다
 *
 * 로더와 다른 점은 하나뿐이다. 로더는 런타임에 URL 로 경로를 풀지만, 번들은 빌드 시점에
 * 풀어 각 모듈마다 `{ 적힌 경로 → 모듈 id }` 표를 함께 넣는다. 브라우저에서 경로를
 * 다시 풀 일이 없어지므로 해석이 갈라질 여지 자체가 사라진다.
 *
 * ── 실행 ─────────────────────────────────────────────────────────────────────
 *   npm run build          (내부적으로 node tools/build.mjs)
 *
 * 산출물은 커밋하지 않는다 (.gitignore). 배포는 Vercel 이 이 스크립트를 돌려서 만든다.
 * 로컬 개발은 번들 없이 로더로 돌아가므로 **원본을 고치면 새로고침만으로 바로 반영된다.**
 * 남은 화면을 만드는 동안 개발 방식이 바뀌지 않는 것이 이 설계의 핵심이다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* 빌드 대상. 화면이 늘면 여기 한 줄씩 더한다.
   ds 와 entry 는 그 화면 index.html 의 DSLoader.mount 인자와 같아야 한다. */
const TARGETS = [
  { dir: "screens/main", ds: "design-systems/index.js", entry: "screens/main/App.jsx" },
];

let babel;
try {
  babel = require("@babel/core");
} catch {
  console.error(
    "@babel/core 를 찾지 못했습니다. 먼저 의존성을 설치하세요:\n" +
    "  npm install\n" +
    "(로컬 개발은 빌드 없이도 됩니다 — 번들이 없으면 화면이 로더로 떨어집니다.)"
  );
  process.exit(1);
}

const EXTERNAL = new Set(["react", "react-dom", "react-dom/client"]);
const rel = abs => path.relative(ROOT, abs).split(path.sep).join("/");

function transform(code, file) {
  return babel.transformSync(code, {
    filename: file,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { modules: "commonjs", targets: { esmodules: true } }],
      [require.resolve("@babel/preset-react"), {}],
    ],
    sourceMaps: false,
    compact: false,
  }).code;
}

/* 변환 결과에서 require 대상을 훑는다. 주석이나 문자열에 import 가 섞여 있어도
   require( 호출만 보므로 오탐이 없다 — 로더의 deps() 와 같은 정규식이다. */
function depsOf(code) {
  const out = [];
  for (const m of code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/* 엔트리에서 출발해 의존성을 재귀로 모은다. 반환: id -> { code, map, raw } */
function collect(entries) {
  const mods = new Map();
  const visit = absFile => {
    const id = rel(absFile);
    if (mods.has(id)) return;
    if (!fs.existsSync(absFile)) throw new Error(`의존성을 찾지 못했습니다: ${id}`);
    const raw = fs.readFileSync(absFile, "utf8");
    const code = transform(raw, absFile);
    const map = {};
    mods.set(id, { code, map, raw });
    for (const spec of depsOf(code)) {
      if (EXTERNAL.has(spec)) continue;
      /* 로더와 같은 URL 기반 해석 — 상대 경로 규칙이 갈라지지 않게 한다 */
      const target = fileURLToPath(new URL(spec, pathToFileURL(absFile)));
      map[spec] = rel(target);
      visit(target);
    }
  };
  entries.forEach(visit);
  return mods;
}

/* ── Lucide 아이콘 추리기 ─────────────────────────────────────────────────────
 * lucide UMD 는 624KB 인데 아이콘이 2,021개다. 이 화면들이 쓰는 것은 수십 개뿐이라
 * 번들(400KB)보다 아이콘 꾸러미가 더 큰 상태였다. 쓰는 것만 뽑아 번들 안에 넣는다.
 *
 * 고르는 방법: **소스의 모든 문자열 리터럴 중 실제 lucide 아이콘 이름인 것.**
 * `<Icon name="x">` 같은 형태만 찾지 않는 이유는 이름이 여기저기서 만들어지기 때문이다 —
 * `FACILITY_ICONS` / `CATEGORY_ICONS` 표, 컴포넌트 기본값(`closeIcon = "x"`),
 * 화면이 prop 으로 넘기는 값. 한 군데라도 놓치면 그 아이콘만 **빈 사각형으로 조용히** 렌더된다.
 *
 * 넓게 잡아 과하게 포함되는 쪽을 택했다. "map"·"store"·"compass" 처럼 평범한 낱말이
 * 우연히 아이콘 이름과 같아 딸려 들어올 수 있는데, 하나당 200바이트 남짓이라 손해가 없다.
 * 반대 방향(빠뜨림)은 화면에서 티가 안 나므로 훨씬 비싸다.
 *
 * 그래도 빠뜨릴 수 있으니 검증에서 렌더된 SVG 중 자식이 없는 것을 센다.
 */
function pickIcons(mods) {
  let lucide;
  try { lucide = require("lucide"); }
  catch { return null; }   /* 없으면 아이콘 추리기만 건너뛴다 — CDN 전체본으로 돌아간다 */

  const pascal = n => String(n).split(/[-_ ]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join("");
  const table = lucide.icons || lucide;

  const found = new Set();
  for (const { raw } of mods.values()) {
    for (const m of raw.matchAll(/["']([a-z][a-z0-9]*(?:-[a-z0-9]+)*)["']/g)) {
      const key = pascal(m[1]);
      if (table[key]) found.add(m[1]);
    }
  }
  const out = {};
  for (const n of [...found].sort()) out[pascal(n)] = table[pascal(n)];
  return { names: [...found].sort(), data: out };
}

/* 번들 본문. 로더의 evaluate() 를 그대로 옮긴 것이고, 차이는 경로를 미리 풀어둔 것뿐이다. */
function emit(mods, dsId, entryId, icons) {
  const registry = [...mods.entries()].map(([id, m]) =>
    `${JSON.stringify(id)}: {\n  map: ${JSON.stringify(m.map)},\n  fn: function (require, exports, module) {\n${m.code}\n  }\n}`
  ).join(",\n");

  /* 아이콘은 window.lucide.icons 로 올린다 — Icon.jsx 가 보는 자리 그대로다.
     CDN 전체본(624KB)을 대신하므로 배포 경로는 lucide 를 아예 받지 않는다. */
  const iconBlock = icons
    ? `global.lucide = global.lucide || {};\nglobal.lucide.icons = Object.assign(global.lucide.icons || {}, ${JSON.stringify(icons.data)});\n`
    : "";

  return `/* 생성된 파일입니다. 직접 고치지 마세요 — tools/build.mjs 가 만듭니다.
   원본은 design-systems/** 와 screens/** 입니다. */
(function (global) {
"use strict";
${iconBlock}var MODULES = {
${registry}
};
var cache = {};
function external(spec) {
  if (spec === "react") return global.React;
  if (spec === "react-dom" || spec === "react-dom/client") return global.ReactDOM;
  return null;
}
function req(id) {
  if (cache[id]) return cache[id].exports;
  var def = MODULES[id];
  if (!def) throw new Error("모듈이 번들에 없습니다: " + id);
  var module = { exports: {} };
  cache[id] = module;               /* 순환 참조 대비: 등록 먼저 */
  def.fn(function (spec) {
    var ext = external(spec);
    if (ext) return ext;
    var target = def.map[spec];
    if (!target) throw new Error("빌드 시점에 풀지 못한 경로: " + spec + " (" + id + ")");
    return req(target);
  }, module.exports, module);
  return module.exports;
}
global.DesignSystem_5c90e8 = Object.assign(global.DesignSystem_5c90e8 || {}, req(${JSON.stringify(dsId)}));
global.DS = global.DesignSystem_5c90e8;
global.__APP__ = req(${JSON.stringify(entryId)}).default;
/* 검증용. 번들과 로더가 같은 화면을 그리는지 확인하려면 화면 모듈을 하나씩 꺼내 비교해야 한다.
   엔트리만 비교하면 한 번에 한 탭만 그려져 나머지 탭의 차이를 못 잡는다.
   정적 사이트라 원본이 어차피 공개이고, 숨길 것이 없어 노출 자체가 위험이 되지 않는다. */
global.__DS_REQUIRE__ = req;
})(window);
`;
}

let any = false;
for (const t of TARGETS) {
  const dsAbs = path.join(ROOT, t.ds);
  const entryAbs = path.join(ROOT, t.entry);
  const mods = collect([dsAbs, entryAbs]);
  const icons = pickIcons(mods);
  const out = emit(mods, rel(dsAbs), rel(entryAbs), icons);
  const dest = path.join(ROOT, t.dir, "bundle.js");
  fs.writeFileSync(dest, out);
  console.log(`${t.dir}/bundle.js  모듈 ${mods.size}개  ${(out.length / 1024).toFixed(0)} KB`);
  if (icons) {
    console.log(`  아이콘 ${icons.names.length}개 포함 (lucide 전체 2,021개 중)`);
    console.log(`  ${icons.names.join(" ")}`);
  } else {
    console.log("  lucide 패키지가 없어 아이콘을 넣지 못했습니다 — 화면이 CDN 전체본을 받게 됩니다.");
  }
  any = true;
}
if (!any) { console.error("빌드 대상이 없습니다."); process.exit(1); }
