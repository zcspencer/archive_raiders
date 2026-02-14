/**
 * Classroom record visible through API responses.
 */
export interface Classroom {
  id: string;
  name: string;
  teacherId: string;
  createdAt: string;
}

/**
 * Request payload for creating a classroom.
 */
export interface CreateClassroomRequest {
  name: string;
}
