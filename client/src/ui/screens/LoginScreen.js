import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
/**
 * Login form for Batch 1 client authentication.
 */
export function LoginScreen(props) {
    const [values, setValues] = useState({ email: "", password: "" });
    const handleSubmit = async (event) => {
        event.preventDefault();
        await props.onSubmit(values);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, style: panelStyle, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Student Login" }), _jsxs("label", { style: labelStyle, children: ["Email", _jsx("input", { required: true, type: "email", value: values.email, onChange: (event) => setValues({ ...values, email: event.target.value }) })] }), _jsxs("label", { style: labelStyle, children: ["Password", _jsx("input", { required: true, minLength: 8, type: "password", value: values.password, onChange: (event) => setValues({ ...values, password: event.target.value }) })] }), _jsx("button", { disabled: props.isLoading, type: "submit", children: props.isLoading ? "Signing in..." : "Sign in" }), _jsx("button", { disabled: props.isLoading, type: "button", onClick: props.onSwitchToRegister, children: "Need an account?" })] }));
}
const panelStyle = {
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
const labelStyle = {
    display: "grid",
    gap: 4,
    fontSize: 14
};
//# sourceMappingURL=LoginScreen.js.map