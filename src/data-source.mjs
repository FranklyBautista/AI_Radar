export const DATA_SOURCE = Object.freeze({
  kind: "api-supabase-server-side",
  url: "/api/signals/latest",
  contract: "./contracts/ai-radar-signal.schema.json",
  activation: "fetch al iniciar la aplicación",
  security: "La clave de Supabase permanece en el servidor.",
});

export const DEMO_DATA_SOURCE = Object.freeze({
  kind: "local-demo-fallback",
  url: "/data/daily/2026-07-18.json",
  contract: "./contracts/ai-radar-signal.schema.json",
  activation:
    "snapshot local de solo lectura cuando la API no responde, no tiene runs o devuelve datos inválidos",
  security: "El snapshot está versionado y no contiene credenciales.",
});

const STATUS_VALUES = new Set([
  "nueva",
  "activa",
  "accionable",
  "en-seguimiento",
  "en-observacion",
]);
const CONFIDENCE_VALUES = new Set(["alta", "media", "baja"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class DataContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataContractError";
  }
}

export class NoSignalsError extends Error {
  constructor(message) {
    super(message);
    this.name = "NoSignalsError";
  }
}

function requireString(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DataContractError(`${path} debe ser un string no vacío`);
  }
}

function validateSignal(signal, index) {
  const base = `senales[${index}]`;
  if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
    throw new DataContractError(`${base} debe ser un objeto`);
  }

  for (const field of ["id", "titulo", "evidencia", "impacto", "accion", "estado"]) {
    requireString(signal[field], `${base}.${field}`);
  }

  if (!STATUS_VALUES.has(signal.estado)) {
    throw new DataContractError(`${base}.estado no pertenece al contrato`);
  }
  if (signal.confianza !== undefined && !CONFIDENCE_VALUES.has(signal.confianza)) {
    throw new DataContractError(`${base}.confianza no pertenece al contrato`);
  }
  if (signal.etiquetas !== undefined && !Array.isArray(signal.etiquetas)) {
    throw new DataContractError(`${base}.etiquetas debe ser una lista`);
  }
  if (!signal.fuente || typeof signal.fuente !== "object" || Array.isArray(signal.fuente)) {
    throw new DataContractError(`${base}.fuente debe ser un objeto`);
  }

  requireString(signal.fuente.nombre, `${base}.fuente.nombre`);
  requireString(signal.fuente.url, `${base}.fuente.url`);
  try {
    const url = new URL(signal.fuente.url);
    if (!new Set(["http:", "https:"]).has(url.protocol)) {
      throw new Error("Protocolo no permitido");
    }
  } catch {
    throw new DataContractError(`${base}.fuente.url debe ser una URL HTTP válida`);
  }

  if (
    signal.fuente.fecha_publicacion !== undefined &&
    !DATE_RE.test(signal.fuente.fecha_publicacion)
  ) {
    throw new DataContractError(`${base}.fuente.fecha_publicacion debe usar YYYY-MM-DD`);
  }
}

export function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new DataContractError("La respuesta debe ser un snapshot JSON");
  }

  requireString(snapshot.contract_version, "contract_version");
  requireString(snapshot.fecha, "fecha");
  if (!DATE_RE.test(snapshot.fecha)) {
    throw new DataContractError("fecha debe usar YYYY-MM-DD");
  }
  if (!snapshot.busqueda || typeof snapshot.busqueda !== "object") {
    throw new DataContractError("busqueda debe ser un objeto");
  }
  for (const field of ["consulta", "idioma", "criterio"]) {
    requireString(snapshot.busqueda[field], `busqueda.${field}`);
  }
  if (!Array.isArray(snapshot.senales) || snapshot.senales.length === 0) {
    throw new DataContractError("senales debe ser una lista no vacía");
  }

  snapshot.senales.forEach(validateSignal);
  return snapshot;
}

export async function loadSnapshot({
  fetchImpl = fetch,
  signal,
  allowDemoFallback = false,
  onSource,
} = {}) {
  let primaryError;

  try {
    const response = await fetchImpl(DATA_SOURCE.url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new NoSignalsError("Todavía no hay señales disponibles");
      }
      throw new Error(`No se pudo cargar el snapshot (${response.status})`);
    }

    const snapshot = validateSnapshot(await response.json());
    onSource?.({ kind: "live", source: DATA_SOURCE });
    return snapshot;
  } catch (error) {
    primaryError = error instanceof Error ? error : new Error("Error de datos desconocido");
  }

  if (!allowDemoFallback) throw primaryError;

  try {
    const response = await fetchImpl(DEMO_DATA_SOURCE.url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal,
    });
    if (!response.ok) {
      throw new Error(`No se pudo cargar la demo local (${response.status})`);
    }

    const snapshot = validateSnapshot(await response.json());
    onSource?.({
      kind: "demo",
      source: DEMO_DATA_SOURCE,
      reason: primaryError.message,
    });
    return snapshot;
  } catch {
    throw primaryError;
  }
}
