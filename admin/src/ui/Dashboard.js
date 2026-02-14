import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
/**
 * Teacher dashboard with classroom creation flow.
 */
export function Dashboard(props) {
    const [classroomName, setClassroomName] = useState("");
    const handleCreate = async (event) => {
        event.preventDefault();
        await props.onCreateClassroom(classroomName);
        setClassroomName("");
    };
    return (_jsxs("main", { style: { fontFamily: "sans-serif", padding: 24, maxWidth: 700 }, children: [_jsx("h1", { children: "Odyssey Admin Dashboard" }), _jsxs("p", { children: ["Signed in as ", props.user.displayName, " (", props.user.email, ")"] }), _jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 16 }, children: [_jsx("button", { disabled: props.isLoading, onClick: props.onRefresh, type: "button", children: "Refresh" }), _jsx("button", { disabled: props.isLoading, onClick: props.onLogout, type: "button", children: "Sign out" })] }), _jsxs("form", { onSubmit: handleCreate, style: { display: "flex", gap: 8, marginBottom: 16 }, children: [_jsx("input", { required: true, placeholder: "New classroom name", value: classroomName, onChange: (event) => setClassroomName(event.target.value) }), _jsx("button", { disabled: props.isLoading, type: "submit", children: "Create classroom" })] }), props.errorMessage ? _jsx("p", { style: { color: "#dc2626" }, children: props.errorMessage }) : null, _jsx("h2", { children: "Classrooms" }), _jsx("ul", { children: props.classrooms.map((classroom) => (_jsxs("li", { children: [classroom.name, " - ", new Date(classroom.createdAt).toLocaleString()] }, classroom.id))) })] }));
}
//# sourceMappingURL=Dashboard.js.map