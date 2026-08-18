/** Multi-step application progress (신청 → 검토 → 실증 → 완료). */
export interface ProgressStepsProps {
  steps?: string[];
  /** 0-indexed active step. */
  current?: number;
  style?: React.CSSProperties;
}
export declare function ProgressSteps(props: ProgressStepsProps): JSX.Element;
