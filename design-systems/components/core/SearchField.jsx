import React from "react";
import { Input } from "./Input.jsx";

/* 업체명 검색 (U-ST-12). Input 의 검색 프리셋 — 화면마다 icon/placeholder/지우기 버튼을
   다시 조립하지 않도록 하나로 고정한다. 폰트 16px 은 Input 이 강제한다
   (iOS 사파리가 16px 미만 입력창에 포커스하면 화면을 자동 확대한다).

   ── ×는 하나다 (2026-08-24) ────────────────────────────────────────────────
   `type="search"` 라 **브라우저가 칸 안에 제 몫의 지우기 단추를 하나 더 그린다.**
   글자를 넣으면 ×가 둘 떴고, 그중 브라우저 것은 DOM 의 값만 지워 리액트 상태와 어긋나
   눌러도 아무 일이 없는 것처럼 보였다. 그 장식은 `tokens/base.css` 에서 걷어낸다 —
   타입은 그대로 둔다(읽어주는 도구의 「검색창」과 모바일 자판의 「검색」 키가 거기 달렸다).
   여기 남는 ×는 `clearable`/`onClear` 로 상태를 실제로 지우는 우리 것 하나다. */
export function SearchField({ value, onChange, onClear, placeholder = "업체명 검색", hint, elevated = false, style, ...rest }) {
  return (
    <Input type="search" icon="search" value={value} onChange={onChange} placeholder={placeholder}
      hint={hint} clearable onClear={onClear} elevated={elevated} aria-label={placeholder} style={style} {...rest} />
  );
}
