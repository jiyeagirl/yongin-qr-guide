/** Circular icon-only tap target. Always pass an accessible Korean label. */
export interface IconButtonProps {
  name: string;
  label: string;
  /** Tap box (default 44 — never smaller than --tap-min). */
  size?: number;
  /** Visible glyph size (default 22). Split from `size` so the icon can look
   *  smaller while the tap target stays 44px. */
  iconSize?: number;
  variant?: "ghost" | "soft" | "outline" | "brand";
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
