/**
 * The main navigation unit: a large pictogram over a short Korean label, laid out 3-up or 4-up.
 * @startingPoint section="Core" subtitle="Pictogram navigation grid" viewport="700x260"
 */
export interface PictogramTileProps {
  icon: string;
  label: string;
  caption?: string;
  tint?: "green" | "teal" | "cream" | "amber" | "blue" | "red";
  badge?: string | number;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function PictogramTile(props: PictogramTileProps): JSX.Element;
