import { useEffect, useState, type ReactElement } from "react";
import { useAuthStore } from "../store/auth";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";

export function App(): ReactElement {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { user, isLoading, errorMessage, hydrate, login, register, logout } =
    useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!user && mode === "register") {
    return (
      <RegisterScreen
        isLoading={isLoading}
        onSwitchToLogin={() => setMode("login")}
        onSubmit={register}
      />
    );
  }

  if (!user) {
    return (
      <LoginScreen
        isLoading={isLoading}
        onSwitchToRegister={() => setMode("register")}
        onSubmit={login}
      />
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        color: "#f9fafb",
        fontFamily: "sans-serif",
        background: "rgba(17, 24, 39, 0.85)",
        padding: "8px 12px",
        borderRadius: 8
      }}
    >
      <p style={{ marginTop: 0, marginBottom: 8 }}>
        Signed in as {user.displayName} ({user.role})
      </p>
      <p style={{ marginTop: 0, marginBottom: 8 }}>Odyssey UI Overlay Ready</p>
      {errorMessage ? <p style={{ color: "#fda4af" }}>{errorMessage}</p> : null}
      <button onClick={logout} type="button">
        Sign out
      </button>
    </div>
  );
}
