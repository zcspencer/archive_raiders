import { useState, type CSSProperties, type FormEvent, type ReactElement } from "react";
import type { UserRole } from "@odyssey/shared";

export interface RegisterValues {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

interface RegisterScreenProps {
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (values: RegisterValues) => Promise<void>;
  onSwitchToLogin: () => void;
}

/**
 * Full-page registration form displayed before the game canvas loads.
 */
export function RegisterScreen(props: RegisterScreenProps): ReactElement {
  const [values, setValues] = useState<RegisterValues>({
    email: "",
    password: "",
    displayName: "",
    role: "student"
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await props.onSubmit(values);
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={titleStyle}>Archive Raiders</h1>
        <h2 style={subtitleStyle}>Create Account</h2>

        <label style={labelStyle}>
          Display name
          <input
            required
            style={inputStyle}
            value={values.displayName}
            onChange={(e) => setValues({ ...values, displayName: e.target.value })}
          />
        </label>

        <label style={labelStyle}>
          Email
          <input
            required
            type="email"
            style={inputStyle}
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </label>

        <label style={labelStyle}>
          Password
          <input
            required
            minLength={8}
            type="password"
            style={inputStyle}
            value={values.password}
            onChange={(e) => setValues({ ...values, password: e.target.value })}
          />
        </label>

        <label style={labelStyle}>
          Role
          <select
            style={inputStyle}
            value={values.role}
            onChange={(e) => setValues({ ...values, role: e.target.value as UserRole })}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </label>

        <button disabled={props.isLoading} type="submit" style={primaryButtonStyle}>
          {props.isLoading ? "Creating\u2026" : "Create account"}
        </button>

        <button
          disabled={props.isLoading}
          type="button"
          style={linkButtonStyle}
          onClick={props.onSwitchToLogin}
        >
          Already have an account? Sign in
        </button>

        {props.errorMessage ? (
          <p style={errorStyle}>{props.errorMessage}</p>
        ) : null}
      </form>
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
  width: 340,
  maxWidth: "90vw",
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

const subtitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 400,
  color: "#94a3b8",
  textAlign: "center"
};

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 14,
  color: "#cbd5e1"
};

const inputStyle: CSSProperties = {
  padding: "8px 10px",
  fontSize: 14,
  background: "#0f172a",
  border: "1px solid #475569",
  borderRadius: 6,
  color: "#f1f5f9",
  outline: "none"
};

const primaryButtonStyle: CSSProperties = {
  marginTop: 4,
  padding: "10px 0",
  fontSize: 15,
  fontWeight: 600,
  background: "#65a30d",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer"
};

const linkButtonStyle: CSSProperties = {
  padding: "6px 0",
  fontSize: 13,
  background: "none",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  textDecoration: "underline"
};

const errorStyle: CSSProperties = {
  margin: 0,
  padding: "8px 10px",
  fontSize: 13,
  color: "#fda4af",
  background: "rgba(248,113,113,0.1)",
  borderRadius: 6
};
