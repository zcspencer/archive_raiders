declare module "@vitejs/plugin-react" {
  import type { PluginOption } from "vite";

  export type ReactPluginOptions = Record<string, unknown>;

  export default function react(options?: ReactPluginOptions): PluginOption;
}
