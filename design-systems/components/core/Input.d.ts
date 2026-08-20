/** Single-line text field, 48px tall, teal focus ring. */
export interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  /** md(기본, 44px) — 시민용. sm(36px) — 관리자 표 안에서만 (데스크톱 전용). */
  size?: "md" | "sm";
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
