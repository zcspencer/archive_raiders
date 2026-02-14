import { type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";
interface DashboardProps {
    user: AuthUser;
    classrooms: Classroom[];
    isLoading: boolean;
    errorMessage: string | null;
    onCreateClassroom: (name: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    onLogout: () => void;
}
/**
 * Teacher dashboard with classroom creation flow.
 */
export declare function Dashboard(props: DashboardProps): ReactElement;
export {};
//# sourceMappingURL=Dashboard.d.ts.map