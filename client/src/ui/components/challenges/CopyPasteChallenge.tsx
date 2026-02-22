import { useState, type CSSProperties, type ReactElement } from "react";
import type { ChallengeProps } from "./ChallengeProps";
import { ChallengeTimer } from "./ChallengeTimer";
import { shortcutLabel } from "./platformShortcut";

interface CopyPasteConfig {
  sourceContent: string;
  expectedValue: string;
  timeLimitSeconds?: number;
}

function parseConfig(raw: Record<string, unknown>): CopyPasteConfig {
  return {
    sourceContent: String(raw["sourceContent"] ?? ""),
    expectedValue: String(raw["expectedValue"] ?? ""),
    timeLimitSeconds:
      typeof raw["timeLimitSeconds"] === "number" ? raw["timeLimitSeconds"] : undefined
  };
}

/**
 * Challenge where the player must copy content from a source area
 * and paste it into a target input field. Teaches Cmd/Ctrl+C and Cmd/Ctrl+V.
 */
export function CopyPasteChallenge({ task, onResult }: ChallengeProps): ReactElement {
  const config = parseConfig(task.config);
  const [pasted, setPasted] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const handleSubmit = (): void => {
    if (timedOut) return;
    const isCorrect = pasted === config.expectedValue;
    if (isCorrect) {
      onResult(
        { pastedValue: pasted },
        { isCorrect: true, score: 100, feedback: "Key accepted!" }
      );
    } else {
      setFeedback("That doesn't match. Select the content above, copy it, and paste it here.");
    }
  };

  const handleTimeUp = (): void => {
    setTimedOut(true);
    onResult(
      { pastedValue: pasted },
      { isCorrect: false, score: 0, feedback: "Time's up!" }
    );
  };

  return (
    <div style={wrapStyle}>
      {config.timeLimitSeconds != null && !timedOut && (
        <ChallengeTimer timeLimitSeconds={config.timeLimitSeconds} onTimeUp={handleTimeUp} />
      )}

      <p style={hintStyle}>
        Select the content below, copy it with <strong>{shortcutLabel("C")}</strong>,
        then paste it into the field with <strong>{shortcutLabel("V")}</strong>.
      </p>

      <div style={sourceWrapStyle}>
        <div style={sourceLabelStyle}>Source</div>
        <div style={sourceStyle}>{config.sourceContent}</div>
      </div>

      <div style={inputRowStyle}>
        <input
          type="text"
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            setFeedback(null);
          }}
          placeholder="Paste here..."
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
          disabled={timedOut || pasted.length === 0}
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

const wrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

const hintStyle: CSSProperties = {
  fontSize: 14,
  color: "#cbd5e1",
  margin: "0 0 4px",
  lineHeight: 1.5
};

const sourceWrapStyle: CSSProperties = {
  border: "1px solid #475569",
  borderRadius: 8,
  overflow: "hidden"
};

const sourceLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "6px 12px",
  background: "rgba(30,41,59,0.6)",
  borderBottom: "1px solid #475569"
};

const sourceStyle: CSSProperties = {
  padding: "16px 20px",
  fontSize: 32,
  textAlign: "center",
  userSelect: "text",
  color: "#f1f5f9",
  background: "#0f172a",
  lineHeight: 1.4
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
