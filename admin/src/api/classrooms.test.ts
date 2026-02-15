import { describe, expect, it, vi, beforeEach } from "vitest";
import { addClassroomMembership, getClassroom } from "./classrooms";
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

describe("getClassroom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets a classroom by id endpoint", async () => {
    vi.mocked(requestJson).mockResolvedValue({
      id: "class-1",
      name: "Class One",
      teacherId: "teacher-1",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    await getClassroom("token-1", "class-1");

    expect(requestJson).toHaveBeenCalledWith("/classrooms/class-1", {}, "token-1");
  });
});
