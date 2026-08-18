/** Persistent "현재 위치: OO" bar naming the QR anchor point. Present on every screen reached from a QR scan. */
export interface ContextBarProps {
  place: string;
  note?: string;
  onReset?: () => void;
  style?: React.CSSProperties;
}
export declare function ContextBar(props: ContextBarProps): JSX.Element;
