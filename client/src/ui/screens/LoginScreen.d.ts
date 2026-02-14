import { type ReactElement } from "react";
export interface LoginValues {
    email: string;
    password: string;
}
interface LoginScreenProps {
    isLoading: boolean;
    onSubmit: (values: LoginValues) => Promise<void>;
    onSwitchToRegister: () => void;
}
/**
 * Login form for Batch 1 client authentication.
 */
export declare function LoginScreen(props: LoginScreenProps): ReactElement;
export {};
//# sourceMappingURL=LoginScreen.d.ts.map