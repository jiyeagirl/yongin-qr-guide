/** 조아용 artwork. Renders the supplied PNG only — never redraw or recolour the character. */
export interface MascotProps {
  /** One of MASCOT_POSES. */
  pose?: "front" | "hello" | "thumbsup" | "excited" | "curious" | "surprised" | "shy" | "back" | "glance" | "sorry" | "balloon" | "thanks" | "answer" | "angry";
  size?: number;
  bob?: boolean;
  /** Path prefix to the project root, e.g. "../../". */
  base?: string;
  alt?: string;
  style?: React.CSSProperties;
}
export declare function Mascot(props: MascotProps): JSX.Element;
