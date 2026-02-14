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

/**
 * Request payload for enrolling a student in a classroom.
 */
export interface CreateClassroomMembershipRequest {
  studentEmail: string;
}

/**
 * Classroom membership record returned by enrollment APIs.
 */
export interface ClassroomMembership {
  classroomId: string;
  userId: string;
  createdAt: string;
}
