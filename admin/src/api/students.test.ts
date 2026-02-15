import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "./client";
import { getClassroomStudentEconomy, listClassroomStudents } from "./students";

vi.mock("./client", () => ({
  requestJson: vi.fn()
}));

describe("listClassroomStudents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests classroom students endpoint", async () => {
    vi.mocked(requestJson).mockResolvedValue([
      {
        userId: "student-1",
        email: "student@example.com",
        displayName: "Student",
        membershipCreatedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);

    await listClassroomStudents("token-1", "class-1");

    expect(requestJson).toHaveBeenCalledWith("/classrooms/class-1/students", {}, "token-1");
  });
});

describe("getClassroomStudentEconomy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests classroom student economy endpoint", async () => {
    vi.mocked(requestJson).mockResolvedValue({
      inventory: [],
      currency: { coins: 12, museum_points: 2 }
    });

    await getClassroomStudentEconomy("token-1", "class-1", "student-1");

    expect(requestJson).toHaveBeenCalledWith(
      "/classrooms/class-1/students/student-1/economy",
      {},
      "token-1"
    );
  });
});
