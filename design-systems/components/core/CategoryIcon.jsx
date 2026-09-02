import React from "react";
import { Icon } from "./Icon.jsx";

/* The 8 recomposed business-category chips (spec 3-4) — [전체] + 업종 일곱.

   `life` 는 2026-08-31 까지 `beauty`(「미용/생활」 · `scissors`)였다. 그 칩이 담는 것이
   수리 및 개인 하나에서 **수리 및 개인 · 보건의료**로 늘면서 이름이 「생활/편의」가
   됐고, 키와 그림도 함께 옮겼다 — 가위는 그중 하나(미용)만 가리키고, `beauty` 는
   의원이 든 자루의 이름일 수 없다. **이름이 값의 일부만 가리키면 나머지는 없는 것처럼
   읽힌다.** 벨(`concierge-bell`)은 업종이 아니라 「서비스를 받는 자리」를 가리켜,
   어느 하나로도 기울지 않는 유일한 그림이었다.

   `edu` 는 같은 날 그 자루에서 다시 나왔다 (사용자 요청) — **교육이 한 자루에 섞여 있기에는
   곳수가 많았다.** 자루에 든 것이 셋일 때는 이름이 셋을 덮어야 했지만, 그중 하나가 혼자
   설 만큼 크면 **덮는 이름을 찾는 것보다 꺼내는 편이 낫다** — 「생활/편의」는 학원을 찾는
   사람이 눌러 볼 이름이 아니고, 「교육」은 그 자체로 찾는 이름이다. */
export const CATEGORY_ICONS = { all: "layout-grid", food: "utensils", cafe: "coffee", shop: "shopping-bag", life: "concierge-bell", edu: "graduation-cap", culture: "palette", etc: "ellipsis" };
export const CATEGORY_LABELS = { all: "전체", food: "음식", cafe: "카페/디저트", shop: "쇼핑", life: "생활/편의", edu: "교육", culture: "여가/문화", etc: "기타" };

export function CategoryIcon({ type, size = 20, style, ...rest }) {
  return <Icon name={CATEGORY_ICONS[type] || "layout-grid"} size={size} style={style} {...rest} />;
}
