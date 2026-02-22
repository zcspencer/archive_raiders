import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import type { TaskValidatorDescriptor } from "../registry.js";

interface CopyPasteConfig {
  expectedValue: string;
}

function parseConfig(config: Record<string, unknown>): CopyPasteConfig {
  const expectedValue = config["expectedValue"];
  if (typeof expectedValue !== "string") {
    throw new Error("Copy-paste task config is missing expectedValue");
  }
  return { expectedValue };
}

function getPastedValue(answer: TaskAnswer): string | undefined {
  const pastedValue = answer["pastedValue"];
  return typeof pastedValue === "string" ? pastedValue : undefined;
}

/**
 * Validates a copy-paste answer: pasted value must exactly match expectedValue.
 */
function validateCopyPaste(
  definition: TaskDefinition,
  answer: TaskAnswer
): TaskResult {
  const config = parseConfig(definition.config);
  const pasted = getPastedValue(answer);
  const isCorrect = pasted === config.expectedValue;

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Key accepted!"
      : "That doesn't match. Select the content above, copy it, and paste it here."
  };
}

export const copyPasteValidator: TaskValidatorDescriptor = {
  taskType: "copy-paste",
  validate: validateCopyPaste
};
