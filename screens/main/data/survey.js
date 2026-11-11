import React from "react";
import { safeStore } from "./sessionStore.js";
import { readQrCode } from "./qr.js";

/* 사용자 만족도 조사 (2026-11-09, 사용자 요청) — 언제 묻고, 다시 묻지 않을지, 무엇을 남기는지.
 *
 * 그리는 것은 디자인 시스템의 `SurveyPrompt`, 띄우는 자리는 `MainApp` 이다. 여기는 판정과 저장만 한다.
 *
 * 「조건」(물어도 되는 사람인가)과 「시점」(언제 꺼낼까)을 나눈다 (2026-11-09 개정, 사용자 요청).
 * 종전에는 상세 7초가 차는 순간 그 자리에서 떴다 — 가게를 읽는 중에 카드가 끼어들었다.
 *
 * ── 조건 (하나라도) ─────────────────────────────────────────────────────────
 *   누적 사용 시간   이번 방문에서 화면이 보인 시간 합계 30초 이상. 어느 화면이든 센다(상세 · 코스 · 축제 포함)
 *                    — 탭이 가려진 동안(다른 앱)은 세지 않는다
 *   탐색량           서로 다른 상점·시설 상세 5곳 이상 (같은 곳을 다시 열면 세지 않는다)
 *   길찾기 복귀      아래 시점과 한 묶음이다 — 이것만은 조건이 곧 시점이다
 *
 * ── 시점 (조건이 맞은 사람에게, 아래 중 먼저 오는 때) ───────────────────────
 *   흐름이 끝남      상세 · 코스 · 축제 · 길찾기 화면에서 목록이나 메인으로 돌아온 순간
 *   손을 놓음        5초 동안 스크롤 · 터치 · 키 입력이 없다 (어느 화면에서든)
 *   길찾기 복귀      길찾기 화면(#/route/…)에서 페이지를 떠났다가(외부 지도 앱) 돌아오면 1.5초 뒤
 *
 * 길찾기 복귀를 「외부 지도 앱 버튼」이 아니라 **길찾기 화면에서 페이지가 가려졌다 돌아왔는가**로 잰다. 지금 길찾기(S07)는
 * 앱 안의 화면이라 외부 앱으로 넘기는 단추가 없다 — 단추에 묶으면 이 조건은 영영 맞지 않는다. 가려짐으로 재면
 * 사람이 지도 앱을 직접 열고 돌아와도, 나중에 넘기는 단추가 생겨도 같은 판정이 된다. 페이지가 통째로 다시
 * 뜨는 브라우저(뒤로가기 캐시 없음)도 있어 떠난 표시를 `sessionStorage` 에 적는다.
 *
 * ── 재노출 제어 ─────────────────────────────────────────────────────────────
 *   응답 완료 · 다시 보지 않기   다시 묻지 않는다         → localStorage (기기에 남는다)
 *   [×] 닫기                     이번 방문에서는 묻지 않는다 → sessionStorage (탭을 닫으면 풀린다)
 * 「한 방문(세션)」은 브라우저 탭의 sessionStorage 수명으로 읽는다 — QR 을 다시 찍어 새 탭이 열리면 새 방문이다.
 *
 * ── 저장 — 서버 자리를 이 파일이 흉내 낸다 ──────────────────────────────────
 * 서버가 없어 응답은 이 기기의 localStorage(`yongin.survey.responses`)에 쌓인다. 실연동 때 바뀌는 것은
 * `send()` 한 곳이다. 함께 남기는 값: 페이지 유형(상점 · 공공시설 · 축제)과 항목 ID · QR 유입 위치(`?qr` 와
 * URL 파라미터 원문) · 응답 일시 · 응답 값 · 어느 조건으로 떴는지(trigger, 분석용으로 더했다).
 *
 * ── 이유는 점수 뒤에, 고르게 (2026-11-09 추가, 사용자 요청) ─────────────────
 * [제출] 에서 점수를 먼저 저장하고, 카드가 「아쉬운 점이 있다면 알려주세요.」 칸으로 바뀐다. 쓰지 않고 [×] 로 닫아도
 * 점수는 남는다(응답 완료로 친다). [보내기] 를 누르면 **같은 응답 기록**에 `comment` 를 덧붙인다 — 기록마다 `id` 를
 * 달아 두는 이유다. 실서버에서는 점수 POST 뒤 이유를 그 id 로 덧붙이는(PATCH) 두 번의 요청이 된다(`send` · `attach`).
 *
 * ── 검수 플래그 ─────────────────────────────────────────────────────────────
 *   ?survey=reset   기록(응답 · 다시 보지 않기 · 닫기 · 본 가게 수 · 누적 시간)을 지우고 시작
 *   ?survey=1       기록을 지우고 바로 띄운다
 */

const VISIBLE_MS = 30000;
const EXPLORE_COUNT = 5;
const IDLE_MS = 5000;
const RETURN_DELAY_MS = 1500;
/* 감사 문구가 머무는 시간. 그 뒤 카드가 스스로 물러난다 */
const THANKS_MS = 2500;

const KEY_STOP = "yongin.survey.stop";           // local   "answered" | "never"
const KEY_RESPONSES = "yongin.survey.responses"; // local   응답 기록 (서버 자리)
const KEY_CLOSED = "yongin.survey.closed";       // session [×] 를 눌렀다
const KEY_SEEN = "yongin.survey.seen";           // session 열어 본 상점·시설 id
const KEY_LEFT = "yongin.survey.leftRoute";      // session 길찾기 화면에서 떠났다
const KEY_VISIBLE = "yongin.survey.visibleMs";   // session 화면이 보인 시간 합계 (새로고침해도 이어진다)

/* 한 흐름을 이루는 화면. 여기서 이 밖(메인 · 전체보기 목록 · 상점가 안내)으로 나오면 흐름이 끝난 것이다.
   길찾기는 상세에서 이어지는 화면이라 안에 둔다 — 상세 → 길찾기는 흐름의 한가운데다 */
const FLOW = ["store", "facility", "festival", "course", "route"];

export const SURVEY_QUESTION = "오늘 확인하신 정보, 만족스러우셨나요?";

const PAGE_LABEL = { store: "상점", facility: "공공시설", festival: "축제", course: "코스" };

const local = () => safeStore("localStorage");
const session = () => safeStore("sessionStorage");

function stopped() {
  const s = local();
  if (s && s.getItem(KEY_STOP)) return true;
  const ss = session();
  return Boolean(ss && ss.getItem(KEY_CLOSED));
}

function clearAll() {
  const s = local();
  if (s) { s.removeItem(KEY_STOP); s.removeItem(KEY_RESPONSES); }
  const ss = session();
  if (ss) [KEY_CLOSED, KEY_SEEN, KEY_LEFT, KEY_VISIBLE].forEach(k => ss.removeItem(k));
}

function readNum(key) {
  const ss = session();
  return Number((ss && ss.getItem(key)) || 0) || 0;
}

function seenList() {
  const ss = session();
  try { return JSON.parse((ss && ss.getItem(KEY_SEEN)) || "[]"); } catch (e) { return []; }
}

/* 물어도 되는 사람인가 — 맞은 조건의 이름, 아니면 null */
function basisNow() {
  if (readNum(KEY_VISIBLE) >= VISIBLE_MS) return "time";
  if (seenList().length >= EXPLORE_COUNT) return "explore";
  return null;
}

/* 지금 화면이 무엇의 페이지인가. 길찾기는 도착지의 종류를 따른다 (#/route/store/:id).
   흐름이 끝난 뒤(메인)에 답하는 일이 많아, 그때는 **방금 보던 페이지**를 적는다 (useSurvey 의 lastPage) */
function pageOf(route) {
  if (route.name === "store" || route.name === "facility" || route.name === "festival" || route.name === "course") {
    return { pageType: route.name, itemId: route.id };
  }
  if (route.name === "route" && PAGE_LABEL[route.parts[0]]) {
    return { pageType: route.parts[0], itemId: route.parts[1] || null };
  }
  return { pageType: null, itemId: null };
}

/* 서버 자리. 실연동 때 이 함수 안만 바꾼다 (POST). 저장에 실패해도 화면은 감사 문구로 넘어간다 —
   대답한 사람에게 오류를 보여줄 일이 아니다 */
function send(record) {
  const s = local();
  if (!s) return;
  try {
    const list = JSON.parse(s.getItem(KEY_RESPONSES) || "[]");
    list.push(record);
    s.setItem(KEY_RESPONSES, JSON.stringify(list));
  } catch (e) { /* 저장소가 가득 찼거나 깨졌다 — 버린다 */ }
}

/* 이유를 그 응답 기록에 덧붙인다. 서버 자리는 `send` 와 같다 */
function attach(id, comment) {
  const s = local();
  if (!s) return;
  try {
    const list = JSON.parse(s.getItem(KEY_RESPONSES) || "[]");
    const rec = list.find(r => r.id === id);
    if (!rec) return;
    rec.comment = comment;
    rec.commentedAt = new Date().toISOString();
    s.setItem(KEY_RESPONSES, JSON.stringify(list));
  } catch (e) { /* 위 send 와 같다 */ }
}

/* 이 기기에 쌓인 응답 (검수용 — 콘솔에서 확인한다) */
export function listSurveyResponses() {
  const s = local();
  try { return s ? JSON.parse(s.getItem(KEY_RESPONSES) || "[]") : []; } catch (e) { return []; }
}

/* 화면이 쓰는 규약: `{ phase, submit, comment, close, never }`.
 *   phase   null(안 보임) · "ask"(묻는 중) · "comment"(이유 쓰기) · "thanks"(감사 문구)
 *   paused  다른 막(팜플렛 안내 · 코치마크)이나 신고 폼이 떠 있는 동안 참. 그동안 맞은 조건은
 *           버리지 않고 쥐고 있다가 풀리면 띄운다
 *   flag    검수 플래그 (`?survey=`) */
export function useSurvey(route, { paused = false, flag = null } = {}) {
  /* 검수 플래그는 첫 렌더에 한 번만 — 렌더마다 지우면 응답한 기록이 곧바로 사라진다 */
  const [wanted, setWanted] = React.useState(() => {
    if (flag === "reset" || flag === "1") clearAll();
    return flag === "1" ? "flag" : null;
  });
  /* 점수를 낸 뒤의 단계 — null · "comment" · "thanks" */
  const [after, setAfter] = React.useState(null);
  const recordId = React.useRef(null);

  const routeRef = React.useRef(route);
  routeRef.current = route;

  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;
  /* 응답 기록에 적을 페이지 — 흐름이 끝나 메인에서 답하면 방금 보던 것 */
  const lastPage = React.useRef({ pageType: null, itemId: null });
  const basisRef = React.useRef(null);

  /* 시점이 왔다 — 이미 멈춘 사람이거나 이미 떠 있으면 아무것도 하지 않는다.
     `timing` 은 꺼낸 때, `basis` 는 맞은 조건(time · explore · route-return) */
  const ask = React.useCallback((timing, basis) => {
    if (stopped()) return;
    setWanted(w => {
      if (w) return w;
      basisRef.current = basis;
      return timing;
    });
  }, []);

  /* 탐색량 — 서로 다른 상점·시설. 여기서는 세기만 하고 띄우지 않는다 */
  React.useEffect(() => {
    const page = pageOf(route);
    if (page.pageType) lastPage.current = page;
    if ((route.name !== "store" && route.name !== "facility") || !route.id) return;
    const seen = seenList();
    const key = `${route.name}:${route.id}`;
    if (!seen.includes(key)) {
      seen.push(key);
      const ss = session();
      if (ss) ss.setItem(KEY_SEEN, JSON.stringify(seen));
    }
  }, [route]);

  /* 시점 ① 흐름이 끝남 — 상세 · 코스 · 축제 · 길찾기에서 그 밖으로 나온 순간. 신고 폼은 흐름의 끝이 아니다 */
  const prevName = React.useRef(route.name);
  React.useEffect(() => {
    const prev = prevName.current;
    prevName.current = route.name;
    if (!FLOW.includes(prev) || FLOW.includes(route.name) || route.name === "report") return;
    const basis = basisNow();
    if (basis) ask("flow-end", basis);
  }, [route.name, ask]);

  /* 누적 시간과 시점 ② 손을 놓음 — 1초마다 한 번 본다.
     스크롤은 상세 오버레이 안의 상자에서 일어나 위로 올라오지 않으므로 잡는 단계(capture)에서 듣는다 */
  React.useEffect(() => {
    let lastAct = Date.now();
    const touch = () => { lastAct = Date.now(); };
    const EVENTS = ["pointerdown", "touchstart", "wheel", "scroll", "keydown"];
    EVENTS.forEach(e => document.addEventListener(e, touch, { capture: true, passive: true }));
    const onVis = () => { if (document.visibilityState === "visible") touch(); };
    document.addEventListener("visibilitychange", onVis);

    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const ss = session();
      if (ss) ss.setItem(KEY_VISIBLE, String(readNum(KEY_VISIBLE) + 1000));
      /* 다른 막이 떠 있는 동안 손을 놓은 것은 그 막을 읽는 중이다 — 세지 않는다 */
      if (pausedRef.current) { touch(); return; }
      if (Date.now() - lastAct < IDLE_MS) return;
      const basis = basisNow();
      if (basis) ask("idle", basis);
    }, 1000);

    return () => {
      clearInterval(tick);
      EVENTS.forEach(e => document.removeEventListener(e, touch, { capture: true }));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ask]);

  /* 시점 ③ 길찾기에서 떠났다 돌아옴 (조건이기도 하다) */
  React.useEffect(() => {
    let timer = null;
    const back = () => {
      const ss = session();
      if (!ss || !ss.getItem(KEY_LEFT)) return;
      ss.removeItem(KEY_LEFT);
      clearTimeout(timer);
      timer = setTimeout(() => ask("route-return", "route-return"), RETURN_DELAY_MS);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        const ss = session();
        if (ss && routeRef.current.name === "route") ss.setItem(KEY_LEFT, "1");
      } else back();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", back);
    back();   // 페이지가 통째로 다시 떴을 때
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", back);
    };
  }, [ask]);

  const submit = React.useCallback(value => {
    const here = pageOf(routeRef.current);
    const { pageType, itemId } = here.pageType ? here : lastPage.current;
    const id = `sv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    recordId.current = id;
    send({
      id,
      value,
      pageType,
      pageTypeLabel: PAGE_LABEL[pageType] || null,
      itemId,
      qr: readQrCode(),
      entryParams: typeof location !== "undefined" ? location.search : "",
      answeredAt: new Date().toISOString(),
      answeredOn: routeRef.current.name,   // 카드가 떠 있던 화면 (main · store …)
      trigger: wanted,                     // 꺼낸 때: flow-end · idle · route-return · flag(검수)
      basis: basisRef.current || null,     // 맞은 조건: time · explore · route-return
      comment: null,
    });
    const s = local();
    if (s) s.setItem(KEY_STOP, "answered");
    setAfter("comment");
  }, [wanted]);

  const comment = React.useCallback(text => {
    if (recordId.current) attach(recordId.current, text);
    setAfter("thanks");
  }, []);

  /* 감사 문구는 잠깐 머물다 물러난다. 이유 쓰기 단계는 저절로 닫지 않는다 — 쓰는 중에 사라지면 안 된다 */
  React.useEffect(() => {
    if (after !== "thanks") return undefined;
    const t = setTimeout(() => { setAfter(null); setWanted(null); }, THANKS_MS);
    return () => clearTimeout(t);
  }, [after]);

  const close = React.useCallback(() => {
    /* 점수를 낸 뒤의 [×] 는 그냥 닫기다 — 이미 응답해 다시 묻지 않는다 */
    if (!after) { const ss = session(); if (ss) ss.setItem(KEY_CLOSED, "1"); }
    setAfter(null);
    setWanted(null);
  }, [after]);

  const never = React.useCallback(() => {
    const s = local();
    if (s) s.setItem(KEY_STOP, "never");
    setWanted(null);
  }, []);

  const phase = after || (wanted && !paused ? "ask" : null);
  return { phase, submit, comment, close, never };
}

export default useSurvey;
