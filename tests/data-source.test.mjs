import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DATA_SOURCE,
  DataContractError,
  NoSignalsError,
  loadSnapshot,
  validateSnapshot,
} from "../src/data-source.mjs";

const snapshotPath = new URL("../data/daily/2026-07-18.json", import.meta.url);

test("acepta el snapshot versionado usado por el frontend", async () => {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  assert.equal(validateSnapshot(snapshot), snapshot);
  assert.equal(snapshot.senales.length, 5);
});

test("rechaza una señal sin fuente válida", async () => {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  snapshot.senales[0].fuente.url = "javascript:alert(1)";
  assert.throws(() => validateSnapshot(snapshot), DataContractError);
});

test("rechaza snapshots vacíos en lugar de inventar datos", async () => {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  snapshot.senales = [];
  assert.throws(() => validateSnapshot(snapshot), /lista no vacía/);
});

test("carga el contrato desde la API server-side declarada", async () => {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  let requestedUrl;
  const loaded = await loadSnapshot({
    fetchImpl: async (url) => {
      requestedUrl = url;
      return new Response(JSON.stringify(snapshot), { status: 200 });
    },
  });
  assert.equal(requestedUrl, "/api/signals/latest");
  assert.equal(DATA_SOURCE.kind, "api-supabase-server-side");
  assert.equal(loaded.fecha, "2026-07-18");
});

test("distingue la ausencia de runs de un error técnico", async () => {
  await assert.rejects(
    loadSnapshot({ fetchImpl: async () => new Response("{}", { status: 404 }) }),
    NoSignalsError,
  );
});
