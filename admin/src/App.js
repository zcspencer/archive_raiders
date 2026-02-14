import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { loginTeacher, registerTeacher } from "./api/auth";
import { createClassroom, listClassrooms } from "./api/classrooms";
import { clearSession, loadSession, saveSession } from "./session/authSession";
import { Dashboard } from "./ui/Dashboard";
import { LoginScreen } from "./ui/LoginScreen";
export function App() {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
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
    const handleLogin = async (email, password) => {
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
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Login failed");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleRegister = async (displayName, email, password) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await registerTeacher(displayName, email, password);
            saveSession({ accessToken: response.accessToken, user: response.user });
            setAccessToken(response.accessToken);
            setUser(response.user);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Registration failed");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCreateClassroom = async (name) => {
        if (!accessToken) {
            return;
        }
        setIsLoading(true);
        setErrorMessage(null);
        try {
            await createClassroom(accessToken, name);
            await refreshClassrooms(accessToken, setClassrooms, setErrorMessage, setIsLoading);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Create failed");
            setIsLoading(false);
        }
    };
    const handleRefresh = async () => {
        if (!accessToken) {
            return;
        }
        await refreshClassrooms(accessToken, setClassrooms, setErrorMessage, setIsLoading);
    };
    const handleLogout = () => {
        clearSession();
        setAccessToken(null);
        setUser(null);
        setClassrooms([]);
        setErrorMessage(null);
    };
    if (!user) {
        return (_jsx(LoginScreen, { errorMessage: errorMessage, isLoading: isLoading, onLogin: handleLogin, onRegister: handleRegister }));
    }
    return (_jsx(Dashboard, { classrooms: classrooms, errorMessage: errorMessage, isLoading: isLoading, onCreateClassroom: handleCreateClassroom, onLogout: handleLogout, onRefresh: handleRefresh, user: user }));
}
async function refreshClassrooms(accessToken, setClassrooms, setErrorMessage, setIsLoading) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
        const items = await listClassrooms(accessToken);
        setClassrooms(items);
    }
    catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load classrooms");
    }
    finally {
        setIsLoading(false);
    }
}
//# sourceMappingURL=App.js.map