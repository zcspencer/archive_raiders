import { create } from "zustand";

/** Supported content types for Readable items in the UI. */
export type ReadableContentType = "text" | "image";

/**
 * State for the readable-content overlay (scrolls, books, etc.).
 */
interface ReadableContentState {
  /** Whether the read dialog is open. */
  isOpen: boolean;
  /** Title shown in the dialog (e.g. item name). */
  title: string;
  /** Content type: text or image. */
  contentType: ReadableContentType;
  /** Raw content: plain text or image path. */
  content: string;

  /** Opens the read dialog with the given title and content. */
  openReadable: (title: string, contentType: ReadableContentType, content: string) => void;
  /** Closes the read dialog. */
  closeReadable: () => void;
}

export const useReadableContentStore = create<ReadableContentState>((set) => ({
  isOpen: false,
  title: "",
  contentType: "text",
  content: "",

  openReadable: (title, contentType, content) =>
    set({ isOpen: true, title, contentType, content }),

  closeReadable: () =>
    set({ isOpen: false, title: "", contentType: "text", content: "" })
}));
