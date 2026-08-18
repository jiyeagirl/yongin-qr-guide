import React from "react";
import { Input } from "./Input.jsx";

/* 업체명 검색 (U-ST-12). Input 의 검색 프리셋 — 화면마다 icon/placeholder/지우기 버튼을
   다시 조립하지 않도록 하나로 고정한다. 폰트 16px 은 Input 이 강제한다
   (iOS 사파리가 16px 미만 입력창에 포커스하면 화면을 자동 확대한다). */
export function SearchField({ value, onChange, onClear, placeholder = "업체명 검색", hint, elevated = false, style, ...rest }) {
  return (
    <Input type="search" icon="search" value={value} onChange={onChange} placeholder={placeholder}
      hint={hint} clearable onClear={onClear} elevated={elevated} aria-label={placeholder} style={style} {...rest} />
  );
}
