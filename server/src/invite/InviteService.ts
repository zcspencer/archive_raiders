import { randomBytes, randomUUID } from "node:crypto";
import type { AuthResponse, InviteInfo } from "@odyssey/shared";
import type { PostgresDatabase } from "../db/postgres.js";
import type { AuthService } from "../auth/AuthService.js";
import type { ClassroomService } from "../classroom/ClassroomService.js";
import type { EmailService } from "./EmailService.js";

/** Invite expiry duration in milliseconds (7 days). */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Error raised when an invite token is invalid or expired.
 */
export class InviteNotFoundError extends Error {
  constructor() {
    super("Invite not found or expired");
  }
}

/**
 * Error raised when an invite has already been accepted.
 */
export class InviteAlreadyAcceptedError extends Error {
  constructor() {
    super("Invite has already been accepted");
  }
}

/**
 * Error raised when the invited email already has an account.
 */
export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email already exists. Please log in instead.");
  }
}

/**
 * Manages classroom invite creation, validation, and acceptance.
 */
export class InviteService {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly authService: AuthService,
    private readonly classroomService: ClassroomService,
    private readonly emailService: EmailService,
    private readonly inviteBaseUrl: string
  ) {}

  /**
   * Creates an invite for a student and sends the invitation email.
   */
  async createInvite(
    teacherId: string,
    teacherName: string,
    classroomId: string,
    email: string
  ): Promise<InviteInfo> {
    const normalizedEmail = email.trim().toLowerCase();

    /* Verify teacher owns the classroom. */
    const classroom = await this.classroomService.getByIdForUser(
      { id: teacherId, email: "", displayName: "", role: "teacher" },
      classroomId
    );
    if (!classroom) {
      throw new Error("Classroom not found or not owned by teacher");
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const id = randomUUID();

    await this.db.query(
      `
      INSERT INTO classroom_invites (id, classroom_id, email, token, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [id, classroomId, normalizedEmail, token, expiresAt.toISOString()]
    );

    const inviteUrl = `${this.inviteBaseUrl}/invite/${token}`;
    await this.emailService.sendInviteEmail(
      normalizedEmail,
      inviteUrl,
      classroom.name,
      teacherName
    );

    return {
      token,
      email: normalizedEmail,
      classroomName: classroom.name,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Retrieves public invite info by token for display on the accept page.
   */
  async getInviteByToken(token: string): Promise<InviteInfo> {
    const rows = await this.db.query<InviteRow>(
      `
      SELECT ci.token, ci.email, ci.expires_at, ci.accepted_at, c.name AS classroom_name
      FROM classroom_invites ci
      INNER JOIN classrooms c ON c.id = ci.classroom_id
      WHERE ci.token = $1
      `,
      [token]
    );

    const invite = rows[0];
    if (!invite) {
      throw new InviteNotFoundError();
    }

    if (invite.accepted_at) {
      throw new InviteAlreadyAcceptedError();
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new InviteNotFoundError();
    }

    return {
      token: invite.token,
      email: invite.email,
      classroomName: invite.classroom_name,
      expiresAt: invite.expires_at.toISOString()
    };
  }

  /**
   * Accepts an invite: creates a student account, enrolls in classroom, returns auth.
   */
  async acceptInvite(
    token: string,
    displayName: string,
    password: string
  ): Promise<AuthResponse> {
    const rows = await this.db.query<InviteAcceptRow>(
      `
      SELECT ci.id, ci.classroom_id, ci.email, ci.expires_at, ci.accepted_at,
             c.teacher_id
      FROM classroom_invites ci
      INNER JOIN classrooms c ON c.id = ci.classroom_id
      WHERE ci.token = $1
      `,
      [token]
    );

    const invite = rows[0];
    if (!invite) {
      throw new InviteNotFoundError();
    }
    if (invite.accepted_at) {
      throw new InviteAlreadyAcceptedError();
    }
    if (new Date(invite.expires_at) < new Date()) {
      throw new InviteNotFoundError();
    }

    /* Try to register the student account. */
    let authResponse: AuthResponse;
    try {
      authResponse = await this.authService.register({
        email: invite.email,
        password,
        displayName: displayName.trim(),
        role: "student"
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }

    /* Enroll student in classroom. */
    await this.classroomService.addStudentMembership(
      invite.teacher_id,
      invite.classroom_id,
      invite.email
    );

    /* Mark invite as accepted. */
    await this.db.query(
      `UPDATE classroom_invites SET accepted_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    return authResponse;
  }
}

interface InviteRow {
  token: string;
  email: string;
  expires_at: Date;
  accepted_at: Date | null;
  classroom_name: string;
}

interface InviteAcceptRow {
  id: string;
  classroom_id: string;
  email: string;
  expires_at: Date;
  accepted_at: Date | null;
  teacher_id: string;
}
