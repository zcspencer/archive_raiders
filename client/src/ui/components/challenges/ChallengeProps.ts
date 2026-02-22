import type { TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";

/**
 * Props shared by all challenge mini-game components.
 */
export interface ChallengeProps {
  /** The task definition providing config, title, description, and hints. */
  task: TaskDefinition;
  /** Called when the player submits: pass the answer (for server) and client result (for UI). */
  onResult: (answer: TaskAnswer, result: TaskResult) => void;
}
