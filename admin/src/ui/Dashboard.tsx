import { useState, type FormEvent, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";
import { Link } from "react-router-dom";

interface DashboardProps {
  user: AuthUser;
  classrooms: Classroom[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateClassroom: (name: string) => Promise<void>;
  onInviteStudent: (classroomId: string, studentEmail: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

/**
 * Teacher dashboard with classroom creation flow.
 */
export function Dashboard(props: DashboardProps): ReactElement {
  const [classroomName, setClassroomName] = useState("");
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await props.onCreateClassroom(classroomName);
    setClassroomName("");
  };

  const handleInvite = async (
    event: FormEvent<HTMLFormElement>,
    classroomId: string
  ): Promise<void> => {
    event.preventDefault();
    const email = inviteEmails[classroomId]?.trim() ?? "";
    if (!email) {
      setInviteMessage("Student email is required");
      return;
    }
    try {
      await props.onInviteStudent(classroomId, email);
      setInviteEmails((previous) => ({ ...previous, [classroomId]: "" }));
      setInviteMessage(`Invite sent to ${email}`);
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : "Invite failed");
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
      {inviteMessage ? <p style={{ color: "#0369a1" }}>{inviteMessage}</p> : null}
      <h2>Classrooms</h2>
      <ul>
        {props.classrooms.map((classroom) => (
          <li key={classroom.id}>
            <div>
              {classroom.name} - {new Date(classroom.createdAt).toLocaleString()}
              {" - "}
              <Link to={`/classrooms/${classroom.id}`}>Open classroom</Link>
            </div>
            <form
              onSubmit={(event) => {
                void handleInvite(event, classroom.id);
              }}
              style={{ display: "flex", gap: 8, marginTop: 4 }}
            >
              <input
                required
                type="email"
                placeholder="Student email"
                value={inviteEmails[classroom.id] ?? ""}
                onChange={(event) =>
                  setInviteEmails((previous) => ({
                    ...previous,
                    [classroom.id]: event.target.value
                  }))
                }
              />
              <button disabled={props.isLoading} type="submit">
                Invite student
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
