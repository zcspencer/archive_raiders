import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
export function App() {
    const [mode, setMode] = useState("login");
    const { user, isLoading, errorMessage, hydrate, login, register, logout } = useAuthStore();
    useEffect(() => {
        hydrate();
    }, [hydrate]);
    if (!user && mode === "register") {
        return (_jsx(RegisterScreen, { isLoading: isLoading, onSwitchToLogin: () => setMode("login"), onSubmit: register }));
    }
    if (!user) {
        return (_jsx(LoginScreen, { isLoading: isLoading, onSwitchToRegister: () => setMode("register"), onSubmit: login }));
    }
    return (_jsxs("div", { style: {
            position: "absolute",
            top: 12,
            left: 12,
            color: "#f9fafb",
            fontFamily: "sans-serif",
            background: "rgba(17, 24, 39, 0.85)",
            padding: "8px 12px",
            borderRadius: 8
        }, children: [_jsxs("p", { style: { marginTop: 0, marginBottom: 8 }, children: ["Signed in as ", user.displayName, " (", user.role, ")"] }), _jsx("p", { style: { marginTop: 0, marginBottom: 8 }, children: "Odyssey UI Overlay Ready" }), errorMessage ? _jsx("p", { style: { color: "#fda4af" }, children: errorMessage }) : null, _jsx("button", { onClick: logout, type: "button", children: "Sign out" })] }));
}
//# sourceMappingURL=App.js.map