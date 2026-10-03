import "dotenv/config";
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const value = process.env.DATABASE_URL || "file:./prisma/dev.db";
if (!value.startsWith("file:"))
  throw new Error(
    "This project uses a local SQLite database. Configure database-specific backup before migrating another database.",
  );
const filename = value.startsWith("file://")
  ? fileURLToPath(value)
  : path.resolve(decodeURIComponent(value.slice(5)));
if (existsSync(filename)) {
  mkdirSync("backups", { recursive: true });
  const destination = path.resolve(
    "backups",
    `hessa-${new Date().toISOString().replace(/[:.]/g, "-")}.db`,
  );
  const db = new Database(filename, { readonly: true });
  try {
    await db.backup(destination);
    console.log(`Database backup saved: ${destination}`);
  } finally {
    db.close();
  }
} else console.log("No existing database to back up; setup will create one.");
