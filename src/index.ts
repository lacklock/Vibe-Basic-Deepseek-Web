import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";

const db1 = drizzle(process.env.DATABASE_URL!);

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("缺少 DATABASE_URL");
  }
  const db = drizzle(databaseUrl);
}

main();
