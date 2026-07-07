import { spawn } from "node:child_process";

interface SmokeCheck {
  label: string;
  command: string;
  args: string[];
}

const checks: SmokeCheck[] = [
  {
    label: "AI expert schema, mapper, prompt, and fixtures",
    command: "npm",
    args: ["run", "test:p0-plus"],
  },
  {
    label: "Guest preview API, storage, rate limit, route guards, and privacy",
    command: "npm",
    args: ["run", "test:p0-plus-preview"],
  },
  {
    label: "Homepage flag gating, read-only preview UI, input guard, and login callback",
    command: "npm",
    args: ["run", "test:p0-plus-ui"],
  },
  {
    label: "Authenticated continuation and conversion idempotency",
    command: "npx",
    args: ["tsx", "src/lib/p0-plus/convert.test.ts"],
  },
];

const env = { ...process.env };
delete env.P0_PLUS_PREVIEW_ENABLED;

function runCheck(check: SmokeCheck) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n[p0-plus-smoke] ${check.label}`);
    console.log(`[p0-plus-smoke] ${check.command} ${check.args.join(" ")}`);

    const child = spawn(check.command, check.args, {
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${check.label} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  console.log("[p0-plus-smoke] Running default-disabled P0+ smoke coverage.");
  console.log("[p0-plus-smoke] This script does not call a real AI provider and does not enable production flags.");

  for (const check of checks) {
    await runCheck(check);
  }

  console.log("\n[p0-plus-smoke] Passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
