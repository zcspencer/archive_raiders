import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import { copyPasteValidator } from "./validators/copyPaste.js";
import { findCopyPasteValidator } from "./validators/findCopyPaste.js";
import { shortcutValidator } from "./validators/shortcut.js";
import { zoomDiscoverValidator } from "./validators/zoomDiscover.js";

export type ValidatorFn = (
  definition: TaskDefinition,
  answer: TaskAnswer
) => TaskResult;

/**
 * Self-describing validator: task type string plus validate function.
 * Each validator module exports one of these so the registry can build the map.
 */
export interface TaskValidatorDescriptor {
  taskType: string;
  validate: ValidatorFn;
}

const allValidators: TaskValidatorDescriptor[] = [
  copyPasteValidator,
  findCopyPasteValidator,
  shortcutValidator,
  zoomDiscoverValidator
];

const registry = new Map<string, ValidatorFn>();
for (const v of allValidators) {
  registry.set(v.taskType, v.validate);
}

/**
 * Returns a validator function by task type.
 */
export function getValidator(taskType: string): ValidatorFn {
  const validator = registry.get(taskType);
  if (!validator) {
    throw new Error(`No validator found for task type: ${taskType}`);
  }
  return validator;
}
