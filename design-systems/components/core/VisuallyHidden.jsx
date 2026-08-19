import React from "react";

/* 눈에는 보이지 않고 **스크린리더에는 읽히는** 글자.
 *
 * 화면이 짧게 줄여 적은 말을 보조기기에는 온전히 들려줘야 할 때 쓴다.
 * 예: 코스 목록의 구간은 번호 칸(26px) 안에 "1분"만 적지만, 읽어줄 때는
 * "직전 지점에서 도보 1분"이어야 한다 — 화면은 앞뒤 맥락(점선·번호)이 대신 말해 주지만
 * 소리에는 그 맥락이 없다.
 *
 * ── display:none 도 visibility:hidden 도 아니다 ────────────────────────────
 * 그 둘은 접근성 트리에서도 사라져 스크린리더가 읽지 못한다. 여기서 필요한 것은
 * "눈에만 안 보이는" 것이라, 1px 상자로 줄이고 clip 으로 잘라낸다.
 *
 * ── aria-label 대신 이것을 쓰는 자리 ───────────────────────────────────────
 * aria-label 은 role 이 있는 요소에서만 안정적으로 읽힌다. 평범한 <span>/<p> 에 붙이면
 * 브라우저·리더 조합에 따라 무시된다. 읽을 대상이 그냥 글자일 때는 진짜 글자를 두는 편이
 * 확실하다.
 *
 * 이 스타일은 이 시스템 안에 네 군데(Input · Select · Textarea · RadioGroup 의 "필수")
 * 복사돼 있던 것을 한곳으로 모은 것이다.
 */
export function VisuallyHidden({ children, as: Tag = "span", ...rest }) {
  return (
    <Tag
      style={{
        position: "absolute", width: 1, height: 1,
        overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap",
      }}
      {...rest}>
      {children}
    </Tag>
  );
}

export default VisuallyHidden;
