/**
 * Lightweight player profile shared across API boundaries.
 */
export interface PlayerProfile {
  id: string;
  displayName: string;
  role: "student" | "teacher";
  classroomId: string | null;
}
