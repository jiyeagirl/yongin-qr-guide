/**
 * 조아용 with a speech bubble — the brand's voice on screen.
 * @startingPoint section="Brand" subtitle="Mascot guidance bubble" viewport="700x200"
 */
export interface MascotBubbleProps {
  children?: React.ReactNode;
  pose?: string;
  size?: number;
  side?: "left" | "right";
  tone?: "cream" | "green" | "plain";
  base?: string;
  style?: React.CSSProperties;
}
export declare function MascotBubble(props: MascotBubbleProps): JSX.Element;
