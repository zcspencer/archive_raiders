import { useState, type CSSProperties, type ReactElement } from "react";
import type { ChallengeProps } from "./ChallengeProps";
import { ChallengeTimer } from "./ChallengeTimer";
import { shortcutLabel } from "./platformShortcut";

interface FindCopyPasteConfig {
  bodyText: string;
  password: string;
  passwordLabel: string;
  timeLimitSeconds?: number;
}

function parseConfig(raw: Record<string, unknown>): FindCopyPasteConfig {
  return {
    bodyText: String(raw["bodyText"] ?? ""),
    password: String(raw["password"] ?? ""),
    passwordLabel: String(raw["passwordLabel"] ?? "Password"),
    timeLimitSeconds:
      typeof raw["timeLimitSeconds"] === "number" ? raw["timeLimitSeconds"] : undefined
  };
}

/**
 * Challenge where a high-entropy password is hidden in a large body of text.
 * The player must use Find (Cmd/Ctrl+F) to locate it, then copy-paste it
 * into the password field. Manual typing is allowed but discouraged by entropy.
 */
export function FindCopyPasteChallenge({ task, onResult }: ChallengeProps): ReactElement {
  const config = parseConfig(task.config);
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const handleSubmit = (): void => {
    if (timedOut) return;
    const isCorrect = password === config.password;
    if (isCorrect) {
      onResult({ isCorrect: true, score: 100, feedback: "Access granted!" });
    } else {
      setFeedback("Incorrect password. Use Find to locate it in the text above.");
    }
  };

  const handleTimeUp = (): void => {
    setTimedOut(true);
    onResult({ isCorrect: false, score: 0, feedback: "Time's up!" });
  };

  return (
    <div style={wrapStyle}>
      {config.timeLimitSeconds != null && !timedOut && (
        <ChallengeTimer timeLimitSeconds={config.timeLimitSeconds} onTimeUp={handleTimeUp} />
      )}

      <p style={hintStyle}>
        The {config.passwordLabel.toLowerCase()} is hidden somewhere in the system logs below.
        Use <strong>{shortcutLabel("F")}</strong> to find it, then{" "}
        <strong>{shortcutLabel("C")}</strong> to copy and{" "}
        <strong>{shortcutLabel("V")}</strong> to paste it into the field.
      </p>

      {/* The body text is in a real <div> so browser Find (Cmd/Ctrl+F) works on it. */}
      <div style={textAreaStyle}>{config.bodyText}</div>

      <label style={labelStyle}>
        {config.passwordLabel}
        <div style={inputRowStyle}>
          <input
            type="text"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFeedback(null);
            }}
            placeholder={`Paste the ${config.passwordLabel.toLowerCase()} here...`}
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
            disabled={timedOut || password.length === 0}
          >
            Submit
          </button>
        </div>
      </label>

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

const textAreaStyle: CSSProperties = {
  width: "100%",
  height: 220,
  overflowY: "auto",
  padding: "12px 14px",
  fontSize: 12,
  fontFamily: "monospace",
  lineHeight: 1.5,
  color: "#94a3b8",
  background: "#020617",
  border: "1px solid #475569",
  borderRadius: 8,
  whiteSpace: "pre-wrap",
  userSelect: "text"
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  display: "flex",
  flexDirection: "column",
  gap: 6
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
  outline: "none",
  fontFamily: "monospace"
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
