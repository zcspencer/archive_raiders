import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import type { ChallengeProps } from "./ChallengeProps";
import { ChallengeTimer } from "./ChallengeTimer";
import { isModifierPressed, shortcutLabel } from "./platformShortcut";

interface ZoomConfig {
  content: string;
  hiddenDetail: string;
  revealAtZoom: number;
  timeLimitSeconds?: number;
}

function parseConfig(raw: Record<string, unknown>): ZoomConfig {
  return {
    content: String(raw["content"] ?? ""),
    hiddenDetail: String(raw["hiddenDetail"] ?? ""),
    revealAtZoom: Number(raw["revealAtZoom"] ?? 3),
    timeLimitSeconds:
      typeof raw["timeLimitSeconds"] === "number" ? raw["timeLimitSeconds"] : undefined
  };
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.3;

/**
 * Challenge where the player must use the platform zoom shortcut
 * (Cmd/Ctrl + Plus) to zoom into content and discover a hidden detail,
 * then type it into a text field to complete the challenge.
 */
export function ZoomDiscoverChallenge({ task, onResult }: ChallengeProps): ReactElement {
  const config = parseConfig(task.config);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isRevealed = zoom >= config.revealAtZoom;
  console.log("config", config);
  console.log("zoom", zoom);
  console.log("isRevealed", isRevealed);
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isModifierPressed(e)) return;

      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = (): void => {
    if (timedOut) return;
    const isCorrect =
      answer.trim().toLowerCase() === config.hiddenDetail.trim().toLowerCase();
    if (isCorrect) {
      onResult(
        { discoveredValue: answer },
        { isCorrect: true, score: 100, feedback: "Correct! You found the hidden detail." }
      );
    } else {
      setFeedback("That's not quite right. Keep zooming and look carefully.");
    }
  };

  const handleTimeUp = (): void => {
    setTimedOut(true);
    onResult(
      { discoveredValue: answer },
      { isCorrect: false, score: 0, feedback: "Time's up!" }
    );
  };

  return (
    <div style={wrapStyle}>
      {config.timeLimitSeconds != null && !timedOut && (
        <ChallengeTimer timeLimitSeconds={config.timeLimitSeconds} onTimeUp={handleTimeUp} />
      )}

      <p style={hintStyle}>
        Use <strong>{shortcutLabel("+")}</strong> to zoom in and{" "}
        <strong>{shortcutLabel("-")}</strong> to zoom out.
        Find the hidden detail and type it below.
      </p>

      <div style={viewportStyle} ref={containerRef}>
        <div
          style={{
            ...contentStyle,
            transform: `scale(${zoom})`,
            transformOrigin: "center center"
          }}
        >
          <div style={mapTextStyle}>{config.content}</div>
          <div
            style={{
              ...hiddenStyle,
              opacity: isRevealed ? 1 : 0,
              transition: "opacity 0.4s ease"
            }}
          >
            {config.hiddenDetail}
          </div>
        </div>
      </div>

      <div style={zoomIndicatorStyle}>
        Zoom: {Math.round(zoom * 100)}%
      </div>

      <div style={inputRowStyle}>
        <input
          type="text"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setFeedback(null);
          }}
          placeholder="Type the hidden detail..."
          style={inputStyle}
          disabled={timedOut}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <button
          type="button"
          style={submitBtnStyle}
          onClick={handleSubmit}
          disabled={timedOut || answer.trim().length === 0}
        >
          Submit
        </button>
      </div>

      {feedback && <p style={feedbackStyle}>{feedback}</p>}
      {timedOut && <p style={timeUpStyle}>Time expired. Try again next time.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const wrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };

const hintStyle: CSSProperties = {
  fontSize: 14,
  color: "#cbd5e1",
  margin: "0 0 4px",
  lineHeight: 1.5
};

const viewportStyle: CSSProperties = {
  width: "100%",
  height: 240,
  overflow: "hidden",
  border: "1px solid #475569",
  borderRadius: 8,
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative"
};

const contentStyle: CSSProperties = {
  textAlign: "center",
  userSelect: "none",
  pointerEvents: "none",
  position: "relative"
};

const mapTextStyle: CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
  whiteSpace: "pre-wrap",
  lineHeight: 1.3,
  maxWidth: 600
};

const hiddenStyle: CSSProperties = {
  fontSize: 8,
  color: "#22d3ee",
  fontWeight: 700,
  marginTop: 6,
  letterSpacing: "0.04em"
};

const zoomIndicatorStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  textAlign: "right"
};

const inputRowStyle: CSSProperties = { display: "flex", gap: 8 };

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  fontSize: 14,
  background: "#1e293b",
  border: "1px solid #475569",
  borderRadius: 8,
  color: "#f1f5f9",
  outline: "none"
};

const submitBtnStyle: CSSProperties = {
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 700,
  background: "#65a30d",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const feedbackStyle: CSSProperties = {
  fontSize: 13,
  color: "#facc15",
  margin: 0
};

const timeUpStyle: CSSProperties = {
  fontSize: 13,
  color: "#ef4444",
  margin: 0,
  fontWeight: 600
};
