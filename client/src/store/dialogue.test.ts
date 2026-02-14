import { describe, expect, it, beforeEach } from "vitest";
import { useDialogueStore } from "./dialogue.js";

describe("dialogueStore", () => {
  beforeEach(() => {
    useDialogueStore.getState().closeDialogue();
  });

  const sampleLines = [
    { speaker: "Elder", text: "Hello!" },
    { speaker: "Elder", text: "Welcome." },
    { speaker: "Elder", text: "Goodbye." }
  ];

  it("starts inactive", () => {
    expect(useDialogueStore.getState().isActive).toBe(false);
  });

  it("opens dialogue with speaker and lines", () => {
    useDialogueStore.getState().openDialogue("Elder", sampleLines);
    const state = useDialogueStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.speakerName).toBe("Elder");
    expect(state.lines).toEqual(sampleLines);
    expect(state.currentIndex).toBe(0);
  });

  it("advances to the next line", () => {
    useDialogueStore.getState().openDialogue("Elder", sampleLines);
    useDialogueStore.getState().advanceDialogue();
    expect(useDialogueStore.getState().currentIndex).toBe(1);
  });

  it("closes after advancing past the last line", () => {
    useDialogueStore.getState().openDialogue("Elder", sampleLines);
    useDialogueStore.getState().advanceDialogue(); // index 1
    useDialogueStore.getState().advanceDialogue(); // index 2 (last)
    useDialogueStore.getState().advanceDialogue(); // should close
    expect(useDialogueStore.getState().isActive).toBe(false);
    expect(useDialogueStore.getState().lines).toEqual([]);
    expect(useDialogueStore.getState().currentIndex).toBe(0);
  });

  it("closes immediately when closeDialogue is called", () => {
    useDialogueStore.getState().openDialogue("Elder", sampleLines);
    useDialogueStore.getState().advanceDialogue();
    useDialogueStore.getState().closeDialogue();
    expect(useDialogueStore.getState().isActive).toBe(false);
    expect(useDialogueStore.getState().speakerName).toBe("");
  });
});
