import { useEffect, type ReactElement } from "react";
import { useDialogueStore } from "../../store/dialogue";

const BOX_STYLE: React.CSSProperties = {
  position: "absolute",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(600px, 90vw)",
  background: "rgba(17, 24, 39, 0.95)",
  border: "2px solid #4b5563",
  borderRadius: 12,
  padding: "16px 20px",
  color: "#f9fafb",
  fontFamily: "sans-serif",
  zIndex: 100
};

const SPEAKER_STYLE: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#a3e635",
  marginBottom: 6
};

const TEXT_STYLE: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.5",
  marginBottom: 12
};

const BUTTON_STYLE: React.CSSProperties = {
  padding: "6px 16px",
  background: "#374151",
  border: "1px solid #6b7280",
  borderRadius: 6,
  color: "#f9fafb",
  cursor: "pointer",
  fontSize: "14px"
};

/**
 * Dialogue text box rendered as a React overlay at the bottom of the screen.
 * Reads from the dialogue Zustand store. Advances on click or X key press.
 */
export function DialogueBox(): ReactElement | null {
  const { isActive, speakerName, lines, currentIndex, advanceDialogue, closeDialogue } =
    useDialogueStore();

  useEffect(() => {
    if (!isActive) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === "x" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        advanceDialogue();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialogue();
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [isActive, advanceDialogue, closeDialogue]);

  if (!isActive || lines.length === 0) {
    return null;
  }

  const currentLine = lines[currentIndex];
  if (!currentLine) {
    return null;
  }

  const isLast = currentIndex >= lines.length - 1;

  return (
    <div style={BOX_STYLE} role="dialog" aria-label="Dialogue">
      <div style={SPEAKER_STYLE}>{currentLine.speaker || speakerName}</div>
      <div style={TEXT_STYLE}>{currentLine.text}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {!isLast ? (
          <button type="button" style={BUTTON_STYLE} onClick={advanceDialogue}>
            Next [X]
          </button>
        ) : (
          <button type="button" style={BUTTON_STYLE} onClick={closeDialogue}>
            Close [X]
          </button>
        )}
      </div>
    </div>
  );
}
