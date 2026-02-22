import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import type { TaskValidatorDescriptor } from "../registry.js";

interface ZoomDiscoverConfig {
  hiddenDetail: string;
}

function parseConfig(config: Record<string, unknown>): ZoomDiscoverConfig {
  const hiddenDetail = config["hiddenDetail"];
  if (typeof hiddenDetail !== "string") {
    throw new Error("Zoom-discover task config is missing hiddenDetail");
  }
  return { hiddenDetail };
}

function getDiscoveredValue(answer: TaskAnswer): string | undefined {
  const discoveredValue = answer["discoveredValue"];
  return typeof discoveredValue === "string" ? discoveredValue : undefined;
}

/**
 * Validates a zoom-discover answer: discovered value must match hiddenDetail
 * (case-insensitive, trimmed), matching client ChallengePanel logic.
 */
function validateZoomDiscover(
  definition: TaskDefinition,
  answer: TaskAnswer
): TaskResult {
  const config = parseConfig(definition.config);
  const submitted = getDiscoveredValue(answer);
  const isCorrect =
    submitted !== undefined &&
    submitted.trim().toLowerCase() === config.hiddenDetail.trim().toLowerCase();

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Correct! You found the hidden detail."
      : "That's not quite right. Keep zooming and look carefully."
  };
}

export const zoomDiscoverValidator: TaskValidatorDescriptor = {
  taskType: "zoom-discover",
  validate: validateZoomDiscover
};
