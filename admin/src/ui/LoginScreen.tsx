import { useState, type CSSProperties, type FormEvent, type ReactElement } from "react";

interface LoginScreenProps {
  isLoading: boolean;
  errorMessage: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  /** When undefined, the register toggle is hidden (public registration disabled). */
  onRegister?: ((displayName: string, email: string, password: string) => Promise<void>) | undefined;
}

/**
 * Teacher login/register screen for admin.
 */
export function LoginScreen(props: LoginScreenProps): ReactElement {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const canRegister = Boolean(props.onRegister);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isRegisterMode && props.onRegister) {
      await props.onRegister(displayName, email, password);
      return;
    }
    await props.onLogin(email, password);
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 420 }}>
      <h1>Odyssey Admin</h1>
      <p>{isRegisterMode && canRegister ? "Create teacher account" : "Teacher sign in"}</p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        {isRegisterMode && canRegister ? (
          <label style={labelStyle}>
            Display name
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        ) : null}
        <label style={labelStyle}>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label style={labelStyle}>
          Password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button disabled={props.isLoading} type="submit">
          {props.isLoading
            ? "Submitting..."
            : isRegisterMode && canRegister
              ? "Create teacher account"
              : "Sign in"}
        </button>
      </form>
      {canRegister ? (
        <button
          disabled={props.isLoading}
          onClick={() => setIsRegisterMode((value) => !value)}
          style={{ marginTop: 12 }}
          type="button"
        >
          {isRegisterMode ? "Already registered? Sign in" : "Need a teacher account?"}
        </button>
      ) : null}
      {props.errorMessage ? (
        <p style={{ color: "#dc2626", marginTop: 12 }}>{props.errorMessage}</p>
      ) : null}
    </main>
  );
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 4
};
