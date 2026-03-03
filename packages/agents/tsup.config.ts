import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "handlers/index": "src/handlers/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  external: [
    "react",
    "@jchaffin/voicekit",
    "@jchaffin/voicekit/openai",
    "@openai/agents",
    "@openai/agents/realtime",
  ],
});
