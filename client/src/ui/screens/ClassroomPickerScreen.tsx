import { useEffect, useState, type CSSProperties, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";
import { listClassrooms } from "../../api/classrooms";
import { useClassroomStore } from "../../store/classroom";

interface ClassroomPickerScreenProps {
  user: AuthUser;
  accessToken: string;
  onSelect: (classroom: Classroom) => void;
  onLogout: () => void;
}

/**
 * Full-page screen for selecting a classroom before entering the game.
 */
export function ClassroomPickerScreen(props: ClassroomPickerScreenProps): ReactElement {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storeSetClassrooms = useClassroomStore((s) => s.setClassrooms);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listClassrooms(props.accessToken)
      .then((results) => {
        setClassrooms(results);
        storeSetClassrooms(results);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load classrooms")
      )
      .finally(() => setIsLoading(false));
  }, [props.accessToken, storeSetClassrooms]);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Archive Raiders</h1>
        <p style={greetingStyle}>
          Welcome, {props.user.displayName}
        </p>
        <h2 style={subtitleStyle}>Choose a Classroom</h2>

        {isLoading ? (
          <p style={statusStyle}>Loading classrooms&hellip;</p>
        ) : null}

        {error ? (
          <p style={errorStyle}>{error}</p>
        ) : null}

        {!isLoading && !error && classrooms.length === 0 ? (
          <p style={statusStyle}>
            No classrooms available. Ask your teacher to enroll you.
          </p>
        ) : null}

        <div style={listStyle}>
          {classrooms.map((classroom) => (
            <button
              key={classroom.id}
              type="button"
              style={classroomButtonStyle}
              onClick={() => props.onSelect(classroom)}
            >
              {classroom.name}
            </button>
          ))}
        </div>

        <button type="button" style={logoutButtonStyle} onClick={props.onLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const pageStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  zIndex: 200
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 400,
  maxWidth: "90vw",
  maxHeight: "80vh",
  padding: "32px 28px",
  background: "rgba(30, 41, 59, 0.95)",
  border: "1px solid #334155",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  color: "#a3e635",
  textAlign: "center",
  letterSpacing: "0.02em"
};

const greetingStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "#94a3b8",
  textAlign: "center"
};

const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 16,
  fontWeight: 400,
  color: "#cbd5e1",
  textAlign: "center"
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  overflowY: "auto",
  maxHeight: "40vh"
};

const classroomButtonStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: 15,
  fontWeight: 600,
  textAlign: "left",
  background: "#1e293b",
  border: "1px solid #475569",
  borderRadius: 8,
  color: "#f1f5f9",
  cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s"
};

const statusStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "#94a3b8",
  textAlign: "center"
};

const errorStyle: CSSProperties = {
  margin: 0,
  padding: "8px 10px",
  fontSize: 13,
  color: "#fda4af",
  background: "rgba(248,113,113,0.1)",
  borderRadius: 6
};

const logoutButtonStyle: CSSProperties = {
  marginTop: 4,
  padding: "6px 0",
  fontSize: 13,
  background: "none",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  textDecoration: "underline"
};
