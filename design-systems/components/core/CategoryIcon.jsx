import React from "react";
import { Icon } from "./Icon.jsx";

/* The 7 recomposed business-category chips (spec 3-4). */
export const CATEGORY_ICONS = { all: "layout-grid", food: "utensils", cafe: "coffee", shop: "shopping-bag", beauty: "scissors", culture: "palette", etc: "ellipsis" };
export const CATEGORY_LABELS = { all: "전체", food: "음식", cafe: "카페/디저트", shop: "쇼핑", beauty: "미용/생활", culture: "여가/문화", etc: "기타" };

export function CategoryIcon({ type, size = 20, style, ...rest }) {
  return <Icon name={CATEGORY_ICONS[type] || "layout-grid"} size={size} style={style} {...rest} />;
}
