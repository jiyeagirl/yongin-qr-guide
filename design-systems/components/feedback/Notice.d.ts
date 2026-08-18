/** Inline tinted advisory block for rules, deadlines, and eligibility notes. */
export interface NoticeProps {
  children?: React.ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  style?: React.CSSProperties;
}
export declare function Notice(props: NoticeProps): JSX.Element;
