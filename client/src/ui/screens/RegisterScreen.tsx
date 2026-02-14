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
 * Registration form for new users.
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
    <form onSubmit={handleSubmit} style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>Create Account</h2>
      <label style={labelStyle}>
        Display name
        <input
          required
          value={values.displayName}
          onChange={(event) =>
            setValues({ ...values, displayName: event.target.value })
          }
        />
      </label>
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
      <label style={labelStyle}>
        Role
        <select
          value={values.role}
          onChange={(event) =>
            setValues({
              ...values,
              role: event.target.value as UserRole
            })
          }
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </label>
      <button disabled={props.isLoading} type="submit">
        {props.isLoading ? "Creating..." : "Create account"}
      </button>
      <button disabled={props.isLoading} type="button" onClick={props.onSwitchToLogin}>
        Already have an account?
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
  width: 300,
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
