/** Instant-effect setting toggle (alerts, location). Not for form submission. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: React.ReactNode;
  /** label 없이 스위치만 세울 때의 이름. label 이 있으면 그 글자가 이름이 된다. */
  "aria-label"?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Switch(props: SwitchProps): JSX.Element;
