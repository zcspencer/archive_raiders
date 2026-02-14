import { useEffect, useState, type ReactElement } from "react";
import type { Classroom } from "@odyssey/shared";
import { useAuthStore } from "../store/auth";
import { useClassroomStore } from "../store/classroom";
import { usePlayerControlStore } from "../store/playerControl";
import { destroyGame } from "../game/bootstrap";
import { InviteAcceptScreen } from "./screens/InviteAcceptScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { ClassroomPickerScreen } from "./screens/ClassroomPickerScreen";
import { GameScreen } from "./screens/GameScreen";

/**
 * Root application component.
 *
 * Implements a three-screen state machine:
 *  1. Auth (login / register) -- no canvas
 *  2. Classroom picker -- no canvas
 *  3. Game -- fullscreen Phaser canvas + HUD overlays
 */
export function App(): ReactElement {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  const { user, accessToken, isLoading, errorMessage, hydrate, login, register, logout } =
    useAuthStore();
  const { selectClassroom, clear: clearClassrooms } = useClassroomStore();

  /* Restore persisted session on mount. */
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  /* Handle session expiry: if user exists but token is gone, force logout. */
  useEffect(() => {
    if (user && !accessToken) {
      handleLogout();
    }
  }, [user, accessToken]);

  const handleLogout = (): void => {
    destroyGame();
    setSelectedClassroom(null);
    clearClassrooms();
    usePlayerControlStore.getState().setInputMode("ui");
    logout();
  };

  const handleSelectClassroom = (classroom: Classroom): void => {
    selectClassroom(classroom.id);
    setSelectedClassroom(classroom);
  };

  /* ---------------------------------------------------------------- */
  /*  Screen routing                                                   */
  /* ---------------------------------------------------------------- */

  /* 0. Invite accept -- detect /invite/:token in URL. */
  const inviteMatch = window.location.pathname.match(/^\/invite\/([a-f0-9]+)$/);
  if (inviteMatch) {
    const inviteToken = inviteMatch[1]!;
    return (
      <InviteAcceptScreen
        token={inviteToken}
        onComplete={() => {
          /* Force re-render after auth state is set. */
          hydrate();
        }}
      />
    );
  }

  /* 1. Not authenticated -- show login or register. */
  if (!user || !accessToken) {
    if (authMode === "register") {
      return (
        <RegisterScreen
          errorMessage={errorMessage}
          isLoading={isLoading}
          onSwitchToLogin={() => setAuthMode("login")}
          onSubmit={register}
        />
      );
    }
    return (
      <LoginScreen
        errorMessage={errorMessage}
        isLoading={isLoading}
        onSwitchToRegister={() => setAuthMode("register")}
        onSubmit={login}
      />
    );
  }

  /* 2. Authenticated but no classroom selected -- show picker. */
  if (!selectedClassroom) {
    return (
      <ClassroomPickerScreen
        user={user}
        accessToken={accessToken}
        onSelect={handleSelectClassroom}
        onLogout={handleLogout}
      />
    );
  }

  /* 3. Authenticated + classroom selected -- show the game. */
  return (
    <GameScreen
      user={user}
      accessToken={accessToken}
      classroom={selectedClassroom}
      onLogout={handleLogout}
    />
  );
}
