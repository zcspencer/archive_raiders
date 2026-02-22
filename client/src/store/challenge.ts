import { create } from "zustand";
import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import { submitTask } from "../api/task";
import { useAuthStore } from "./auth";
import { useClassroomStore } from "./classroom";
import { useCompletionStore } from "./completion";

/**
 * State for the active challenge overlay.
 * Manages which task is being presented, what happens on success,
 * and the latest validation result. Submits answers to the server for persistence.
 */
interface ChallengeState {
  /** The task definition currently being presented, or null when idle. */
  activeTask: TaskDefinition | null;
  /** Callback invoked when the challenge is completed successfully. */
  onSuccess: (() => void) | null;
  /** Latest validation result (success or failure feedback). */
  result: TaskResult | null;
  /** Client-generated attempt id for idempotent submit. */
  attemptId: string | null;
  /** ISO timestamp when the challenge was started (for server timing). */
  startedAt: string | null;

  /** Opens a challenge panel for the given task with a success callback. */
  startChallenge: (task: TaskDefinition, onSuccess: () => void) => void;
  /**
   * Submits the answer to the server, updates result from response, and on success
   * (or fallback when client correct but server errors) updates completion cache and fires onSuccess.
   */
  completeChallenge: (answer: TaskAnswer, clientResult: TaskResult) => void;
  /** Dismisses the challenge panel without completing it. */
  dismiss: () => void;
}

function fireSuccessAndDismiss(): void {
  const { onSuccess } = useChallengeStore.getState();
  if (onSuccess) {
    queueMicrotask(() => {
      onSuccess();
      useChallengeStore.getState().dismiss();
    });
  }
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  activeTask: null,
  onSuccess: null,
  result: null,
  attemptId: null,
  startedAt: null,

  startChallenge: (task, onSuccess) =>
    set({
      activeTask: task,
      onSuccess,
      result: null,
      attemptId: crypto.randomUUID(),
      startedAt: new Date().toISOString()
    }),

  completeChallenge: (answer, clientResult) => {
    const { activeTask, attemptId, startedAt } = get();
    set({ result: clientResult });

    if (!activeTask || !attemptId) {
      if (clientResult.isCorrect) fireSuccessAndDismiss();
      return;
    }

    const accessToken = useAuthStore.getState().accessToken;
    const classroomId = useClassroomStore.getState().selectedClassroomId;

    if (!accessToken || !classroomId) {
      if (clientResult.isCorrect) {
        useCompletionStore.getState().addCompletedTaskId(activeTask.id);
        fireSuccessAndDismiss();
      }
      return;
    }

    void submitTask(accessToken, activeTask.id, {
      classroomId,
      answer,
      attemptId,
      startedAt: startedAt ?? undefined
    })
      .then((serverResult) => {
        set({ result: serverResult });
        if (serverResult.isCorrect) {
          useCompletionStore.getState().addCompletedTaskId(activeTask.id);
          fireSuccessAndDismiss();
        }
      })
      .catch(() => {
        if (clientResult.isCorrect) {
          useCompletionStore.getState().addCompletedTaskId(activeTask.id);
          fireSuccessAndDismiss();
        }
      });
  },

  dismiss: () =>
    set({ activeTask: null, onSuccess: null, result: null, attemptId: null, startedAt: null })
}));
