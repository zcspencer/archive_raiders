import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
/**
 * Registration form for new users.
 */
export function RegisterScreen(props) {
    const [values, setValues] = useState({
        email: "",
        password: "",
        displayName: "",
        role: "student"
    });
    const handleSubmit = async (event) => {
        event.preventDefault();
        await props.onSubmit(values);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, style: panelStyle, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Create Account" }), _jsxs("label", { style: labelStyle, children: ["Display name", _jsx("input", { required: true, value: values.displayName, onChange: (event) => setValues({ ...values, displayName: event.target.value }) })] }), _jsxs("label", { style: labelStyle, children: ["Email", _jsx("input", { required: true, type: "email", value: values.email, onChange: (event) => setValues({ ...values, email: event.target.value }) })] }), _jsxs("label", { style: labelStyle, children: ["Password", _jsx("input", { required: true, minLength: 8, type: "password", value: values.password, onChange: (event) => setValues({ ...values, password: event.target.value }) })] }), _jsxs("label", { style: labelStyle, children: ["Role", _jsxs("select", { value: values.role, onChange: (event) => setValues({
                            ...values,
                            role: event.target.value
                        }), children: [_jsx("option", { value: "student", children: "Student" }), _jsx("option", { value: "teacher", children: "Teacher" })] })] }), _jsx("button", { disabled: props.isLoading, type: "submit", children: props.isLoading ? "Creating..." : "Create account" }), _jsx("button", { disabled: props.isLoading, type: "button", onClick: props.onSwitchToLogin, children: "Already have an account?" })] }));
}
const panelStyle = {
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
const labelStyle = {
    display: "grid",
    gap: 4,
    fontSize: 14
};
//# sourceMappingURL=RegisterScreen.js.map