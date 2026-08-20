/** Single-select or multi-select filter pill; scrolls horizontally in a row. */
export interface ChipProps {
  children?: React.ReactNode;
  selected?: boolean;
  /** Colour family: soft at rest (legend), solid when selected. */
  tint?: "green" | "teal" | "cream" | "amber" | "red" | "blue" | "violet" | "sand" | "rose" | "neutral";
  /** false = plain white at rest, tint only when selected. For a chip that stands alone. */
  tintRest?: boolean;
  icon?: string;
  count?: number;
  /** Show a trailing × while selected. Not a separate button — the whole pill toggles. */
  removable?: boolean;
  elevated?: boolean;
  size?: "md" | "sm";
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
