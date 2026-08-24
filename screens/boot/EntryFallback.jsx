import React from "react";
import { AppBar, EmptyState, Button } from "../../design-systems/index.js";
import { CONTACT } from "../main/config.js";

/* S11 빈 상태 · 오류 · 잘못된 QR (U-CM-02).
 *
 * QR 을 찍었는데 그 코드로 지점을 만들 수 없을 때 나오는 화면이다. 세 갈래다.
 *
 *   unknown   표에 없는 코드      용인시 QR 이 아니거나 손상됐다
 *   inactive  표에 있으나 비활성   지금은 쓰지 않는 안내판
 *   error     조회 자체가 실패     망 문제 등 — 여기만 [다시 시도]가 있다
 *
 * 셋을 한 화면으로 두는 이유는 사용자가 할 일이 같기 때문이다 — **다른 QR 을 찍는 것**.
 * 다른 것은 왜 막혔는지 한 줄뿐이라 화면을 셋으로 나누면 같은 화면을 세 번 만들게 된다.
 *
 * ── 안내와 조아용뿐이다 (2026-08-24 · 사용자 요청) ─────────────────────────
 * 이 화면에는 세 덩이가 더 있었다. **찍으신 QR** 상자(코드 문자열과 안내판 이름),
 * **용인시 골목형 상점가 32곳 목록**(구별로 묶고 누르면 요약이 펼쳐졌다), 그리고 그
 * 목록에 딸린 기준일 고지다. 전부 걷어냈다.
 *
 * 걷어낸 이유는 **그 어느 것도 이 사람이 지금 할 수 있는 일이 아니어서**다. 목록에서
 * 상점가를 눌러도 갈 곳이 없다 — 상점가 화면은 셸의 탭이고 셸은 QR 지점이 있어야 선다
 * (확정 결정사항 6). 그래서 누르면 요약만 펼치고 "그곳 안내판의 QR 을 찍어 주세요"라고
 * 다시 말하는 자리였다. 서른두 줄을 훑게 해놓고 결론이 첫 화면과 같은 말이면, 그 줄들은
 * 길을 열어준 것이 아니라 **막힌 화면을 길어 보이게** 한 것이다.
 *
 * QR 코드 문자열도 마찬가지다. 문의할 때의 단서였는데, 문의처를 화면에 적어두면
 * (아래 CONTACT) 전화를 건 사람은 자기가 서 있는 안내판을 보고 말하면 된다 —
 * 화면 속 문자열보다 눈앞의 안내판이 정확하다.
 *
 * 남은 것은 조아용 · 무슨 일인지 한 줄 · 무엇을 하면 되는지 한 줄 · 문의처다.
 * 참고용 고지(U-CM-07 · U-CM-08)도 함께 내렸다 — 이 화면에는 이제 시설도 점포도
 * 없어서 "안내 정보는 참고용입니다"가 가리킬 대상이 없다.
 *
 * (명세서 S11 행의 "전체 지도 폴백 진입"은 v1.1 에서 이미 목록으로 바뀌어 있었고,
 *  이제 그 목록마저 없다 — 지도든 목록이든 QR 지점 없이는 갈 곳이 열리지 않는다.)
 */

/* ── "QR" 은 뒤에 오는 말과 떨어지지 않는다 (2026-08-24) ────────────────────
   아래 문장에서 QR 뒤에 있는 것은 보통 공백이 아니라 **줄바꿈 없는 공백**(U+00A0)이다.
   그냥 두면 폭이 모자랄 때 그 자리에서 줄이 갈려 "…지금은 쓰지 않는 QR / 코드일 수
   있습니다." 처럼 한 낱말이 두 줄에 걸친다. 이 화면은 문장 두 줄이 전부라, 그 한 번이
   곧 화면의 인상이 된다.

   **눈에 보이지 않는 문자다.** 이 줄들을 고칠 때 QR 뒤를 지우고 스페이스바를 누르면
   보통 공백으로 바뀌어 조용히 되돌아간다 — 그때는 이 주석을 보고 다시 넣어야 한다.

   줄마다 `word-break: keep-all` 도 함께 건다. 시민용 화면에는 관리자 쪽(admin.css 의
   `.admin-web`)처럼 위에서 걸어주는 규칙이 없어, 기본값(normal)이 한글을 **글자와 글자
   사이 아무 데서나** 끊는다 — "쓰지 / 않는" 이 아니라 "쓰 / 지 않는" 이 나오는 자리다. */
const COPY = {
  unknown: {
    pose: "curious",
    title: "등록되지 않은 QR 코드입니다",
    lines: [
      "용인시의 QR 이 아니거나, 코드가 손상되었을 수 있습니다.",
      "다른 QR 을 찍어 주세요.",
    ],
  },
  inactive: {
    /* 제목이 "지금은 쓰지 않는 안내판입니다" 였다 (2026-08-24 바꿈). 그 문장은 우리가
       아는 사실(표에 있으나 비활성)을 말하는데, 화면 앞에 선 사람이 아는 것은 **안내가
       안 나온다**는 것뿐이다. 먼저 그것을 말하고, 짐작되는 이유는 다음 줄로 내린다. */
    pose: "sorry",
    title: "안내를 불러올 수 없는 QR 코드입니다",
    lines: [
      "코드가 손상되었거나, 지금은 쓰지 않는 QR 코드일 수 있습니다.",
      "다른 QR 을 찍어 주세요.",
    ],
  },
  error: {
    /* 여기만 다르다 — 코드가 아니라 통신이 문제라, 할 일이 [다시 시도]이지 다른 QR 이
       아니다. 그래서 문의처도 적지 않는다 (전화로 풀 일이 아니다). */
    pose: "sorry",
    title: "정보를 불러오지 못했습니다",
    lines: ["통신 상태를 확인한 뒤 다시 시도해 주세요."],
    retry: true,
  },
};

export function EntryFallback({ status = "unknown", onRetry, base = "../../design-systems/" }) {
  const copy = COPY[status] || COPY.unknown;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-page)",
      display: "flex", flexDirection: "column" }}>

      {/* 뒤로가기가 없다 — 여기가 진입점이다. 되돌아갈 화면이 없는 자리에 버튼을 두면
          누른 사람이 서비스 밖으로 나간다 */}
      <AppBar title="용인시 위치안내" style={{ flex: "0 0 auto" }} />

      {/* 내용이 한 덩이뿐이라 세로 가운데에 세운다. 위아래 `auto` 여백으로 밀어 올리는
          것은 justifyContent 로 가운데를 잡으면 2차 글자 확대에서 내용이 상자보다 커졌을 때
          **위쪽이 잘려 스크롤로도 닿지 않기** 때문이다 (margin auto 는 그때 0 으로 접힌다). */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column" }}>
        <div style={{ margin: "auto 0", padding: "0 var(--gutter-screen) var(--space-6)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>

          <EmptyState pose={copy.pose} base={base} title={copy.title}
            /* 줄마다 block 을 쓴다 — 두 문장이 각자의 줄에 서야 "다른 QR 을 찍어 주세요"가
               앞 문장의 꼬리가 아니라 **할 일**로 읽힌다. 좁은 화면에서 앞 줄이 접히더라도
               그 관계는 그대로다 (<br /> 이면 접힌 자리와 뒤섞인다). */
            description={copy.lines.map((t, i) => (
              <span key={i} style={{ display: "block", marginTop: i ? 4 : 0,
                wordBreak: "keep-all", overflowWrap: "break-word" }}>{t}</span>
            ))}
            action={copy.retry && onRetry
              ? <Button icon="rotate-ccw" onClick={onRetry}>다시 시도</Button>
              : null} />

          {/* 문의처 — 이 서비스 안에 남은 길이 없는 사람의 마지막 자리다 (config 의 CONTACT).
              통신 오류에는 적지 않는다: 그때 할 일은 [다시 시도]이지 전화가 아니다. */}
          {copy.retry ? null : (
            <p style={{ textAlign: "center", fontSize: "var(--fs-caption)",
              color: "var(--text-muted)", lineHeight: 1.6, wordBreak: "keep-all" }}>
              문의 : {CONTACT.dept},{" "}
              {/* 번호만 줄 끝에서 잘리지 않게 붙들어 둔다 */}
              <span style={{ whiteSpace: "nowrap" }}>{CONTACT.tel}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EntryFallback;
