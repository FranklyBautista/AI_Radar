import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  evaluateTheBatch,
  parseTheBatchHomepage,
} from "../scripts/recopilar_the_batch.mjs";

const fixtureUrl = new URL(
  "./fixtures/the-batch/homepage-inconsistent.html",
  import.meta.url,
);

test("selecciona determinísticamente la edición canónica más reciente", async () => {
  const html = await readFile(fixtureUrl, "utf8");
  const issues = parseTheBatchHomepage(html);
  const result = evaluateTheBatch(issues, {
    asOf: "2026-06-20",
    maxAgeDays: 14,
  });

  assert.equal(result.latest.issue, 358);
  assert.equal(result.latest.publication_date, "2026-06-19");
  assert.equal(result.latest.url, "https://www.deeplearning.ai/the-batch/issue-358");
  assert.equal(result.status, "actualizada");
  assert.equal(result.eligible_for_signal, true);
  assert.deepEqual(result.evidence.issue_numbers, [358, 355]);
});

test("marca la fuente como desactualizada sin habilitar una señal", async () => {
  const html = await readFile(fixtureUrl, "utf8");
  const result = evaluateTheBatch(parseTheBatchHomepage(html), {
    asOf: "2026-07-18",
    maxAgeDays: 14,
  });

  assert.equal(result.latest.issue, 358);
  assert.equal(result.latest.age_days, 29);
  assert.equal(result.status, "desactualizada");
  assert.equal(result.eligible_for_signal, false);
});

test("rechaza una portada sin enumeración estructurada", () => {
  assert.throws(
    () => parseTheBatchHomepage("<html><body>Sin datos</body></html>"),
    /__NEXT_DATA__/,
  );
});
