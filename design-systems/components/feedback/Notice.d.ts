/** Inline tinted advisory block for rules, deadlines, and eligibility notes. */
export interface NoticeProps {
  children?: React.ReactNode;
  /** `neutral` carries no semantic color — use it for plain facts ("opens in a new window").
   *  `info` shares its tint with the 온누리 badge, so avoid it where both appear. */
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  /** `sm` is a one-line footnote: smaller text, icon and padding alike. */
  size?: "md" | "sm";
  title?: string;
  style?: React.CSSProperties;
}
export declare function Notice(props: NoticeProps): JSX.Element;
