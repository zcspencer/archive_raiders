import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";

interface FindCopyPasteConfig {
  password: string;
}

function parseConfig(config: Record<string, unknown>): FindCopyPasteConfig {
  const password = config["password"];
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Find-copy-paste task config is missing password");
  }
  return { password };
}

function getPassword(answer: TaskAnswer): string | undefined {
  const password = answer["password"];
  return typeof password === "string" ? password : undefined;
}

/**
 * Validates a find-copy-paste answer: player must find the password in the body
 * text and enter it (exact match).
 */
export function validateFindCopyPaste(
  definition: TaskDefinition,
  answer: TaskAnswer
): TaskResult {
  const config = parseConfig(definition.config);
  const submitted = getPassword(answer);
  const isCorrect = submitted === config.password;

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Access granted!"
      : "Incorrect password. Use Find to locate it in the text above."
  };
}
