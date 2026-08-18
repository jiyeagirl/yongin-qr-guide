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
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
