/**
 * Returns true when the active element is an editable form field.
 */
export function isFormFieldFocused(activeElement: Element | null): boolean {
  if (!activeElement) {
    return false;
  }
  const maybeElement = activeElement as {
    tagName?: string;
    isContentEditable?: boolean;
    contentEditable?: string;
  };
  const tagName = maybeElement.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    maybeElement.isContentEditable === true ||
    maybeElement.contentEditable === "true"
  );
}

/**
 * Blurs the currently focused form field when possible.
 */
export function blurFocusedFormField(activeElement: Element | null): boolean {
  if (!isFormFieldFocused(activeElement)) {
    return false;
  }
  const maybeBlurTarget = activeElement as { blur?: () => void };
  if (typeof maybeBlurTarget.blur !== "function") {
    return false;
  }
  maybeBlurTarget.blur();
  return true;
}
