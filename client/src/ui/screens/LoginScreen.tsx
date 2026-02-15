import { useState, type CSSProperties, type FormEvent, type ReactElement } from "react";

export interface LoginValues {
  email: string;
  password: string;
}

interface LoginScreenProps {
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (values: LoginValues) => Promise<void>;
  /** When undefined, the "register" link is hidden (public registration disabled). */
  onSwitchToRegister?: (() => void) | undefined;
}

/**
 * Full-page login form displayed before the game canvas loads.
 */
export function LoginScreen(props: LoginScreenProps): ReactElement {
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await props.onSubmit(values);
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={titleStyle}>Archive Raiders</h1>
        <h2 style={subtitleStyle}>Sign In</h2>

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

        <button disabled={props.isLoading} type="submit" style={primaryButtonStyle}>
          {props.isLoading ? "Signing in\u2026" : "Sign in"}
        </button>

        {props.onSwitchToRegister ? (
          <button
            disabled={props.isLoading}
            type="button"
            style={linkButtonStyle}
            onClick={props.onSwitchToRegister}
          >
            Need an account? Register
          </button>
        ) : null}

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
