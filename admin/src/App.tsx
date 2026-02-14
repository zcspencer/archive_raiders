import { useEffect, useState, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";
import { loginTeacher, registerTeacher } from "./api/auth";
import { addClassroomMembership, createClassroom, listClassrooms } from "./api/classrooms";
import { clearSession, loadSession, saveSession } from "./session/authSession";
import { Dashboard } from "./ui/Dashboard";
import { LoginScreen } from "./ui/LoginScreen";

export function App(): ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      return;
    }
    if (session.user.role !== "teacher") {
      clearSession();
      return;
    }
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void refreshClassrooms(accessToken, setClassrooms, setErrorMessage, setIsLoading);
  }, [accessToken]);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await loginTeacher(email, password);
      if (response.user.role !== "teacher") {
        throw new Error("Teacher account required");
      }
      saveSession({ accessToken: response.accessToken, user: response.user });
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (
    displayName: string,
    email: string,
    password: string
  ): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await registerTeacher(displayName, email, password);
      saveSession({ accessToken: response.accessToken, user: response.user });
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClassroom = async (name: string): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await createClassroom(accessToken, name);
      await refreshClassrooms(
        accessToken,
        setClassrooms,
        setErrorMessage,
        setIsLoading
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Create failed");
      setIsLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    await refreshClassrooms(accessToken, setClassrooms, setErrorMessage, setIsLoading);
  };

  const handleEnrollStudent = async (classroomId: string, studentEmail: string): Promise<void> => {
    if (!accessToken) {
      throw new Error("Authentication required");
    }
    await addClassroomMembership(accessToken, classroomId, studentEmail);
    await refreshClassrooms(accessToken, setClassrooms, setErrorMessage, setIsLoading);
  };

  const handleLogout = (): void => {
    clearSession();
    setAccessToken(null);
    setUser(null);
    setClassrooms([]);
    setErrorMessage(null);
  };

  if (!user) {
    return (
      <LoginScreen
        errorMessage={errorMessage}
        isLoading={isLoading}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <Dashboard
      classrooms={classrooms}
      errorMessage={errorMessage}
      isLoading={isLoading}
      onCreateClassroom={handleCreateClassroom}
      onEnrollStudent={handleEnrollStudent}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      user={user}
    />
  );
}

async function refreshClassrooms(
  accessToken: string,
  setClassrooms: (classrooms: Classroom[]) => void,
  setErrorMessage: (message: string | null) => void,
  setIsLoading: (value: boolean) => void
): Promise<void> {
  setIsLoading(true);
  setErrorMessage(null);
  try {
    const items = await listClassrooms(accessToken);
    setClassrooms(items);
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : "Failed to load classrooms");
  } finally {
    setIsLoading(false);
  }
}
