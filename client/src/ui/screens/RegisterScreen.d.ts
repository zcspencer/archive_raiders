import { type ReactElement } from "react";
import type { UserRole } from "@odyssey/shared";
export interface RegisterValues {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
}
interface RegisterScreenProps {
    isLoading: boolean;
    onSubmit: (values: RegisterValues) => Promise<void>;
    onSwitchToLogin: () => void;
}
/**
 * Registration form for new users.
 */
export declare function RegisterScreen(props: RegisterScreenProps): ReactElement;
export {};
//# sourceMappingURL=RegisterScreen.d.ts.map