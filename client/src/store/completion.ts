import { create } from "zustand";

interface CompletionState {
  /** Set of task IDs the user has successfully completed (server-authoritative cache). */
  completedTaskIds: Set<string>;

  /** Replaces the completion set (e.g. after fetching from GET /tasks/completions). */
  setCompletedTaskIds: (taskIds: string[]) => void;
  /** Adds a single task ID (e.g. after a successful submit in this session). */
  addCompletedTaskId: (taskId: string) => void;
  /** Clears the cache (e.g. on logout). */
  clear: () => void;
}

export const useCompletionStore = create<CompletionState>((set) => ({
  completedTaskIds: new Set(),

  setCompletedTaskIds: (taskIds) =>
    set({ completedTaskIds: new Set(taskIds) }),

  addCompletedTaskId: (taskId) =>
    set((state) => {
      const next = new Set(state.completedTaskIds);
      next.add(taskId);
      return { completedTaskIds: next };
    }),

  clear: () => set({ completedTaskIds: new Set() })
}));
