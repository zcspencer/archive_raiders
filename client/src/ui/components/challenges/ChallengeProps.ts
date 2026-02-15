import type { TaskDefinition, TaskResult } from "@odyssey/shared";

/**
 * Props shared by all challenge mini-game components.
 */
export interface ChallengeProps {
  /** The task definition providing config, title, description, and hints. */
  task: TaskDefinition;
  /** Called when the player submits an answer (correct or incorrect). */
  onResult: (result: TaskResult) => void;
}
