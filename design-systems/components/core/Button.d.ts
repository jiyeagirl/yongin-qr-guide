/**
 * Primary action control. Flat filled surfaces; only the outline variant has a border.
 * @startingPoint section="Core" subtitle="Sticker-outlined buttons in six variants" viewport="700x220"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "soft" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Leading Material Symbols ligature. */
  icon?: string;
  iconEnd?: string;
  block?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
