/** Public-facility glyph (AED / 화장실 / 쉼터 / 대피소). AED and 대피소 render in the emergency red. */
export interface FacilityIconProps {
  type: "aed" | "toilet" | "rest" | "shelter";
  size?: number;
  /** false = neutral colour (use inside dense lists where red would over-signal). */
  emphasis?: boolean;
  style?: React.CSSProperties;
}
export declare function FacilityIcon(props: FacilityIconProps): JSX.Element;
