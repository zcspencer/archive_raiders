import { useState, type FormEvent, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";

interface DashboardProps {
  user: AuthUser;
  classrooms: Classroom[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateClassroom: (name: string) => Promise<void>;
  onEnrollStudent: (classroomId: string, studentEmail: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

/**
 * Teacher dashboard with classroom creation flow.
 */
export function Dashboard(props: DashboardProps): ReactElement {
  const [classroomName, setClassroomName] = useState("");
  const [enrollmentEmails, setEnrollmentEmails] = useState<Record<string, string>>({});
  const [enrollmentMessage, setEnrollmentMessage] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await props.onCreateClassroom(classroomName);
    setClassroomName("");
  };

  const handleEnroll = async (
    event: FormEvent<HTMLFormElement>,
    classroomId: string
  ): Promise<void> => {
    event.preventDefault();
    const email = enrollmentEmails[classroomId]?.trim() ?? "";
    if (!email) {
      setEnrollmentMessage("Student email is required");
      return;
    }
    try {
      await props.onEnrollStudent(classroomId, email);
      setEnrollmentEmails((previous) => ({ ...previous, [classroomId]: "" }));
      setEnrollmentMessage(`Enrolled ${email}`);
    } catch (error) {
      setEnrollmentMessage(error instanceof Error ? error.message : "Enrollment failed");
    }
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 700 }}>
      <h1>Odyssey Admin Dashboard</h1>
      <p>
        Signed in as {props.user.displayName} ({props.user.email})
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button disabled={props.isLoading} onClick={props.onRefresh} type="button">
          Refresh
        </button>
        <button disabled={props.isLoading} onClick={props.onLogout} type="button">
          Sign out
        </button>
      </div>
      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          required
          placeholder="New classroom name"
          value={classroomName}
          onChange={(event) => setClassroomName(event.target.value)}
        />
        <button disabled={props.isLoading} type="submit">
          Create classroom
        </button>
      </form>
      {props.errorMessage ? <p style={{ color: "#dc2626" }}>{props.errorMessage}</p> : null}
      {enrollmentMessage ? <p style={{ color: "#0369a1" }}>{enrollmentMessage}</p> : null}
      <h2>Classrooms</h2>
      <ul>
        {props.classrooms.map((classroom) => (
          <li key={classroom.id}>
            <div>
              {classroom.name} - {new Date(classroom.createdAt).toLocaleString()}
            </div>
            <form
              onSubmit={(event) => {
                void handleEnroll(event, classroom.id);
              }}
              style={{ display: "flex", gap: 8, marginTop: 4 }}
            >
              <input
                required
                placeholder="Student email"
                value={enrollmentEmails[classroom.id] ?? ""}
                onChange={(event) =>
                  setEnrollmentEmails((previous) => ({
                    ...previous,
                    [classroom.id]: event.target.value
                  }))
                }
              />
              <button disabled={props.isLoading} type="submit">
                Add student
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
