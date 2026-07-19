#!/usr/bin/env node

import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERCEL_VERSION = "56.3.2";
const PRODUCTION_ENDPOINT = "https://ai-radar-tawny.vercel.app/api/signals/save";

function run(command, args, options) {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`El proceso terminó por la señal ${signal}`));
      else resolveProcess(code ?? 1);
    });
  });
}

const [snapshotArgument] = process.argv.slice(2);
if (!snapshotArgument) {
  process.stderr.write(
    "Uso: node scripts/guardar_senales_produccion.mjs <snapshot.json>\n",
  );
  process.exitCode = 1;
} else {
  const snapshotPath = resolve(REPO_ROOT, snapshotArgument);
  const cleanDirectory = await mkdtemp(join(tmpdir(), "airadar-vercel-env-"));
  try {
    await mkdir(join(cleanDirectory, ".vercel"));
    await copyFile(
      join(REPO_ROOT, ".vercel", "project.json"),
      join(cleanDirectory, ".vercel", "project.json"),
    );

    process.exitCode = await run(
      "npx",
      [
        "--yes",
        `vercel@${VERCEL_VERSION}`,
        "--cwd",
        cleanDirectory,
        "env",
        "run",
        "--environment=production",
        "--",
        "python3",
        join(REPO_ROOT, "scripts", "guardar_senales_airadar.py"),
        snapshotPath,
        "--endpoint",
        PRODUCTION_ENDPOINT,
      ],
      { cwd: REPO_ROOT, env: process.env },
    );
  } finally {
    if (cleanDirectory.startsWith(join(tmpdir(), "airadar-vercel-env-"))) {
      await rm(cleanDirectory, { recursive: true, force: true });
    }
  }
}
