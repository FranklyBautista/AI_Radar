import { authorizeWriteRequest } from "../_lib/write-authorization.js";

const STATUS_VALUES = new Set([
  "nueva",
  "activa",
  "accionable",
  "en-seguimiento",
  "en-observacion",
]);

const CONFIDENCE_VALUES = new Set(["alta", "media", "baja"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function send(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function logInternalError(message, error) {
  console.error(
    `[signals/save] ${message}`,
    error instanceof Error ? error : new Error("Error no estandar"),
  );
}

function requireString(value, path, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path} debe ser un string no vacio`);
    return "";
  }
  return value;
}

function validateSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return ["El body debe ser un snapshot JSON"];
  }

  requireString(snapshot.contract_version, "contract_version", errors);
  const date = requireString(snapshot.fecha, "fecha", errors);
  if (date && !DATE_RE.test(date)) {
    errors.push("fecha debe usar formato YYYY-MM-DD");
  }

  if (!snapshot.busqueda || typeof snapshot.busqueda !== "object" || Array.isArray(snapshot.busqueda)) {
    errors.push("busqueda debe ser un objeto");
  } else {
    requireString(snapshot.busqueda.consulta, "busqueda.consulta", errors);
    requireString(snapshot.busqueda.idioma, "busqueda.idioma", errors);
    requireString(snapshot.busqueda.criterio, "busqueda.criterio", errors);
  }

  if (!Array.isArray(snapshot.senales) || snapshot.senales.length === 0) {
    errors.push("senales debe ser una lista no vacia");
    return errors;
  }

  snapshot.senales.forEach((signal, index) => {
    const base = `senales[${index}]`;
    if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
      errors.push(`${base} debe ser un objeto`);
      return;
    }

    requireString(signal.id, `${base}.id`, errors);
    requireString(signal.titulo, `${base}.titulo`, errors);
    requireString(signal.evidencia, `${base}.evidencia`, errors);
    requireString(signal.impacto, `${base}.impacto`, errors);
    requireString(signal.accion, `${base}.accion`, errors);

    const status = requireString(signal.estado, `${base}.estado`, errors);
    if (status && !STATUS_VALUES.has(status)) {
      errors.push(`${base}.estado no pertenece al contrato`);
    }

    if (signal.confianza !== undefined && !CONFIDENCE_VALUES.has(signal.confianza)) {
      errors.push(`${base}.confianza no pertenece al contrato`);
    }

    if (signal.etiquetas !== undefined && !Array.isArray(signal.etiquetas)) {
      errors.push(`${base}.etiquetas debe ser una lista`);
    }

    if (!signal.fuente || typeof signal.fuente !== "object" || Array.isArray(signal.fuente)) {
      errors.push(`${base}.fuente debe ser un objeto`);
      return;
    }

    requireString(signal.fuente.nombre, `${base}.fuente.nombre`, errors);
    const sourceUrl = requireString(signal.fuente.url, `${base}.fuente.url`, errors);
    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl);
        if (!new Set(["http:", "https:"]).has(url.protocol)) {
          throw new Error("Protocolo no permitido");
        }
      } catch {
        errors.push(`${base}.fuente.url debe ser una URL HTTP valida`);
      }
    }

    if (signal.fuente.fecha_publicacion !== undefined && !DATE_RE.test(signal.fuente.fecha_publicacion)) {
      errors.push(`${base}.fuente.fecha_publicacion debe usar formato YYYY-MM-DD`);
    }
  });

  return errors;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function supabaseRequest(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: key,
    "content-type": "application/json",
    ...options.headers,
  };

  if (!key.startsWith("sb_secret_")) {
    headers.authorization = `Bearer ${key}`;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Supabase ${response.status}: respuesta no JSON`);
  }
  if (!response.ok) {
    const message = data && data.message ? data.message : response.statusText;
    throw new Error(`Supabase ${response.status}: ${message}`);
  }
  return data;
}

async function upsertRun(snapshot) {
  const payload = {
    snapshot_date: snapshot.fecha,
    query: snapshot.busqueda.consulta,
    language: snapshot.busqueda.idioma,
    criteria: snapshot.busqueda.criterio,
    contract_version: snapshot.contract_version,
    generated_at: snapshot.generado_en || null,
    metadata: {
      source: "api/signals/save",
    },
    updated_at: new Date().toISOString(),
  };

  const rows = await supabaseRequest(
    "airadar_runs?on_conflict=snapshot_date,query,language,criteria,contract_version",
    {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([payload]),
    }
  );
  return rows[0];
}

async function existingSignalIds(runId) {
  const rows = await supabaseRequest(
    `airadar_signals?run_id=eq.${encodeURIComponent(runId)}&select=signal_id`
  );
  return new Set(rows.map((row) => row.signal_id));
}

async function upsertSignals(runId, signals) {
  const now = new Date().toISOString();
  const payload = signals.map((signal) => ({
    run_id: runId,
    signal_id: signal.id,
    title: signal.titulo,
    evidence: signal.evidencia,
    impact: signal.impacto,
    action: signal.accion,
    status: signal.estado,
    confidence: signal.confianza || null,
    tags: Array.isArray(signal.etiquetas) ? signal.etiquetas : [],
    updated_at: now,
  }));

  return supabaseRequest("airadar_signals?on_conflict=run_id,signal_id", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
}

async function upsertSources(signalRows, snapshotSignals) {
  const now = new Date().toISOString();
  const bySignalId = new Map(snapshotSignals.map((signal) => [signal.id, signal]));
  const payload = signalRows.map((row) => {
    const signal = bySignalId.get(row.signal_id);
    return {
      signal_row_id: row.id,
      name: signal.fuente.nombre,
      url: signal.fuente.url,
      publication_date: signal.fuente.fecha_publicacion || null,
      updated_at: now,
    };
  });

  return supabaseRequest("airadar_sources?on_conflict=signal_row_id,url", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
}

async function saveSnapshotAtomic(snapshot) {
  const result = await supabaseRequest("rpc/save_airadar_snapshot", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ snapshot }),
  });
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return send(res, 405, { error: "Metodo no permitido" });
  }

  const authorization = await authorizeWriteRequest(req.headers.authorization);
  if (!authorization) {
    return send(res, 401, { error: "No autorizado" });
  }

  const missingEnv = [];
  if (!process.env.SUPABASE_URL) {
    missingEnv.push("SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missingEnv.push("SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missingEnv.length > 0) {
    return send(res, 500, { error: "API no configurada", missing_env: missingEnv });
  }

  let snapshot;
  try {
    snapshot = await readBody(req);
  } catch {
    return send(res, 400, { error: "JSON invalido" });
  }

  const validationErrors = validateSnapshot(snapshot);
  if (validationErrors.length > 0) {
    return send(res, 400, { error: "Snapshot invalido", details: validationErrors });
  }

  try {
    const result = await saveSnapshotAtomic(snapshot);

    return send(res, 200, {
      runs: 1,
      run_id: result.run_id,
      senales_recibidas: snapshot.senales.length,
      senales_guardadas: result.inserted,
      senales_actualizadas: result.updated,
      fuentes_guardadas: result.sources,
      autenticacion: authorization.type,
      errores: [],
    });
  } catch (error) {
    logInternalError("No se pudo guardar el snapshot", error);
    return send(res, 500, { error: "No se pudo guardar el snapshot" });
  }
};
