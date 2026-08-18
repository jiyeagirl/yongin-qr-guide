/** Native select with brand chrome — used for 지역/분야 pickers. */
export interface SelectProps {
  label?: string;
  options?: Array<{ value: string; label: string } | string>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
