import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";

/** Props for the ChallengeTimer component. */
interface ChallengeTimerProps {
  /** Total time limit in seconds. */
  timeLimitSeconds: number;
  /** Called when the timer reaches zero. */
  onTimeUp: () => void;
}

/**
 * Countdown timer bar for timed challenges.
 * Shows remaining seconds and a shrinking progress bar.
 */
export function ChallengeTimer({ timeLimitSeconds, onTimeUp }: ChallengeTimerProps): ReactElement {
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setRemaining(timeLimitSeconds);
  }, [timeLimitSeconds]);

  const handleTick = useCallback(() => {
    setRemaining((prev) => {
      const next = prev - 1;
      if (next <= 0) onTimeUpRef.current();
      return Math.max(0, next);
    });
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(handleTick, 1000);
    return () => clearInterval(id);
  }, [remaining <= 0, handleTick]);

  const fraction = remaining / timeLimitSeconds;
  const barColor = fraction > 0.3 ? "#22d3ee" : fraction > 0.1 ? "#facc15" : "#ef4444";

  return (
    <div style={wrapStyle}>
      <div style={trackStyle}>
        <div
          style={{
            ...fillStyle,
            width: `${fraction * 100}%`,
            background: barColor
          }}
        />
      </div>
      <span style={labelStyle}>{remaining}s</span>
    </div>
  );
}

const wrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12
};

const trackStyle: CSSProperties = {
  flex: 1,
  height: 8,
  background: "rgba(255,255,255,0.1)",
  borderRadius: 4,
  overflow: "hidden"
};

const fillStyle: CSSProperties = {
  height: "100%",
  borderRadius: 4,
  transition: "width 1s linear"
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  minWidth: 32,
  textAlign: "right"
};
