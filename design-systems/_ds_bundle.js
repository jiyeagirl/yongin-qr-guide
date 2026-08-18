/* @ds-bundle: {"format":4,"namespace":"DesignSystem_5c90e8","components":[{"name":"MASCOT_POSES","sourcePath":"components/brand/Mascot.jsx"},{"name":"Mascot","sourcePath":"components/brand/Mascot.jsx"},{"name":"MascotBubble","sourcePath":"components/brand/MascotBubble.jsx"},{"name":"StatTile","sourcePath":"components/brand/StatTile.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CATEGORY_ICONS","sourcePath":"components/core/CategoryIcon.jsx"},{"name":"CATEGORY_LABELS","sourcePath":"components/core/CategoryIcon.jsx"},{"name":"CategoryIcon","sourcePath":"components/core/CategoryIcon.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"FACILITY_ICONS","sourcePath":"components/core/FacilityIcon.jsx"},{"name":"FACILITY_LABELS","sourcePath":"components/core/FacilityIcon.jsx"},{"name":"EMERGENCY","sourcePath":"components/core/FacilityIcon.jsx"},{"name":"FacilityIcon","sourcePath":"components/core/FacilityIcon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"ListRow","sourcePath":"components/core/ListRow.jsx"},{"name":"PictogramTile","sourcePath":"components/core/PictogramTile.jsx"},{"name":"Radio","sourcePath":"components/core/Radio.jsx"},{"name":"SectionHeader","sourcePath":"components/core/SectionHeader.jsx"},{"name":"Select","sourcePath":"components/core/Select.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"FloatingControls","sourcePath":"components/feedback/FloatingControls.jsx"},{"name":"Notice","sourcePath":"components/feedback/Notice.jsx"},{"name":"Sheet","sourcePath":"components/feedback/Sheet.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"MapCanvas","sourcePath":"components/map/MapCanvas.jsx"},{"name":"AppBar","sourcePath":"components/navigation/AppBar.jsx"},{"name":"ContextBar","sourcePath":"components/navigation/ContextBar.jsx"},{"name":"ProgressSteps","sourcePath":"components/navigation/ProgressSteps.jsx"},{"name":"SegmentedTabs","sourcePath":"components/navigation/SegmentedTabs.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"}],"sourceHashes":{"components/brand/Mascot.jsx":"a01f630b271a","components/brand/MascotBubble.jsx":"9eafedbcf9e9","components/brand/StatTile.jsx":"3b4f631ef5fa","components/core/Badge.jsx":"0365f12f898b","components/core/Button.jsx":"1d831ffea272","components/core/Card.jsx":"9d3ff2c80325","components/core/CategoryIcon.jsx":"14838d589501","components/core/Checkbox.jsx":"2c3e9a55bc43","components/core/Chip.jsx":"9e0fe19e7202","components/core/FacilityIcon.jsx":"8d1f030dc23e","components/core/Icon.jsx":"75cd48b7f275","components/core/IconButton.jsx":"0276327d7f5e","components/core/Input.jsx":"c4fa8ce53fba","components/core/ListRow.jsx":"13dab07172fc","components/core/PictogramTile.jsx":"5cabf837cae1","components/core/Radio.jsx":"d50890b49a98","components/core/SectionHeader.jsx":"87a2f564c99b","components/core/Select.jsx":"208ee5c4088e","components/core/Switch.jsx":"165e0de24d8e","components/feedback/EmptyState.jsx":"74050a63ebca","components/feedback/FloatingControls.jsx":"8f18304b6bfe","components/feedback/Notice.jsx":"12d864023c3b","components/feedback/Sheet.jsx":"88a0549dfacf","components/feedback/Toast.jsx":"a18b1097c9eb","components/map/MapCanvas.jsx":"f7d09cc3b093","components/navigation/AppBar.jsx":"497958fda039","components/navigation/ContextBar.jsx":"44956ff0bf4a","components/navigation/ProgressSteps.jsx":"39ee9556efb3","components/navigation/SegmentedTabs.jsx":"a960cc4b3876","components/navigation/TabBar.jsx":"9840313b1f7e","ui_kits/qr_guide/App.jsx":"c37cff21cf0d","ui_kits/qr_guide/DistrictSheet.jsx":"39ed8d85e93b","ui_kits/qr_guide/data.js":"f703a89272f6"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_5c90e8 = window.DesignSystem_5c90e8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Mascot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MASCOT_POSES = ["front", "hello", "thumbsup", "excited", "curious", "surprised", "shy", "back", "glance", "sorry", "balloon", "thanks", "answer", "angry"];

/* 조아용 — the Yongin city mascot. Always PNG artwork, never redrawn. */
function Mascot({
  pose = "front",
  size = 96,
  bob = false,
  base = "",
  alt = "조아용",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    src: `${base}assets/character/joayong-${pose}.png`,
    alt: alt,
    width: size,
    height: size,
    style: {
      width: size,
      height: size,
      objectFit: "contain",
      animation: bob ? "yong-bob 2.6s var(--ease-standard) infinite" : "none",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { MASCOT_POSES, Mascot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Mascot.jsx", error: String((e && e.message) || e) }); }

// components/brand/MascotBubble.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* 조아용 speaking to the citizen — used for guidance, empty states, and confirmations. */
function MascotBubble({
  children,
  pose = "hello",
  size = 84,
  side = "left",
  tone = "cream",
  base = "",
  style,
  ...rest
}) {
  const bg = tone === "cream" ? "var(--brand-accent-soft)" : tone === "green" ? "var(--surface-brand-soft)" : "var(--surface-card)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: "var(--space-2)",
      flexDirection: side === "left" ? "row" : "row-reverse",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Mascot, {
    pose: pose,
    size: size,
    base: base,
    bob: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      background: bg,
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      font: "var(--type-body)",
      fontSize: "var(--fs-body-lg)",
      lineHeight: 1.55,
      color: "var(--text-heading)",
      marginBottom: 8
    }
  }, children, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      bottom: 14,
      [side === "left" ? "left" : "right"]: -6,
      width: 14,
      height: 14,
      background: bg,
      transform: "rotate(45deg)",
      borderRadius: 3
    }
  })));
}
Object.assign(__ds_scope, { MascotBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/MascotBubble.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: ["var(--surface-sunken)", "var(--text-body)"],
  brand: ["var(--brand-primary-soft)", "var(--yong-green-800)"],
  info: ["var(--state-info-soft)", "var(--yong-teal-700)"],
  success: ["var(--state-success-soft)", "var(--yong-green-800)"],
  warning: ["var(--state-warning-soft)", "#8a5a12"],
  danger: ["var(--state-danger-soft)", "#a5322b"],
  accent: ["var(--brand-accent)", "var(--yong-ink-900)"],
  onnuri: ["var(--state-info-soft)", "var(--yong-teal-900)"]
};
function Badge({
  children,
  tone = "neutral",
  dot = false,
  style,
  ...rest
}) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: bg,
      color: fg,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-micro)",
      fontWeight: "var(--fw-semibold)",
      lineHeight: 1.4,
      letterSpacing: "var(--ls-normal)",
      padding: "4px 9px",
      borderRadius: "var(--radius-pill)",
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: fg
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  tone = "plain",
  outlined = false,
  padding = "var(--space-5)",
  style,
  ...rest
}) {
  const tones = {
    plain: {
      background: "var(--surface-card)"
    },
    brand: {
      background: "var(--surface-brand-soft)"
    },
    accent: {
      background: "var(--brand-accent-soft)"
    },
    dark: {
      background: "var(--surface-dark)",
      color: "var(--text-on-dark)"
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: "var(--radius-card)",
      padding,
      border: outlined ? "var(--stroke-hairline) solid var(--border-brand)" : "var(--stroke-hairline) solid var(--border-default)",
      boxShadow: outlined ? "none" : "var(--shadow-card)",
      ...(tones[tone] || tones.plain),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const pascal = n => String(n).split(/[-_ ]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join("");

/* This Lucide build ships icons as a flat array of [tag, attrs] child pairs;
   older builds wrap them as ["svg", attrs, children]. Accept both. */
function children(data) {
  if (!Array.isArray(data)) return [];
  if (data[0] === "svg") return Array.isArray(data[2]) ? data[2] : [];
  return data;
}

/* Lucide line icon. name is the kebab-case Lucide id, e.g. "heart-pulse". */
function Icon({
  name,
  size = 24,
  strokeWidth,
  color,
  style,
  ...rest
}) {
  const lib = typeof window !== "undefined" && window.lucide && window.lucide.icons || {};
  const data = lib[pascal(name)] || lib[name];
  const kids = children(data);
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth: strokeWidth || 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    style: {
      flex: "0 0 auto",
      ...style
    }
  }, rest), kids.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/brand/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* A single number told plainly — used on dashboards and program status screens. */
function StatTile({
  label,
  value,
  unit,
  icon,
  tone = "plain",
  delta,
  style,
  ...rest
}) {
  const dark = tone === "dark";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: "var(--space-4)",
      borderRadius: "var(--radius-card)",
      background: dark ? "var(--surface-dark)" : tone === "brand" ? "var(--surface-brand-soft)" : "var(--surface-card)",
      border: dark ? "none" : "var(--stroke-hairline) solid var(--border-default)",
      boxShadow: dark ? "none" : "var(--shadow-card)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: dark ? "var(--yong-green-300)" : "var(--brand-secondary)"
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: dark ? "rgba(255,255,255,.72)" : "var(--text-muted)"
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: 24,
      lineHeight: 1.15,
      letterSpacing: "var(--ls-tight)",
      color: dark ? "var(--yong-white)" : "var(--text-heading)"
    }
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: dark ? "rgba(255,255,255,.72)" : "var(--text-muted)"
    }
  }, unit) : null), delta ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      font: "var(--type-micro)",
      color: dark ? "var(--yong-green-300)" : "var(--yong-green-700)"
    }
  }, delta) : null);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VARIANTS = {
  primary: {
    background: "var(--brand-primary)",
    color: "var(--text-on-brand)",
    border: "none"
  },
  secondary: {
    background: "var(--brand-secondary)",
    color: "var(--text-on-dark)",
    border: "none"
  },
  soft: {
    background: "var(--brand-primary-soft)",
    color: "var(--yong-green-800)",
    border: "none"
  },
  outline: {
    background: "var(--surface-card)",
    color: "var(--text-heading)",
    border: "var(--stroke-hairline) solid var(--border-strong)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    border: "none"
  },
  danger: {
    background: "var(--state-danger)",
    color: "var(--text-on-dark)",
    border: "none"
  }
};
/* Heights are minimums — buttons grow with the label so 2차 글자 확대에서 잘리지 않는다. */
const SIZES = {
  sm: {
    minHeight: 40,
    padding: "8px 14px",
    fontSize: "var(--fs-label)",
    radius: "var(--radius-sm)",
    icon: 16
  },
  md: {
    minHeight: "var(--tap-min)",
    padding: "11px 18px",
    fontSize: "var(--fs-body)",
    radius: "var(--radius-control)",
    icon: 20
  },
  lg: {
    minHeight: 52,
    padding: "14px 22px",
    fontSize: "var(--fs-body-lg)",
    radius: "var(--radius-lg)",
    icon: 22
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  block,
  disabled,
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    style: {
      display: block ? "flex" : "inline-flex",
      width: block ? "100%" : undefined,
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-2)",
      minHeight: s.minHeight,
      padding: s.padding,
      fontFamily: "var(--font-sans)",
      fontSize: s.fontSize,
      fontWeight: variant === "ghost" ? "var(--fw-semibold)" : "var(--fw-bold)",
      lineHeight: 1.35,
      letterSpacing: "var(--ls-snug)",
      borderRadius: s.radius,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "transform var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)",
      opacity: disabled ? 0.42 : 1,
      ...v,
      ...style
    },
    onPointerDown: e => {
      if (!disabled) e.currentTarget.style.transform = "scale(var(--press-scale))";
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = "none";
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = "none";
    }
  }, rest), icon ? typeof icon === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : icon : null, children, iconEnd ? typeof iconEnd === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd,
    size: s.icon
  }) : iconEnd : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/CategoryIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The 7 recomposed business-category chips (spec 3-4). */
const CATEGORY_ICONS = {
  all: "layout-grid",
  food: "utensils",
  cafe: "coffee",
  shop: "shopping-bag",
  beauty: "scissors",
  culture: "palette",
  etc: "ellipsis"
};
const CATEGORY_LABELS = {
  all: "전체",
  food: "음식",
  cafe: "카페/디저트",
  shop: "쇼핑",
  beauty: "미용/생활",
  culture: "여가/문화",
  etc: "기타"
};
function CategoryIcon({
  type,
  size = 20,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Icon, _extends({
    name: CATEGORY_ICONS[type] || "layout-grid",
    size: size,
    style: style
  }, rest));
}
Object.assign(__ds_scope, { CATEGORY_ICONS, CATEGORY_LABELS, CategoryIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/CategoryIcon.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--space-3)",
      minHeight: "var(--tap-min)",
      padding: "10px 0",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      flex: "0 0 auto",
      borderRadius: "var(--radius-xs)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: checked ? "var(--brand-primary)" : "var(--surface-card)",
      border: checked ? "var(--stroke-hairline) solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)",
      transition: "all var(--dur-fast) var(--ease-standard)"
    }
  }, checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    color: "var(--yong-white)"
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body)",
      color: "var(--text-body)",
      lineHeight: 1.5
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Filter pill. icon accepts a Lucide name or a ready element (CategoryIcon). */
function Chip({
  children,
  selected = false,
  icon,
  count,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
      flex: "0 0 auto",
      minHeight: "var(--tap-min)",
      padding: icon ? "9px 14px 9px 12px" : "9px 14px",
      borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-semibold)",
      lineHeight: 1.3,
      cursor: "pointer",
      transition: "all var(--dur-fast) var(--ease-standard)",
      background: selected ? "var(--brand-primary)" : "var(--surface-card)",
      color: selected ? "var(--text-on-brand)" : "var(--text-body)",
      border: selected ? "var(--stroke-hairline) solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)",
      ...style
    }
  }, rest), icon ? typeof icon === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17
  }) : icon : null, children, count != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-medium)",
      opacity: selected ? 0.85 : 0.6
    }
  }, count) : null);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/FacilityIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* 4 public-facility types. Swap a glyph here and every screen follows. */
const FACILITY_ICONS = {
  aed: "heart-pulse",
  toilet: "toilet",
  rest: "armchair",
  shelter: "shield"
};
const FACILITY_LABELS = {
  aed: "AED",
  toilet: "화장실",
  rest: "쉼터",
  shelter: "대피소"
};
const EMERGENCY = ["aed", "shelter"];
function FacilityIcon({
  type,
  size = 24,
  emphasis = true,
  style,
  ...rest
}) {
  const color = emphasis && EMERGENCY.includes(type) ? "var(--pin-emergency)" : undefined;
  return /*#__PURE__*/React.createElement(__ds_scope.Icon, _extends({
    name: FACILITY_ICONS[type] || "map-pin",
    size: size,
    color: color,
    style: style
  }, rest));
}
Object.assign(__ds_scope, { FACILITY_ICONS, FACILITY_LABELS, EMERGENCY, FacilityIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/FacilityIcon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  name,
  label,
  size = 44,
  variant = "ghost",
  style,
  ...rest
}) {
  const skins = {
    ghost: {
      background: "transparent",
      border: "none",
      color: "var(--text-heading)"
    },
    soft: {
      background: "var(--surface-sunken)",
      border: "none",
      color: "var(--text-heading)"
    },
    outline: {
      background: "var(--surface-card)",
      border: "var(--stroke-hairline) solid var(--border-strong)",
      color: "var(--text-heading)"
    },
    brand: {
      background: "var(--brand-primary)",
      border: "none",
      color: "var(--text-on-brand)"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    style: {
      width: size,
      height: size,
      minWidth: "var(--tap-min)",
      minHeight: "var(--tap-min)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      ...(skins[variant] || skins.ghost),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: 22
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? "var(--state-danger)" : focus ? "var(--brand-secondary)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-heading)",
      marginBottom: 6
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: "var(--tap-comfortable)",
      padding: "10px 14px",
      background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
      border: `var(--stroke-hairline) solid ${borderColor}`,
      borderRadius: "var(--radius-control)",
      boxShadow: focus ? "var(--shadow-focus)" : "none",
      transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)"
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20,
    color: "var(--yong-ink-300)"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: 16,
      color: "var(--text-heading)",
      letterSpacing: "var(--ls-normal)"
    }
  }, rest))), error || hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-caption)",
      color: error ? "var(--state-danger)" : "var(--text-muted)",
      marginTop: 6
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* One row of a facility / store / notice list. Variable height — never a fixed px height. */
function ListRow({
  title,
  meta,
  tag,
  icon,
  trailing = "chevron",
  divider = true,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--space-3)",
      minHeight: "var(--tap-comfortable)",
      padding: "var(--space-3) 0",
      borderBottom: divider ? "var(--stroke-hairline) solid var(--border-default)" : "none",
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 auto",
      paddingTop: 2,
      color: "var(--text-muted)"
    }
  }, typeof icon === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22
  }) : icon) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-heading)",
      lineHeight: 1.4
    }
  }, title), tag), meta ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)",
      marginTop: 3,
      lineHeight: 1.45
    }
  }, meta) : null), trailing === "chevron" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 20,
    color: "var(--yong-ink-300)",
    style: {
      marginTop: 3
    }
  }) : trailing);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/core/PictogramTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Category entry tile: a bare Lucide glyph over a Korean label. No tinted square, no fill. */
function PictogramTile({
  icon,
  label,
  caption,
  emergency = false,
  badge,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-2)",
      minHeight: 96,
      padding: "var(--space-4) var(--space-3)",
      background: "var(--surface-card)",
      border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-card)",
      cursor: "pointer",
      transition: "transform var(--dur-fast) var(--ease-standard)",
      ...style
    },
    onPointerDown: e => {
      e.currentTarget.style.transform = "scale(var(--press-scale))";
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = "none";
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = "none";
    }
  }, rest), typeof icon === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 28,
    color: emergency ? "var(--pin-emergency)" : "var(--text-heading)"
  }) : icon, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-heading)",
      letterSpacing: "var(--ls-snug)",
      textAlign: "center"
    }
  }, label), caption ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)",
      textAlign: "center"
    }
  }, caption) : null, badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 10,
      padding: "1px 6px",
      borderRadius: 999,
      background: "var(--state-danger)",
      color: "#fff",
      fontSize: "var(--fs-micro)",
      fontWeight: "var(--fw-semibold)"
    }
  }, badge) : null);
}
Object.assign(__ds_scope, { PictogramTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PictogramTile.jsx", error: String((e && e.message) || e) }); }

// components/core/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  label,
  checked,
  onChange,
  name,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      minHeight: "var(--tap-min)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    checked: !!checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      flex: "0 0 auto",
      borderRadius: 999,
      background: "var(--surface-card)",
      border: checked ? "7px solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)",
      boxShadow: "none",
      transition: "all var(--dur-fast) var(--ease-standard)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-body)"
    }
  }, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Radio.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SectionHeader({
  title,
  action,
  onAction,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-3)",
      marginBottom: "var(--space-3)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--type-title-3)",
      letterSpacing: "var(--ls-snug)"
    }
  }, title), action ? /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      background: "none",
      border: "none",
      padding: 0,
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      cursor: "pointer"
    }
  }, action, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron_right",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  options = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-heading)",
      marginBottom: 6
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange,
    style: {
      appearance: "none",
      width: "100%",
      minHeight: "var(--tap-comfortable)",
      padding: "10px 40px 10px 14px",
      background: "var(--surface-card)",
      border: "var(--stroke-hairline) solid var(--border-strong)",
      borderRadius: "var(--radius-control)",
      fontFamily: "var(--font-sans)",
      fontSize: 16,
      color: "var(--text-heading)"
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 20,
    color: "var(--yong-ink-500)"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Select.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  checked,
  onChange,
  label,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 50,
      height: 30,
      borderRadius: 999,
      background: checked ? "var(--brand-primary)" : "var(--yong-ink-200)",
      border: "var(--stroke-hairline) solid " + (checked ? "var(--brand-primary)" : "var(--border-strong)"),
      padding: 2,
      display: "inline-flex",
      justifyContent: checked ? "flex-end" : "flex-start",
      transition: "background var(--dur-base) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 999,
      background: "#fff",
      boxShadow: "0 1px 3px rgba(22,34,28,.28)",
      transition: "transform var(--dur-base) var(--ease-bounce)"
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-body)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function EmptyState({
  title,
  description,
  action,
  pose = "curious",
  base = "",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "var(--space-2)",
      padding: "var(--space-8) var(--space-5)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Mascot, {
    pose: pose,
    size: 110,
    base: base
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--type-title-3)",
      marginTop: "var(--space-2)"
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-muted)",
      maxWidth: 280
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-3)"
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/FloatingControls.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Floating map controls. Anchored to the sheet's top edge so they ride up with it (spec 5-3 #3),
   but clamped to the map area and faded out at the full snap, where the sheet owns the surface. */
function FloatingControls({
  bottom = "var(--sheet-half)",
  hidden = false,
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "absolute",
      right: "var(--space-4)",
      bottom: `min(calc(${bottom} + var(--space-3)), calc(100% - var(--tap-min) - var(--space-3)))`,
      zIndex: "var(--z-float)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      opacity: hidden ? 0 : 1,
      pointerEvents: hidden ? "none" : "auto",
      transition: "bottom var(--dur-slow) var(--ease-out), opacity var(--dur-base) var(--ease-standard)",
      ...style
    }
  }, rest), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.label,
    onClick: it.onClick,
    "aria-label": it.label,
    title: it.label,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: "var(--tap-min)",
      padding: it.text ? "10px 14px" : "0 12px",
      minWidth: "var(--tap-min)",
      justifyContent: "center",
      background: "var(--surface-card)",
      border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-pill)",
      boxShadow: "var(--shadow-raised)",
      cursor: "pointer",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-heading)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 20
  }), it.text)));
}
Object.assign(__ds_scope, { FloatingControls });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/FloatingControls.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Notice.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: ["var(--state-info-soft)", "var(--yong-teal-700)", "info"],
  success: ["var(--state-success-soft)", "var(--yong-green-800)", "circle-check"],
  warning: ["var(--state-warning-soft)", "#8a5a12", "triangle-alert"],
  danger: ["var(--state-danger-soft)", "#a5322b", "circle-alert"]
};

/* Inline advisory. Also used for the 원거리 안내 배너 (U-FC-09) — never show an empty result screen. */
function Notice({
  children,
  tone = "info",
  title,
  style,
  ...rest
}) {
  const [bg, fg, icon] = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      gap: "var(--space-3)",
      padding: "var(--space-4)",
      background: bg,
      borderRadius: "var(--radius-md)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20,
    color: fg,
    style: {
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-bold)",
      color: fg,
      marginBottom: 3
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body)",
      lineHeight: 1.55,
      color: "var(--text-body)"
    }
  }, children)));
}
Object.assign(__ds_scope, { Notice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Notice.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Sheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SNAP = {
  collapsed: "var(--sheet-collapsed)",
  half: "var(--sheet-half)",
  full: "var(--sheet-full)"
};
const ORDER = ["collapsed", "half", "full"];

/* Map bottom sheet — 3 snap points (25 / 55 / 90% of the frame).
   Drag or tap the handle to cycle. Renders inside its positioned parent, and scrims only at "full". */
function Sheet({
  open = true,
  title,
  subtitle,
  children,
  snap = "half",
  onSnapChange,
  onClose,
  scrim = false,
  style,
  ...rest
}) {
  const startY = React.useRef(null);
  if (!open) return null;
  const cycle = () => {
    const i = ORDER.indexOf(snap);
    onSnapChange && onSnapChange(ORDER[(i + 1) % ORDER.length]);
  };
  const end = y => {
    if (startY.current == null) return;
    const dy = y - startY.current;
    startY.current = null;
    if (Math.abs(dy) < 24) return cycle();
    const i = ORDER.indexOf(snap);
    const next = dy < 0 ? Math.min(i + 1, 2) : Math.max(i - 1, 0);
    onSnapChange && onSnapChange(ORDER[next]);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, scrim || snap === "full" ? /*#__PURE__*/React.createElement("div", {
    onClick: () => onSnapChange && onSnapChange("half"),
    style: {
      position: "absolute",
      inset: 0,
      zIndex: "var(--z-modal)",
      background: "var(--overlay-scrim)",
      opacity: snap === "full" ? 1 : 0,
      pointerEvents: snap === "full" ? "auto" : "none",
      transition: "opacity var(--dur-slow) var(--ease-standard)"
    }
  }) : null, /*#__PURE__*/React.createElement("section", _extends({
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: SNAP[snap] || SNAP.half,
      zIndex: "var(--z-sheet)",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-card)",
      borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0",
      boxShadow: "var(--shadow-sheet)",
      transition: "height var(--dur-slow) var(--ease-out)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    onPointerDown: e => {
      startY.current = e.clientY;
    },
    onPointerUp: e => end(e.clientY),
    style: {
      flex: "0 0 auto",
      padding: "10px 0 6px",
      cursor: "grab",
      touchAction: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 44,
      height: 5,
      borderRadius: 999,
      background: "var(--border-strong)",
      margin: "0 auto"
    }
  })), title ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--space-3)",
      padding: "0 var(--gutter-screen) var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-bold)",
      letterSpacing: "var(--ls-snug)"
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, subtitle) : null), onClose ? /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "\uB2EB\uAE30",
    style: {
      width: 44,
      height: 44,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-muted)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 22
  })) : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overscrollBehavior: "contain"
    }
  }, children)));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Toast({
  children,
  tone = "dark",
  icon = "circle-check",
  style,
  ...rest
}) {
  const dark = tone === "dark";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      padding: "12px 16px",
      borderRadius: "var(--radius-pill)",
      zIndex: "var(--z-toast)",
      background: dark ? "rgba(22,34,28,.92)" : "var(--brand-primary)",
      color: dark ? "var(--text-on-dark)" : "var(--text-on-brand)",
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      boxShadow: "var(--shadow-raised)",
      animation: "yong-pop var(--dur-base) var(--ease-bounce)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  }), children);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/map/MapCanvas.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Placeholder for the 카카오맵 SDK surface. Renders the anchor marker, clusters and
   pins at fake positions so overlay geometry can be judged; it is not a real map.
   bottomPad mirrors the sheet snap so a tapped marker is never hidden (spec 5-3 #2). */
function MapCanvas({
  anchorLabel = "QR 지점",
  clusters = [],
  pins = [],
  bottomPad = "var(--map-pad-half)",
  note = "지도 영역 · 카카오맵 SDK 연동 예정",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "absolute",
      inset: 0,
      zIndex: "var(--z-map)",
      overflow: "hidden",
      background: "repeating-linear-gradient(0deg,#e9efe9 0 1px,transparent 1px 42px),repeating-linear-gradient(90deg,#e9efe9 0 1px,transparent 1px 42px),var(--surface-sunken)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      bottom: bottomPad,
      transition: "bottom var(--dur-slow) var(--ease-out)"
    }
  }, clusters.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.label,
    style: {
      position: "absolute",
      left: c.x,
      top: c.y,
      transform: "translate(-50%,-50%)",
      zIndex: "var(--z-marker)",
      minWidth: 44,
      minHeight: 44,
      padding: "0 10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "rgba(47,146,96,.92)",
      color: "#fff",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-bold)",
      boxShadow: "var(--shadow-raised)"
    }
  }, c.label)), pins.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.label,
    style: {
      position: "absolute",
      left: p.x,
      top: p.y,
      transform: "translate(-50%,-100%)",
      zIndex: "var(--z-marker)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "999px 999px 999px 2px",
      transform: "rotate(-45deg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface-card)",
      border: `2px solid ${p.emergency ? "var(--pin-emergency)" : "var(--pin-neutral)"}`,
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      transform: "rotate(45deg)",
      color: p.emergency ? "var(--pin-emergency)" : "var(--pin-neutral)",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: p.icon,
    size: 17
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "46%",
      transform: "translate(-50%,-50%)",
      zIndex: "var(--z-marker)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 999,
      background: "var(--brand-primary)",
      border: "3px solid #fff",
      boxShadow: "0 0 0 6px rgba(47,146,96,.22)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "3px 8px",
      borderRadius: 999,
      background: "rgba(22,34,28,.86)",
      color: "#fff",
      fontSize: "var(--fs-micro)",
      fontWeight: "var(--fw-semibold)",
      whiteSpace: "nowrap"
    }
  }, anchorLabel))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "var(--space-3)",
      top: "var(--space-3)",
      padding: "5px 10px",
      borderRadius: "var(--radius-xs)",
      background: "rgba(255,255,255,.86)",
      fontSize: "var(--fs-micro)",
      color: "var(--text-muted)"
    }
  }, note));
}
Object.assign(__ds_scope, { MapCanvas });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapCanvas.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Sticky top bar. 2차의 언어·음성·글자크기 버튼 자리는 코드에서만 비워둔다 — 화면에 노출하지 않는다. */
function AppBar({
  title,
  back = false,
  onBack,
  actions,
  tone = "plain",
  style,
  ...rest
}) {
  const brand = tone === "brand";
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      position: "sticky",
      top: 0,
      zIndex: "var(--z-filter)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: "var(--appbar-h)",
      padding: "6px var(--space-2)",
      background: brand ? "var(--brand-primary)" : "rgba(255,255,255,.94)",
      backdropFilter: brand ? "none" : "var(--blur-glass)",
      borderBottom: brand ? "none" : "var(--stroke-hairline) solid var(--border-default)",
      color: brand ? "var(--text-on-brand)" : "var(--text-heading)",
      ...style
    }
  }, rest), back ? /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "\uB4A4\uB85C",
    style: {
      width: 44,
      height: 44,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "none",
      border: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-left",
    size: 24
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      flex: 1,
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-bold)",
      color: "inherit",
      letterSpacing: "var(--ls-snug)",
      lineHeight: 1.35,
      textAlign: back ? "center" : "left",
      paddingRight: back ? 44 : 0
    }
  }, title), actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 2
    }
  }, actions) : null);
}
Object.assign(__ds_scope, { AppBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ContextBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Always-on reminder of the QR anchor point. The service never tracks live GPS,
   so the reference point must stay visible (U-CM-04). */
function ContextBar({
  place,
  note = "QR 스캔 지점 기준",
  onReset,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      padding: "10px var(--gutter-screen)",
      background: "var(--surface-brand-soft)",
      borderBottom: "var(--stroke-hairline) solid var(--yong-green-100)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "qr-code",
    size: 18,
    color: "var(--brand-primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: "var(--fs-caption)",
      color: "var(--text-body)",
      lineHeight: 1.4
    }
  }, "\uD604\uC7AC \uC704\uCE58 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-heading)"
    }
  }, place), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, " \xB7 ", note)), onReset ? /*#__PURE__*/React.createElement("button", {
    onClick: onReset,
    style: {
      background: "none",
      border: "none",
      padding: "6px 0",
      cursor: "pointer",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--brand-primary)"
    }
  }, "\uAE30\uC900\uC810 \uBCF4\uAE30") : null);
}
Object.assign(__ds_scope, { ContextBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ContextBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ProgressSteps.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressSteps({
  steps = [],
  current = 0,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "flex-start",
      ...style
    }
  }, rest), steps.map((s, i) => {
    const done = i < current,
      now = i === current;
    return /*#__PURE__*/React.createElement("div", {
      key: s,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        position: "relative"
      }
    }, i > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: 13,
        right: "50%",
        width: "100%",
        height: 2,
        background: done || now ? "var(--brand-primary)" : "var(--border-default)"
      }
    }) : null, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        width: 28,
        height: 28,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--fs-micro)",
        fontWeight: "var(--fw-bold)",
        background: done ? "var(--brand-primary)" : now ? "var(--surface-card)" : "var(--surface-sunken)",
        border: now ? "var(--stroke-outline) solid var(--brand-primary)" : "none",
        color: done ? "var(--yong-white)" : now ? "var(--brand-primary)" : "var(--text-disabled)"
      }
    }, done ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 16,
      color: "var(--yong-white)"
    }) : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--fs-micro)",
        color: now ? "var(--text-heading)" : "var(--text-muted)",
        textAlign: "center"
      }
    }, s));
  }));
}
Object.assign(__ds_scope, { ProgressSteps });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ProgressSteps.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedTabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* In-page segmented control. Underline style for content switching. */
function SegmentedTabs({
  items = [],
  value,
  onChange,
  variant = "underline",
  style,
  ...rest
}) {
  if (variant === "pill") {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: "inline-flex",
        padding: 4,
        gap: 4,
        background: "var(--surface-sunken)",
        borderRadius: "var(--radius-pill)",
        ...style
      }
    }, rest), items.map(it => {
      const on = it.id === value;
      return /*#__PURE__*/React.createElement("button", {
        key: it.id,
        onClick: () => onChange && onChange(it.id),
        style: {
          height: 36,
          padding: "0 16px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          font: "var(--type-label)",
          background: on ? "var(--surface-card)" : "transparent",
          color: on ? "var(--text-heading)" : "var(--text-muted)",
          boxShadow: on ? "var(--shadow-card)" : "none"
        }
      }, it.label);
    }));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      gap: "var(--space-5)",
      borderBottom: "var(--stroke-hairline) solid var(--border-default)",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onChange && onChange(it.id),
      style: {
        position: "relative",
        padding: "12px 2px",
        background: "none",
        border: "none",
        cursor: "pointer",
        font: on ? "var(--fw-bold) var(--fs-body-lg)/1.4 var(--font-sans)" : "var(--type-body-lg)",
        color: on ? "var(--text-heading)" : "var(--text-muted)"
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 3,
        borderRadius: 3,
        background: on ? "var(--brand-primary)" : "transparent"
      }
    }));
  }));
}
Object.assign(__ds_scope, { SegmentedTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedTabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TabBar({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      position: "relative",
      zIndex: "var(--z-filter)",
      display: "grid",
      gridTemplateColumns: `repeat(${items.length || 1}, 1fr)`,
      minHeight: "var(--tabbar-h)",
      background: "var(--surface-card)",
      borderTop: "var(--stroke-hairline) solid var(--border-default)",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onChange && onChange(it.id),
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "8px 4px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: on ? "var(--brand-primary)" : "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 24
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--fs-micro)",
        fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)"
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qr_guide/App.jsx
try { (() => {
const {
  AppBar,
  ContextBar,
  IconButton,
  MapCanvas,
  Sheet,
  FloatingControls,
  Toast
} = window.DesignSystem_5c90e8;
function App() {
  const d = window.DUNJEON;
  const [snap, setSnap] = React.useState("half");
  const [cat, setCat] = React.useState("all");
  const [onnuriOnly, setOnnuriOnly] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [toast, setToast] = React.useState(null);
  const pad = {
    collapsed: "var(--map-pad-collapsed)",
    half: "var(--map-pad-half)",
    full: "var(--map-pad-full)"
  }[snap];
  const say = m => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 390,
      height: 844,
      overflow: "hidden",
      background: "var(--surface-page)",
      borderRadius: 28,
      border: "var(--stroke-hairline) solid var(--border-default)",
      boxShadow: "0 18px 48px rgba(22,34,28,.18)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: "var(--z-filter)"
    }
  }, /*#__PURE__*/React.createElement(AppBar, {
    back: true,
    onBack: () => say("이전 화면으로 (S02 홈)"),
    title: "\uB454\uC804 \uACE8\uBAA9\uD615 \uC0C1\uC810\uAC00",
    actions: /*#__PURE__*/React.createElement(IconButton, {
      name: "flag",
      label: "\uC624\uB958 \uC2E0\uACE0",
      onClick: () => say("오류 신고 화면으로 (S12)")
    })
  }), /*#__PURE__*/React.createElement(ContextBar, {
    place: d.anchor,
    onReset: () => {
      setSnap("collapsed");
      say("QR 지점으로 이동했습니다");
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(MapCanvas, {
    anchorLabel: d.anchor,
    bottomPad: pad,
    clusters: [{
      label: "128",
      x: "30%",
      y: "26%"
    }, {
      label: "76",
      x: "68%",
      y: "20%"
    }, {
      label: "41",
      x: "52%",
      y: "34%"
    }],
    pins: [{
      label: "AED",
      icon: "heart-pulse",
      x: "22%",
      y: "40%",
      emergency: true
    }, {
      label: "화장실",
      icon: "toilet",
      x: "76%",
      y: "38%"
    }]
  }), /*#__PURE__*/React.createElement(FloatingControls, {
    hidden: snap === "full",
    bottom: {
      collapsed: "var(--sheet-collapsed)",
      half: "var(--sheet-half)",
      full: "var(--sheet-full)"
    }[snap],
    items: [{
      icon: "list",
      label: "목록으로",
      text: "목록",
      onClick: () => setSnap("full")
    }, {
      icon: "qr-code",
      label: "QR 지점으로",
      onClick: () => {
        setSnap("collapsed");
        say("QR 지점으로 이동했습니다");
      }
    }]
  }), /*#__PURE__*/React.createElement(Sheet, {
    title: d.district.name,
    subtitle: `${d.district.area} · 점포 ${d.district.stores} · 온누리 ${d.district.onnuri}`,
    snap: snap,
    onSnapChange: setSnap
  }, /*#__PURE__*/React.createElement(window.DistrictSheet, {
    data: d,
    cat: cat,
    setCat: setCat,
    onnuriOnly: onnuriOnly,
    setOnnuriOnly: setOnnuriOnly,
    q: q,
    setQ: setQ,
    onPickStore: () => say("점포 상세로 (S08)"),
    onOpenFestival: () => say("축제 상세로 (S11)")
  })), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 24,
      zIndex: "var(--z-toast)",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    icon: "info"
  }, toast))));
}
window.App = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qr_guide/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qr_guide/DistrictSheet.jsx
try { (() => {
const {
  Chip,
  CategoryIcon,
  CATEGORY_LABELS,
  Badge,
  Input,
  Switch,
  Button,
  ListRow,
  FacilityIcon,
  Icon,
  SectionHeader,
  Notice
} = window.DesignSystem_5c90e8;
function StoreRow({
  s,
  onPick
}) {
  return /*#__PURE__*/React.createElement(ListRow, {
    onClick: onPick,
    icon: /*#__PURE__*/React.createElement(CategoryIcon, {
      type: s.cat,
      size: 22
    }),
    title: s.name,
    tag: s.onnuri ? /*#__PURE__*/React.createElement(Badge, {
      tone: "onnuri"
    }, "\uC628\uB204\uB9AC") : null,
    meta: `${s.biz} · 약 ${s.dist}m, 도보 ${Math.max(1, Math.round(s.dist / 67))}분 · ${s.addr}`
  });
}
function DistrictSheet({
  data,
  cat,
  setCat,
  onnuriOnly,
  setOnnuriOnly,
  q,
  setQ,
  onPickStore,
  onOpenFestival
}) {
  let rows = data.stores.filter(s => (cat === "all" || s.cat === cat) && (!onnuriOnly || s.onnuri) && (!q || s.name.includes(q)));
  const shown = data.chips.find(c => c.id === cat);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: "var(--space-9)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 var(--gutter-screen) var(--space-4)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpenFestival,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      padding: "var(--space-3) var(--space-4)",
      background: "var(--brand-accent-soft)",
      border: "var(--stroke-hairline) solid var(--yong-cream-300)",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "party-popper",
    size: 22,
    color: "var(--yong-cream-900)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-bold)",
      color: "var(--text-heading)"
    }
  }, data.festival.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--fs-caption)",
      color: "var(--text-body)",
      marginTop: 2
    }
  }, data.festival.state, " \xB7 ", data.festival.date)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 20,
    color: "var(--yong-ink-300)"
  })), /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "\uC5C5\uCCB4\uBA85 \uAC80\uC0C9",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-3)",
      padding: "var(--space-2) 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "var(--fs-body)",
      color: "var(--text-heading)",
      fontWeight: "var(--fw-semibold)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ticket",
    size: 20,
    color: "var(--brand-secondary)"
  }), "\uC628\uB204\uB9AC \uAC00\uB9F9\uC810\uB9CC", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-muted)"
    }
  }, data.district.onnuri, "\uACF3")), /*#__PURE__*/React.createElement(Switch, {
    checked: onnuriOnly,
    onChange: setOnnuriOnly
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 8,
      overflowX: "auto",
      padding: "var(--space-3) var(--gutter-screen)",
      background: "rgba(255,255,255,.96)",
      backdropFilter: "var(--blur-glass)",
      borderBottom: "var(--stroke-hairline) solid var(--border-default)"
    }
  }, data.chips.filter(c => c.count > 0).map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c.id,
    selected: cat === c.id,
    count: c.count,
    icon: /*#__PURE__*/React.createElement(CategoryIcon, {
      type: c.id,
      size: 18
    }),
    onClick: () => setCat(c.id)
  }, c.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-4) var(--gutter-screen) 0"
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: `신규 · 인기 매장`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-2)",
      overflowX: "auto",
      paddingBottom: "var(--space-2)"
    }
  }, data.popular.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.name,
    onClick: onPickStore,
    style: {
      flex: "0 0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      minWidth: 148,
      padding: "var(--space-4)",
      textAlign: "left",
      background: "var(--surface-card)",
      border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-card)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(CategoryIcon, {
    type: p.cat,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-bold)",
      color: "var(--text-heading)"
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)"
    }
  }, p.note))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--gutter-screen) 0"
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: `${CATEGORY_LABELS[cat] || "전체"} ${rows.length}곳`,
    action: "\uAC70\uB9AC\uC21C"
  }), rows.length === 0 ? /*#__PURE__*/React.createElement(Notice, {
    tone: "info"
  }, "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uB9E4\uC7A5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC5C5\uC885 \uCE69\uC774\uB098 \uC628\uB204\uB9AC \uC870\uAC74\uC744 \uBC14\uAFD4\uBCF4\uC138\uC694.") : rows.map((s, i) => /*#__PURE__*/React.createElement(StoreRow, {
    key: s.name,
    s: s,
    onPick: onPickStore
  })), rows.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      padding: "var(--space-4) 0"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "chevron-down"
  }, "\uB354 \uBCF4\uAE30 (", Math.max(0, (shown ? shown.count : rows.length) - rows.length), "\uACF3)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--gutter-screen) 0"
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "\uC778\uADFC \uD3B8\uC758\uC2DC\uC124"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)",
      padding: "var(--space-2) var(--space-4)"
    }
  }, data.nearby.map((n, i) => /*#__PURE__*/React.createElement(ListRow, {
    key: n.name,
    icon: /*#__PURE__*/React.createElement(FacilityIcon, {
      type: n.type,
      size: 22
    }),
    title: n.name,
    meta: n.detail,
    divider: i < data.nearby.length - 1,
    onClick: onPickStore
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--gutter-screen) 0",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    block: true,
    icon: "store"
  }, "\uB2E4\uB978 \uC0C1\uC810\uAC00 \uB458\uB7EC\uBCF4\uAE30 (32\uAC1C\uC18C)"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)",
      lineHeight: 1.5
    }
  }, "\uC810\uD3EC \uC815\uBCF4 ", data.district.asOf, " \xB7 \uC548\uB0B4 \uC815\uBCF4\uB294 \uCC38\uACE0\uC6A9\uC785\uB2C8\uB2E4. \uC751\uAE09 \uC0C1\uD669\uC5D0\uB294 119\uB85C \uC5F0\uB77D\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/React.createElement("button", {
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: "var(--tap-min)",
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-link)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flag",
    size: 16
  }), "\uC815\uBCF4 \uC624\uB958 \uC2E0\uACE0")));
}
window.DistrictSheet = DistrictSheet;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qr_guide/DistrictSheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qr_guide/data.js
try { (() => {
window.DUNJEON = {
  district: {
    name: "둔전 골목형 상점가",
    area: "처인구 포곡읍 둔전리 일원",
    stores: 335,
    onnuri: 139,
    asOf: "2026.06 기준"
  },
  anchor: "둔전 시장 입구 버스정류장",
  chips: [{
    id: "all",
    label: "전체",
    count: 335
  }, {
    id: "food",
    label: "음식",
    count: 132
  }, {
    id: "cafe",
    label: "카페/디저트",
    count: 18
  }, {
    id: "shop",
    label: "쇼핑",
    count: 53
  }, {
    id: "beauty",
    label: "미용/생활",
    count: 43
  }, {
    id: "culture",
    label: "여가/문화",
    count: 30
  }, {
    id: "etc",
    label: "기타",
    count: 59
  }],
  stores: [{
    name: "둔전분식",
    cat: "food",
    biz: "한식",
    dist: 90,
    onnuri: true,
    addr: "포곡읍 둔전로 12"
  }, {
    name: "카페 온담",
    cat: "cafe",
    biz: "커피전문점",
    dist: 140,
    onnuri: true,
    addr: "포곡읍 둔전로 18"
  }, {
    name: "둔전정육점",
    cat: "shop",
    biz: "정육",
    dist: 180,
    onnuri: true,
    addr: "포곡읍 둔전로 21"
  }, {
    name: "행복미용실",
    cat: "beauty",
    biz: "미용실",
    dist: 210,
    onnuri: false,
    addr: "포곡읍 둔전로 24"
  }, {
    name: "포곡문구",
    cat: "shop",
    biz: "문구·완구",
    dist: 240,
    onnuri: true,
    addr: "포곡읍 둔전로 30"
  }, {
    name: "둔전탁구클럽",
    cat: "culture",
    biz: "실내체육",
    dist: 320,
    onnuri: false,
    addr: "포곡읍 둔전로 33"
  }, {
    name: "제일세탁",
    cat: "beauty",
    biz: "세탁소",
    dist: 350,
    onnuri: true,
    addr: "포곡읍 둔전로 35"
  }, {
    name: "손칼국수",
    cat: "food",
    biz: "면요리",
    dist: 380,
    onnuri: true,
    addr: "포곡읍 둔전로 41"
  }],
  popular: [{
    name: "카페 온담",
    note: "이번 주 조회 1위",
    cat: "cafe"
  }, {
    name: "둔전분식",
    note: "신규 등록",
    cat: "food"
  }, {
    name: "포곡문구",
    note: "조회 상승",
    cat: "shop"
  }],
  nearby: [{
    type: "aed",
    name: "둔전마을회관 AED",
    detail: "1층 로비 · 약 120m, 도보 2분"
  }, {
    type: "toilet",
    name: "둔전 공영주차장 화장실",
    detail: "남 2칸 여 3칸 · 약 210m, 도보 3분"
  }, {
    type: "shelter",
    name: "포곡초등학교 대피소",
    detail: "지진 옥외대피 · 약 480m, 도보 7분"
  }],
  festival: {
    name: "둔전 골목축제",
    date: "10.17 (금) 15:00~21:00",
    state: "예정"
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qr_guide/data.js", error: String((e && e.message) || e) }); }

__ds_ns.MASCOT_POSES = __ds_scope.MASCOT_POSES;

__ds_ns.Mascot = __ds_scope.Mascot;

__ds_ns.MascotBubble = __ds_scope.MascotBubble;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CATEGORY_ICONS = __ds_scope.CATEGORY_ICONS;

__ds_ns.CATEGORY_LABELS = __ds_scope.CATEGORY_LABELS;

__ds_ns.CategoryIcon = __ds_scope.CategoryIcon;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.FACILITY_ICONS = __ds_scope.FACILITY_ICONS;

__ds_ns.FACILITY_LABELS = __ds_scope.FACILITY_LABELS;

__ds_ns.EMERGENCY = __ds_scope.EMERGENCY;

__ds_ns.FacilityIcon = __ds_scope.FacilityIcon;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.PictogramTile = __ds_scope.PictogramTile;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.FloatingControls = __ds_scope.FloatingControls;

__ds_ns.Notice = __ds_scope.Notice;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.MapCanvas = __ds_scope.MapCanvas;

__ds_ns.AppBar = __ds_scope.AppBar;

__ds_ns.ContextBar = __ds_scope.ContextBar;

__ds_ns.ProgressSteps = __ds_scope.ProgressSteps;

__ds_ns.SegmentedTabs = __ds_scope.SegmentedTabs;

__ds_ns.TabBar = __ds_scope.TabBar;

})();
