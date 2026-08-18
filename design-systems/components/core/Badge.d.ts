/** Small status pill for list rows and cards (모집중, 마감, 진행중). */
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "accent" | "onnuri";
  /** `sm` is for the `tag` slot of ListRow, where badges must share one pill height. */
  size?: "md" | "sm";
  dot?: boolean;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
