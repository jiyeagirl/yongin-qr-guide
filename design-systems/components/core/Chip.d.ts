/** Single-select or multi-select filter pill; scrolls horizontally in a row. */
export interface ChipProps {
  children?: React.ReactNode;
  selected?: boolean;
  icon?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
