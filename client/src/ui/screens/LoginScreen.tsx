import { useState, type CSSProperties, type FormEvent, type ReactElement } from "react";

export interface LoginValues {
  email: string;
  password: string;
}

interface LoginScreenProps {
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (values: LoginValues) => Promise<void>;
  onSwitchToRegister: () => void;
}

/**
 * Login form for Batch 1 client authentication.
 */
export function LoginScreen(props: LoginScreenProps): ReactElement {
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await props.onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>Student Login</h2>
      <label style={labelStyle}>
        Email
        <input
          required
          type="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
      </label>
      <label style={labelStyle}>
        Password
        <input
          required
          minLength={8}
          type="password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
        />
      </label>
      <button disabled={props.isLoading} type="submit">
        {props.isLoading ? "Signing in..." : "Sign in"}
      </button>
      <button disabled={props.isLoading} type="button" onClick={props.onSwitchToRegister}>
        Need an account?
      </button>
      {props.errorMessage ? <p style={{ color: "#fda4af", margin: 0 }}>{props.errorMessage}</p> : null}
    </form>
  );
}

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  display: "grid",
  gap: 8,
  width: 280,
  color: "#f9fafb",
  fontFamily: "sans-serif",
  background: "rgba(17, 24, 39, 0.92)",
  padding: 12,
  borderRadius: 8
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 14
};
