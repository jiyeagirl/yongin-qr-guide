/** Lucide line icon — the only icon primitive. No fills, no background chips, stroke width left at the Lucide default. */
export interface IconProps {
  /** Kebab-case Lucide id, e.g. "heart-pulse", "shopping-bag". */
  name: string;
  size?: number;
  /** Leave unset. Overriding per screen breaks the visual weight. */
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
