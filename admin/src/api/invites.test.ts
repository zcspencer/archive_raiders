import { beforeEach, describe, expect, it, vi } from "vitest";
import { listClassroomInvites } from "./invites";
import { requestJson } from "./client";

vi.mock("./client", () => ({
  requestJson: vi.fn()
}));

describe("listClassroomInvites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests classroom invite list endpoint", async () => {
    vi.mocked(requestJson).mockResolvedValue([
      {
        id: "invite-1",
        email: "student@example.com",
        token: "token-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2026-01-08T00:00:00.000Z",
        acceptedAt: null
      }
    ]);

    await listClassroomInvites("token-1", "class-1");

    expect(requestJson).toHaveBeenCalledWith("/classrooms/class-1/invites", {}, "token-1");
  });
});
