/* 디자인 시스템 소스 로더 (개발·퍼블리싱용).
 *
 * 왜 필요한가: 이 저장소의 화면은 빌드 도구 없이 브라우저에서 바로 도는 정적 프로토타입이다.
 * 그런데 `_ds_bundle.js` 는 Claude Design 이 생성한 산출물이라 손으로 고칠 파일이 아니다.
 * 그래서 화면은 번들이 아니라 `components/**` 원본을 직접 읽는다.
 * 결과적으로 "디자인 시스템을 고친다 = .jsx 원본을 고친다" 한 가지 경로만 남는다.
 *
 * 하는 일: 모듈을 fetch → @babel/standalone 으로 ESM+JSX 를 CommonJS 로 변환 →
 * 변환 결과에서 require() 대상을 훑어 의존성을 재귀적으로 받아온 뒤 → 순서대로 평가한다.
 *
 * 전제: file:// 이 아니라 HTTP 로 열어야 한다 (fetch 제약).
 *   저장소 루트에서   node tools/serve.mjs
 */
(function (global) {
  "use strict";

  var sources = new Map();  /* url -> 변환된 코드 */
  var modules = new Map();  /* url -> { exports } (평가 완료분) */
  var pending = new Map();  /* url -> Promise */

  function resolve(spec, from) {
    return new URL(spec, from).href;
  }

  function transform(code, url) {
    if (!global.Babel) throw new Error("@babel/standalone 이 먼저 로드되어야 합니다.");
    return global.Babel.transform(code, {
      filename: url.split("/").pop(),
      presets: [
        ["env", { modules: "commonjs", targets: { esmodules: true } }],
        "react",
      ],
      sourceMaps: false,
    }).code;
  }

  /* 변환 결과에서 의존성 목록을 뽑는다. 주석이나 문자열에 'import' 가 섞여 있어도
     require( 호출만 보므로 오탐이 없다. */
  function deps(code) {
    var re = /require\(\s*["']([^"']+)["']\s*\)/g, out = [], m;
    while ((m = re.exec(code))) if (out.indexOf(m[1]) === -1) out.push(m[1]);
    return out;
  }

  function isExternal(spec) {
    return spec === "react" || spec === "react-dom" || spec === "react-dom/client";
  }

  function load(url) {
    if (pending.has(url)) return pending.get(url);
    var p = fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(url + " (" + r.status + ") 를 읽지 못했습니다.");
        return r.text();
      })
      .then(function (text) {
        var code = transform(text, url);
        sources.set(url, code);
        return Promise.all(
          deps(code)
            .filter(function (s) { return !isExternal(s); })
            .map(function (s) { return load(resolve(s, url)); })
        );
      })
      .then(function () { return url; });
    pending.set(url, p);
    return p;
  }

  function externals(spec) {
    if (spec === "react") return global.React;
    if (spec === "react-dom") return global.ReactDOM;
    if (spec === "react-dom/client") return global.ReactDOM;
    return null;
  }

  function evaluate(url) {
    if (modules.has(url)) return modules.get(url).exports;
    var code = sources.get(url);
    if (code == null) throw new Error(url + " 이 로드되지 않았습니다.");
    var module = { exports: {} };
    modules.set(url, module); /* 순환 참조 대비: 등록 먼저 */
    var require = function (spec) {
      if (isExternal(spec)) return externals(spec);
      return evaluate(resolve(spec, url));
    };
    try {
      new Function("require", "exports", "module", code)(require, module.exports, module);
    } catch (e) {
      modules.delete(url);
      throw new Error("모듈 평가 실패: " + url + "\n" + (e && e.message ? e.message : e));
    }
    return module.exports;
  }

  /* 디자인 시스템을 window 네임스페이스에 올린다 (_ds_bundle.js 와 같은 이름을 쓴다). */
  function expose(ns) {
    global.DesignSystem_5c90e8 = Object.assign(global.DesignSystem_5c90e8 || {}, ns);
    global.DS = global.DesignSystem_5c90e8;
    return global.DS;
  }

  var DSLoader = {
    /* 디자인 시스템만 올린다. 반환: Promise<네임스페이스> */
    ds: function (indexUrl) {
      var url = resolve(indexUrl, location.href);
      return load(url).then(function () { return expose(evaluate(url)); });
    },

    /* 디자인 시스템 + 화면 엔트리를 올리고 렌더까지 한다.
       entry 모듈의 default export 가 React 컴포넌트여야 한다. */
    mount: function (opts) {
      var dsUrl = resolve(opts.ds, location.href);
      var entryUrl = resolve(opts.entry, location.href);
      var host = document.querySelector(opts.el || "#root");
      return Promise.all([load(dsUrl), load(entryUrl)])
        .then(function () {
          expose(evaluate(dsUrl));
          var App = evaluate(entryUrl).default;
          if (typeof App !== "function") throw new Error(opts.entry + " 에 default export 컴포넌트가 없습니다.");
          global.ReactDOM.createRoot(host).render(global.React.createElement(App));
        })
        .catch(function (err) {
          console.error(err);
          host.innerHTML =
            '<div style="padding:24px;font:16px/1.6 system-ui;color:#a5322b">'
            + '<b>화면을 불러오지 못했습니다.</b><pre style="white-space:pre-wrap;font-size:13px;color:#2f3d36">'
            + String(err && err.message ? err.message : err).replace(/[<>&]/g, "") + "</pre>"
            + '<p style="font-size:14px;color:#5b6a62">file:// 로 연 경우 HTTP 서버로 열어야 합니다. '
            + '저장소 루트에서 <code>node tools/serve.mjs</code> 실행 후 '
            + '<code>http://localhost:8000/screens/main/</code> 로 접속하세요.</p></div>';
          throw err;
        });
    },
  };

  global.DSLoader = DSLoader;
})(window);
