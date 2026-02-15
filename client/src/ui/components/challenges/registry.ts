import type { ComponentType } from "react";
import type { ChallengeProps } from "./ChallengeProps";
import { ZoomDiscoverChallenge } from "./ZoomDiscoverChallenge";
import { FindCopyPasteChallenge } from "./FindCopyPasteChallenge";
import { CopyPasteChallenge } from "./CopyPasteChallenge";

/**
 * Registry mapping task type strings to their React challenge components.
 * To add a new mini-game, create the component and register it here.
 */
const challengeRegistry: Record<string, ComponentType<ChallengeProps>> = {
  "zoom-discover": ZoomDiscoverChallenge,
  "find-copy-paste": FindCopyPasteChallenge,
  "copy-paste": CopyPasteChallenge
};

/**
 * Looks up the React component for a given task type.
 * Returns undefined if no component is registered for the type.
 */
export function getChallengeComponent(
  taskType: string
): ComponentType<ChallengeProps> | undefined {
  return challengeRegistry[taskType];
}
