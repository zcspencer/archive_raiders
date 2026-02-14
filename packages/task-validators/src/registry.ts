import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import { validateShortcut } from "./validators/shortcut.js";

export type ValidatorFn = (
  definition: TaskDefinition,
  answer: TaskAnswer
) => TaskResult;

const registry: Record<string, ValidatorFn> = {
  shortcut: validateShortcut
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
