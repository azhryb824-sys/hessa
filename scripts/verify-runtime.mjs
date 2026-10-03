import "dotenv/config";
if (process.env.HESSA_TEST_MODE !== "1")
  throw new Error(
    "Set HESSA_TEST_MODE=1 only with a disposable test database.",
  );
import { spawn } from "node:child_process";
const base = "http://127.0.0.1:3100";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--port",
    "3100",
    "--hostname",
    "127.0.0.1",
  ],
  {
    env: { ...process.env, APP_URL: base, SESSION_SECURE: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "";
server.stdout.on("data", (b) => {
  log += b;
});
server.stderr.on("data", (b) => {
  log += b;
});
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready) throw new Error("Server did not start: " + log);
  let code = 0;
  if (!process.argv.includes("--browser-only")) {
    const test = spawn(
      process.execPath,
      ["--import", "tsx", "scripts/integration.ts"],
      {
        env: { ...process.env, TEST_BASE_URL: base, HESSA_TEST_MODE: "1" },
        stdio: "inherit",
      },
    );
    code = await new Promise((r) => test.on("exit", r));
  }
  if (code !== 0) {
    process.exitCode = 1;
    console.error(log.slice(-5000));
  } else {
    console.log("Production server runtime verification completed");
    if (
      process.argv.includes("--browser") ||
      process.argv.includes("--browser-only")
    ) {
      const ui = spawn(process.execPath, ["scripts/browser-test.mjs"], {
        env: { ...process.env, TEST_BASE_URL: base },
        stdio: "inherit",
      });
      const uiCode = await new Promise((r) => ui.on("exit", r));
      if (uiCode !== 0) process.exitCode = 1;
    }
  }
} finally {
  server.kill("SIGTERM");
}
