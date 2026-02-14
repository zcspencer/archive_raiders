import { describe, expect, it, vi, beforeEach } from "vitest";
import { addClassroomMembership } from "./classrooms";
import { requestJson } from "./client";

vi.mock("./client", () => ({
  requestJson: vi.fn()
}));

describe("addClassroomMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts normalized enrollment payload to membership endpoint", async () => {
    vi.mocked(requestJson).mockResolvedValue({
      classroomId: "class-1",
      userId: "student-1",
      createdAt: new Date().toISOString()
    });

    await addClassroomMembership("token-1", "class-1", " Student@Example.com ");

    expect(requestJson).toHaveBeenCalledWith(
      "/classrooms/class-1/memberships",
      {
        method: "POST",
        body: JSON.stringify({ studentEmail: "student@example.com" })
      },
      "token-1"
    );
  });
});
