/**
 * Reward item included in a task reward payload.
 */
export interface TaskRewardItem {
  itemId: string;
  quantity: number;
}

/**
 * Reward bundle awarded on task completion.
 */
export interface TaskRewards {
  currency: number;
  xp: number;
  items: TaskRewardItem[];
}

/**
 * Content-side task definition contract.
 */
export interface TaskDefinition {
  id: string;
  type: string;
  title: string;
  description: string;
  difficulty: number;
  config: Record<string, unknown>;
  hints: string[];
  rewards: TaskRewards;
}

/**
 * Player answer payload sent for task validation.
 */
export interface TaskAnswer {
  [key: string]: unknown;
}

/**
 * Result contract returned from task validators.
 */
export interface TaskResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
}
