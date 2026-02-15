/**
 * Platform-aware keyboard shortcut utilities.
 * Detects macOS vs other platforms and returns the correct modifier labels.
 */

/** Returns true if the user is on macOS. */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** Returns the modifier key name for the current platform ("Cmd" or "Ctrl"). */
export function modifierKey(): string {
  return isMac() ? "Cmd" : "Ctrl";
}

/** Returns the modifier key symbol for the current platform. */
export function modifierSymbol(): string {
  return isMac() ? "\u2318" : "Ctrl";
}

/**
 * Returns a human-readable shortcut label combining the platform modifier with a base key.
 *
 * @example shortcutLabel("+") // "⌘+" on Mac, "Ctrl+" on Windows
 * @example shortcutLabel("F") // "⌘F" on Mac, "Ctrl+F" on Windows
 */
export function shortcutLabel(base: string): string {
  if (isMac()) {
    return `${modifierSymbol()}${base}`;
  }
  return `Ctrl+${base}`;
}

/**
 * Checks whether a keyboard event matches the platform modifier key (metaKey on Mac, ctrlKey elsewhere).
 */
export function isModifierPressed(e: KeyboardEvent): boolean {
  return isMac() ? e.metaKey : e.ctrlKey;
}
