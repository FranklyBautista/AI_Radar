import assert from "node:assert/strict";
import test from "node:test";

import { deriveRankingScore, formatStatus, rankSignals } from "../src/ranking.mjs";

const baseSignal = {
  id: "senal-base",
  titulo: "Señal base",
  evidencia: "Evidencia suficiente",
  impacto: "Impacto alto",
  accion: "Probar el flujo",
  estado: "accionable",
  confianza: "alta",
  etiquetas: ["modelos", "builders"],
  fuente: { nombre: "Fuente", url: "https://example.com", fecha_publicacion: "2026-07-06" },
};

test("deriva un puntaje reproducible sin mutar la señal", () => {
  const original = structuredClone(baseSignal);
  assert.equal(deriveRankingScore(baseSignal), 100);
  assert.deepEqual(baseSignal, original);
});

test("ordena por puntaje y aplica ajustes locales acotados", () => {
  const second = {
    ...baseSignal,
    id: "senal-dos",
    estado: "en-observacion",
    confianza: "baja",
  };
  const unadjusted = {
    ...baseSignal,
    id: "senal-uno",
    estado: "activa",
    confianza: "media",
  };
  const ranked = rankSignals([second, unadjusted], new Map([["senal-dos", 100]]));
  assert.equal(ranked[0].id, "senal-dos");
  assert.equal(ranked[0].score, 100);
  assert.equal(ranked[1].score, 92);
});

test("traduce los estados del contrato para la interfaz", () => {
  assert.equal(formatStatus("en-seguimiento"), "En seguimiento");
});
