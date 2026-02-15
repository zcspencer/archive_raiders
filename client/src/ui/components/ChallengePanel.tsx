import { useEffect, type CSSProperties, type ReactElement } from "react";
import { useChallengeStore } from "../../store/challenge";
import { usePlayerControlStore } from "../../store/playerControl";
import { getChallengeComponent } from "./challenges/registry";
import type { TaskResult } from "@odyssey/shared";

/**
 * Modal overlay that presents the active challenge mini-game.
 * Routes to the correct mini-game component via the challenge registry.
 * Returns null when no challenge is active.
 */
export function ChallengePanel(): ReactElement | null {
  const activeTask = useChallengeStore((s) => s.activeTask);
  const completeChallenge = useChallengeStore((s) => s.completeChallenge);
  const dismiss = useChallengeStore((s) => s.dismiss);
  const setInputMode = usePlayerControlStore((s) => s.setInputMode);

  /* Escape key dismisses the challenge. */
  useEffect(() => {
    if (!activeTask) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        setInputMode("game");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTask, dismiss, setInputMode]);

  if (!activeTask) return null;

  const ChallengeComponent = getChallengeComponent(activeTask.type);

  const handleResult = (result: TaskResult): void => {
    completeChallenge(result);
    if (result.isCorrect) {
      /* onSuccess callback + dismiss handled by the store. */
      setInputMode("game");
    }
  };

  const handleBackdropClick = (): void => {
    dismiss();
    setInputMode("game");
  };

  return (
    <div style={backdropStyle} onClick={handleBackdropClick} role="presentation">
      <div
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={activeTask.title}
      >
        <h2 style={titleStyle}>{activeTask.title}</h2>
        <p style={descStyle}>{activeTask.description}</p>

        {ChallengeComponent ? (
          <ChallengeComponent task={activeTask} onResult={handleResult} />
        ) : (
          <p style={errorStyle}>
            Unknown challenge type: <code>{activeTask.type}</code>
          </p>
        )}

        {activeTask.hints.length > 0 && (
          <details style={hintsWrapStyle}>
            <summary style={hintsSummaryStyle}>Hints</summary>
            <ul style={hintsListStyle}>
              {activeTask.hints.map((hint, i) => (
                <li key={i} style={hintItemStyle}>
                  {hint}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.65)",
  zIndex: 250,
  pointerEvents: "auto"
};

const panelStyle: CSSProperties = {
  width: 560,
  maxWidth: "94vw",
  maxHeight: "85vh",
  overflowY: "auto",
  padding: "24px 28px",
  background: "rgba(15, 23, 42, 0.97)",
  border: "2px solid #475569",
  borderRadius: 14,
  boxShadow: "0 12px 48px rgba(0,0,0,0.5)"
};

const titleStyle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: 20,
  fontWeight: 700,
  color: "#f1f5f9"
};

const descStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 14,
  color: "#94a3b8",
  lineHeight: 1.5
};

const errorStyle: CSSProperties = {
  fontSize: 14,
  color: "#f87171",
  padding: 16,
  background: "rgba(248,113,113,0.1)",
  borderRadius: 8,
  border: "1px solid #f87171"
};

const hintsWrapStyle: CSSProperties = {
  marginTop: 16,
  borderTop: "1px solid #334155",
  paddingTop: 12
};

const hintsSummaryStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#64748b",
  cursor: "pointer",
  userSelect: "none"
};

const hintsListStyle: CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 20,
  fontSize: 13,
  color: "#94a3b8",
  lineHeight: 1.6
};

const hintItemStyle: CSSProperties = {
  marginBottom: 4
};
