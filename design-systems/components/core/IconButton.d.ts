/** Circular icon-only tap target. Always pass an accessible Korean label. */
export interface IconButtonProps {
  name: string;
  label: string;
  size?: number;
  variant?: "ghost" | "soft" | "outline" | "brand";
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
