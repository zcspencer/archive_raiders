import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import { validateFindCopyPaste } from "./validators/findCopyPaste.js";
import { validateShortcut } from "./validators/shortcut.js";

export type ValidatorFn = (
  definition: TaskDefinition,
  answer: TaskAnswer
) => TaskResult;

const registry: Record<string, ValidatorFn> = {
  shortcut: validateShortcut,
  "find-copy-paste": validateFindCopyPaste
};

/**
 * Returns a validator function by task type.
 */
export function getValidator(taskType: string): ValidatorFn {
  const validator = registry[taskType];
  if (!validator) {
    throw new Error(`No validator found for task type: ${taskType}`);
  }
  return validator;
}
