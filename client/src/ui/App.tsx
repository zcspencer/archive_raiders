import { useEffect, useState, type ReactElement } from "react";
import type { Classroom } from "@odyssey/shared";
import { listClassrooms } from "../api/classrooms";
import { useColyseusRoom } from "../hooks/useColyseusRoom";
import { useGameRoomBridgeStore } from "../store/gameRoomBridge";
import { useAuthStore } from "../store/auth";
import { useClassroomStore } from "../store/classroom";
import { usePlayerControlStore } from "../store/playerControl";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";

export function App(): ReactElement {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [classroomError, setClassroomError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const { user, isLoading, errorMessage, hydrate, login, register, logout } =
    useAuthStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { classrooms, selectedClassroomId, setClassrooms, selectClassroom, clear } =
    useClassroomStore();
  const inputMode = usePlayerControlStore((state) => state.inputMode);
  const selectedHotbarSlot = usePlayerControlStore((state) => state.selectedHotbarSlot);
  const equippedToolId = usePlayerControlStore((state) => state.equippedToolId);
  const toggleInventoryMode = usePlayerControlStore((state) => state.toggleInventoryMode);
  const setInputMode = usePlayerControlStore((state) => state.setInputMode);
  const setSelectedHotbarSlot = usePlayerControlStore((state) => state.setSelectedHotbarSlot);
  const roomConnection = useColyseusRoom({
    accessToken,
    classroomId: selectedClassroomId
  });

  useEffect(() => {
    setInputMode(user ? "game" : "ui");
  }, [setInputMode, user]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const targetTag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
        return;
      }
      if (!user) {
        return;
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        toggleInventoryMode();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setInputMode("ui");
        return;
      }
      const hotbarSlot = hotbarSlotFromKey(event.key);
      if (hotbarSlot === null) {
        return;
      }
      setSelectedHotbarSlot(hotbarSlot);
      useGameRoomBridgeStore.getState().sendSelectHotbar(hotbarSlot);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setInputMode, setSelectedHotbarSlot, toggleInventoryMode, user]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) {
      clear();
      setClassroomError(null);
      return;
    }

    if (!accessToken) {
      clear();
      setSessionMessage("Session expired. Please sign in again.");
      logout();
      return;
    }

    setSessionMessage(null);
    setIsLoadingClassrooms(true);
    setClassroomError(null);
    void listClassrooms(accessToken)
      .then((results: Classroom[]) => {
        setClassrooms(results);
      })
      .catch((error: unknown) => {
        setClassroomError(
          error instanceof Error ? error.message : "Failed to load classrooms"
        );
      })
      .finally(() => {
        setIsLoadingClassrooms(false);
      });
  }, [accessToken, clear, logout, setClassrooms, user]);

  if (!user && mode === "register") {
    return (
      <RegisterScreen
        errorMessage={errorMessage ?? sessionMessage}
        isLoading={isLoading}
        onSwitchToLogin={() => setMode("login")}
        onSubmit={register}
      />
    );
  }

  if (!user) {
    return (
      <LoginScreen
        errorMessage={errorMessage ?? sessionMessage}
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
      <label style={{ display: "grid", gap: 4, marginBottom: 8 }}>
        Classroom
        <select
          disabled={isLoadingClassrooms || classrooms.length === 0}
          value={selectedClassroomId ?? ""}
          onChange={(event) => selectClassroom(event.target.value)}
        >
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
          {classrooms.length === 0 ? <option value="">No classrooms</option> : null}
        </select>
      </label>
      <p style={{ marginTop: 0, marginBottom: 8 }}>
        Room status: {roomConnection.status}
      </p>
      <p style={{ marginTop: 0, marginBottom: 8 }}>
        Input mode: {inputMode} | Tool: {equippedToolId} | Hotbar: {selectedHotbarSlot + 1}
      </p>
      {classrooms.length === 0 && !isLoadingClassrooms && !classroomError ? (
        <p style={{ marginTop: 0, marginBottom: 8 }}>
          No classrooms available yet. Ask your teacher to enroll you.
        </p>
      ) : null}
      {roomConnection.sessionId ? (
        <p style={{ marginTop: 0, marginBottom: 8 }}>
          Session: {roomConnection.sessionId}
        </p>
      ) : null}
      {classroomError ? <p style={{ color: "#fda4af" }}>{classroomError}</p> : null}
      {roomConnection.errorMessage ? (
        <p style={{ color: "#fda4af" }}>{roomConnection.errorMessage}</p>
      ) : null}
      {errorMessage ? <p style={{ color: "#fda4af" }}>{errorMessage}</p> : null}
      <button onClick={logout} type="button">
        Sign out
      </button>
    </div>
  );
}

function hotbarSlotFromKey(key: string): number | null {
  if (key === "0") {
    return 9;
  }
  if (key >= "1" && key <= "9") {
    return Number(key) - 1;
  }
  return null;
}
