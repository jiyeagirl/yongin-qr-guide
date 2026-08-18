/** Transient confirmation pill floating above the tab bar. */
export interface ToastProps {
  children?: React.ReactNode;
  tone?: "dark" | "brand";
  icon?: string;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
