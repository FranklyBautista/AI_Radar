const STATUS_POINTS = Object.freeze({
  accionable: 30,
  nueva: 28,
  activa: 26,
  "en-seguimiento": 22,
  "en-observacion": 18,
});

const CONFIDENCE_POINTS = Object.freeze({
  alta: 30,
  media: 22,
  baja: 12,
});

const STATUS_LABELS = Object.freeze({
  accionable: "Accionable",
  nueva: "Nueva",
  activa: "Activa",
  "en-seguimiento": "En seguimiento",
  "en-observacion": "En observación",
});

export const RANKING_EXPLANATION =
  "Puntaje local derivado de estado, confianza, completitud y etiquetas; no proviene del snapshot.";

export function deriveRankingScore(signal) {
  const status = STATUS_POINTS[signal.estado] ?? 0;
  const confidence = CONFIDENCE_POINTS[signal.confianza] ?? 8;
  const completeness =
    (signal.evidencia?.trim() ? 15 : 0) +
    (signal.impacto?.trim() ? 15 : 0) +
    (signal.accion?.trim() ? 10 : 0);
  const tags = Math.min((signal.etiquetas?.length ?? 0) * 2, 8);
  return Math.min(100, status + confidence + completeness + tags);
}

export function rankSignals(signals, adjustments = new Map()) {
  return signals
    .map((signal) => {
      const adjustment = Number(adjustments.get(signal.id) ?? 0);
      const score = Math.max(0, Math.min(100, deriveRankingScore(signal) + adjustment));
      return { ...signal, score, scoreAdjustment: adjustment };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = a.fuente.fecha_publicacion ?? "";
      const dateB = b.fuente.fecha_publicacion ?? "";
      return dateB.localeCompare(dateA) || a.id.localeCompare(b.id);
    });
}

export function formatStatus(status) {
  return STATUS_LABELS[status] ?? status;
}

export function formatConfidence(confidence = "sin dato") {
  return confidence === "sin dato"
    ? "Confianza sin dato"
    : `Confianza ${confidence}`;
}

export function formatCategory(tags = []) {
  const tag = tags[0] ?? "general";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}
