import React from "react";

const pascal = n => String(n).split(/[-_ ]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join("");

/* This Lucide build ships icons as a flat array of [tag, attrs] child pairs;
   older builds wrap them as ["svg", attrs, children]. Accept both. */
function children(data) {
  if (!Array.isArray(data)) return [];
  if (data[0] === "svg") return Array.isArray(data[2]) ? data[2] : [];
  return data;
}

/* Lucide line icon. name is the kebab-case Lucide id, e.g. "heart-pulse". */
export function Icon({ name, size = 24, strokeWidth, color, style, ...rest }) {
  const lib = (typeof window !== "undefined" && window.lucide && window.lucide.icons) || {};
  const data = lib[pascal(name)] || lib[name];
  const kids = children(data);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flex: "0 0 auto", ...style }} {...rest}>
      {kids.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
