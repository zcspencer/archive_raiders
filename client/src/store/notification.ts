import { create } from "zustand";

interface NotificationState {
  message: string | null;
  setMessage: (message: string | null) => void;
}

/**
 * Zustand store for transient server notifications (e.g. "The container is empty").
 * Message is shown in the game UI and cleared after a short delay or on dismiss.
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  setMessage: (message): void => set({ message })
}));
