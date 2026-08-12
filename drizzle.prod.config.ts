import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.prod" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",

  schemaFilter: ["public"],

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
