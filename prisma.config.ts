import { defineConfig } from "prisma/config";

try {
  const { config } = await import("dotenv");
  const path = await import("node:path");
  config({ path: path.resolve(process.cwd(), ".env.local") });
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
