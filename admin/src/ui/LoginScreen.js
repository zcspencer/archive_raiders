import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
/**
 * Teacher login/register screen for admin.
 */
export function LoginScreen(props) {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isRegisterMode) {
            await props.onRegister(displayName, email, password);
            return;
        }
        await props.onLogin(email, password);
    };
    return (_jsxs("main", { style: { fontFamily: "sans-serif", padding: 24, maxWidth: 420 }, children: [_jsx("h1", { children: "Odyssey Admin" }), _jsx("p", { children: isRegisterMode ? "Create teacher account" : "Teacher sign in" }), _jsxs("form", { onSubmit: handleSubmit, style: { display: "grid", gap: 10 }, children: [isRegisterMode ? (_jsxs("label", { style: labelStyle, children: ["Display name", _jsx("input", { required: true, value: displayName, onChange: (event) => setDisplayName(event.target.value) })] })) : null, _jsxs("label", { style: labelStyle, children: ["Email", _jsx("input", { required: true, type: "email", value: email, onChange: (event) => setEmail(event.target.value) })] }), _jsxs("label", { style: labelStyle, children: ["Password", _jsx("input", { required: true, minLength: 8, type: "password", value: password, onChange: (event) => setPassword(event.target.value) })] }), _jsx("button", { disabled: props.isLoading, type: "submit", children: props.isLoading
                            ? "Submitting..."
                            : isRegisterMode
                                ? "Create teacher account"
                                : "Sign in" })] }), _jsx("button", { disabled: props.isLoading, onClick: () => setIsRegisterMode((value) => !value), style: { marginTop: 12 }, type: "button", children: isRegisterMode ? "Already registered? Sign in" : "Need a teacher account?" }), props.errorMessage ? (_jsx("p", { style: { color: "#dc2626", marginTop: 12 }, children: props.errorMessage })) : null] }));
}
const labelStyle = {
    display: "grid",
    gap: 4
};
//# sourceMappingURL=LoginScreen.js.map