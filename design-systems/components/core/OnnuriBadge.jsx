import React from "react";
import { Badge } from "./Badge.jsx";
import { Icon } from "./Icon.jsx";

/* 온누리 가맹 표시 (U-ST-06). 목록·상세·지도 마커에서 같은 기호로 읽혀야 하므로
   Badge tone="onnuri" 를 화면마다 새로 조립하지 않고 이 컴포넌트 하나로만 쓴다.
   지도 마커 색은 --pin-store-onnuri 로 같은 teal 계열을 공유한다. */
export function OnnuriBadge({ size = "md", label = "온누리", style, ...rest }) {
  const compact = size === "sm";
  return (
    /* 여백은 Badge 의 size 가 정한다. 예전에는 여기서 padding 을 덮어썼는데, 그러면
       같은 "작은 배지"가 두 곳에 따로 적혀 한쪽만 바뀐다 (2026-08-18). */
    <Badge tone="onnuri" size={size} style={style} {...rest}>
      <Icon name="ticket" size={compact ? 12 : 14} />
      {label}
    </Badge>
  );
}
