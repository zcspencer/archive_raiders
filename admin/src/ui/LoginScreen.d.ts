import { type ReactElement } from "react";
interface LoginScreenProps {
    isLoading: boolean;
    errorMessage: string | null;
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (displayName: string, email: string, password: string) => Promise<void>;
}
/**
 * Teacher login/register screen for admin.
 */
export declare function LoginScreen(props: LoginScreenProps): ReactElement;
export {};
//# sourceMappingURL=LoginScreen.d.ts.map