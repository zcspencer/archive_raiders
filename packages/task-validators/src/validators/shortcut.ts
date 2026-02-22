import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import type { TaskValidatorDescriptor } from "../registry.js";

interface ShortcutConfig {
  targetShortcut: string;
}

function parseShortcutConfig(config: Record<string, unknown>): ShortcutConfig {
  const targetShortcut = config["targetShortcut"];
  if (typeof targetShortcut !== "string" || targetShortcut.length === 0) {
    throw new Error("Shortcut task config is missing targetShortcut");
  }
  return { targetShortcut };
}

function getPressedKeys(answer: TaskAnswer): string | undefined {
  const pressedKeys = answer["pressedKeys"];
  return typeof pressedKeys === "string" ? pressedKeys : undefined;
}

/**
 * Validates a shortcut answer against target shortcut config.
 */
export function validateShortcut(
  definition: TaskDefinition,
  answer: TaskAnswer
): TaskResult {
  const config = parseShortcutConfig(definition.config);
  const pressedKeys = getPressedKeys(answer);
  const isCorrect = pressedKeys === config.targetShortcut;

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Correct shortcut applied."
      : `Expected ${config.targetShortcut}.`
  };
}

export const shortcutValidator: TaskValidatorDescriptor = {
  taskType: "shortcut",
  validate: validateShortcut
};
