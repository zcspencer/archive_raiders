import type { DialogueLine } from "@odyssey/shared";
import { create } from "zustand";

/**
 * State for the dialogue overlay shared between Phaser and React.
 */
interface DialogueState {
  /** Whether the dialogue box is currently visible. */
  isActive: boolean;
  /** The name shown as the speaker header. */
  speakerName: string;
  /** Full list of dialogue lines. */
  lines: DialogueLine[];
  /** Index of the currently displayed line. */
  currentIndex: number;

  /** Opens dialogue with the given speaker and lines. */
  openDialogue: (speakerName: string, lines: DialogueLine[]) => void;
  /** Advances to the next line, or closes if at the end. */
  advanceDialogue: () => void;
  /** Immediately closes the dialogue box. */
  closeDialogue: () => void;
}

/**
 * Zustand store bridging Phaser interaction events with the React
 * DialogueBox component.
 */
export const useDialogueStore = create<DialogueState>((set, get) => ({
  isActive: false,
  speakerName: "",
  lines: [],
  currentIndex: 0,

  openDialogue: (speakerName, lines): void =>
    set({ isActive: true, speakerName, lines, currentIndex: 0 }),

  advanceDialogue: (): void => {
    const { currentIndex, lines } = get();
    if (currentIndex + 1 < lines.length) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isActive: false, speakerName: "", lines: [], currentIndex: 0 });
    }
  },

  closeDialogue: (): void =>
    set({ isActive: false, speakerName: "", lines: [], currentIndex: 0 })
}));
