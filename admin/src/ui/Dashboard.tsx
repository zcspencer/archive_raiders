import { useState, type FormEvent, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";

interface DashboardProps {
  user: AuthUser;
  classrooms: Classroom[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateClassroom: (name: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

/**
 * Teacher dashboard with classroom creation flow.
 */
export function Dashboard(props: DashboardProps): ReactElement {
  const [classroomName, setClassroomName] = useState("");

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await props.onCreateClassroom(classroomName);
    setClassroomName("");
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
      <h2>Classrooms</h2>
      <ul>
        {props.classrooms.map((classroom) => (
          <li key={classroom.id}>
            {classroom.name} - {new Date(classroom.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
