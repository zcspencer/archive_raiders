/**
 * Public invite information returned when validating an invite token.
 */
export interface InviteInfo {
  token: string;
  email: string;
  classroomName: string;
  expiresAt: string;
}

/**
 * Request payload for creating a classroom invite.
 */
export interface CreateInviteRequest {
  email: string;
}

/**
 * Request payload for accepting an invite and creating a student account.
 */
export interface AcceptInviteRequest {
  displayName: string;
  password: string;
}

/**
 * Response returned after successfully accepting an invite.
 */
export interface AcceptInviteResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "student";
  };
}
