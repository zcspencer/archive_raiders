import type { TaskAnswer, TaskResult } from "@odyssey/shared";
import { requestJson } from "./client";

/** Request body for POST /tasks/:taskId/submit. */
export interface SubmitTaskPayload {
  classroomId: string;
  answer: TaskAnswer;
  attemptId: string;
  startedAt?: string;
}

/** Response shape for GET /tasks/completions. */
export interface TaskCompletionsResponse {
  taskIds: string[];
}

/**
 * Submits a task answer to the server for validation and persistence.
 *
 * @param accessToken - Bearer token for authentication
 * @param taskId - Task definition id
 * @param payload - Classroom, answer, attempt id, and optional client started-at timestamp
 * @returns The validation result from the server
 */
export async function submitTask(
  accessToken: string,
  taskId: string,
  payload: SubmitTaskPayload
): Promise<TaskResult> {
  return requestJson<TaskResult>(`/tasks/${encodeURIComponent(taskId)}/submit`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      classroomId: payload.classroomId,
      answer: payload.answer,
      attemptId: payload.attemptId,
      ...(payload.startedAt != null && { startedAt: payload.startedAt })
    })
  });
}

/**
 * Fetches the list of task IDs the authenticated user has successfully completed.
 * Used to populate the local completion cache at game join.
 *
 * @param accessToken - Bearer token for authentication
 * @returns Distinct task IDs where the user has at least one correct submission
 */
export async function fetchCompletions(
  accessToken: string
): Promise<TaskCompletionsResponse> {
  return requestJson<TaskCompletionsResponse>("/tasks/completions", {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
}
