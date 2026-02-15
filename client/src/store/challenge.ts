import { create } from "zustand";
import type { TaskDefinition, TaskResult } from "@odyssey/shared";

/**
 * State for the active challenge overlay.
 * Manages which task is being presented, what happens on success,
 * and the latest validation result.
 */
interface ChallengeState {
  /** The task definition currently being presented, or null when idle. */
  activeTask: TaskDefinition | null;
  /** Callback invoked when the challenge is completed successfully. */
  onSuccess: (() => void) | null;
  /** Latest validation result (success or failure feedback). */
  result: TaskResult | null;

  /** Opens a challenge panel for the given task with a success callback. */
  startChallenge: (task: TaskDefinition, onSuccess: () => void) => void;
  /** Marks the challenge as successfully completed and fires the onSuccess callback. */
  completeChallenge: (result: TaskResult) => void;
  /** Dismisses the challenge panel without completing it. */
  dismiss: () => void;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  activeTask: null,
  onSuccess: null,
  result: null,

  startChallenge: (task, onSuccess) =>
    set({ activeTask: task, onSuccess, result: null }),

  completeChallenge: (result) => {
    const { onSuccess } = get();
    set({ result });
    if (result.isCorrect && onSuccess) {
      /* Defer the callback so the store update settles first. */
      queueMicrotask(() => {
        onSuccess();
        useChallengeStore.getState().dismiss();
      });
    }
  },

  dismiss: () =>
    set({ activeTask: null, onSuccess: null, result: null })
}));
