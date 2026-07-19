function send(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function logInternalError(message, error) {
  console.error(
    `[signals/latest] ${message}`,
    error instanceof Error ? error : new Error("Error no estandar"),
  );
}

function supabaseCredentials() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function supabaseRequest(resource, params) {
  const { url, key } = supabaseCredentials();
  const endpoint = new URL(`/rest/v1/${resource}`, url);
  for (const [name, value] of params) {
    endpoint.searchParams.append(name, value);
  }

  const headers = {
    accept: "application/json",
    apikey: key,
  };
  if (!key.startsWith("sb_secret_")) {
    headers.authorization = `Bearer ${key}`;
  }

  const response = await fetch(endpoint, { headers });
  const body = await response.text();
  let data = null;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    throw new Error(`Supabase ${response.status}: respuesta no JSON`);
  }
  if (!response.ok) {
    const message = data?.message || response.statusText;
    throw new Error(`Supabase ${response.status}: ${message}`);
  }
  return data;
}

function toSnapshot(run, signalRows) {
  return {
    contract_version: run.contract_version,
    fecha: run.snapshot_date,
    ...(run.generated_at ? { generado_en: run.generated_at } : {}),
    busqueda: {
      consulta: run.query,
      idioma: run.language,
      criterio: run.criteria,
    },
    senales: signalRows.map((row) => {
      const [source] = row.airadar_sources || [];
      if (!source) {
        throw new Error(`La señal ${row.signal_id} no tiene una fuente asociada`);
      }

      return {
        id: row.signal_id,
        titulo: row.title,
        fuente: {
          nombre: source.name,
          url: source.url,
          ...(source.publication_date
            ? { fecha_publicacion: source.publication_date }
            : {}),
        },
        evidencia: row.evidence,
        impacto: row.impact,
        accion: row.action,
        estado: row.status,
        etiquetas: row.tags || [],
        ...(row.confidence ? { confianza: row.confidence } : {}),
      };
    }),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return send(res, 405, { error: "Metodo no permitido" });
  }

  const { url, key } = supabaseCredentials();
  const missingEnv = [];
  if (!url) missingEnv.push("SUPABASE_URL");
  if (!key) missingEnv.push("SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY");
  if (missingEnv.length > 0) {
    return send(res, 500, { error: "API no configurada", missing_env: missingEnv });
  }

  try {
    const runs = await supabaseRequest("airadar_runs", [
      [
        "select",
        "id,snapshot_date,query,language,criteria,contract_version,generated_at",
      ],
      ["order", "snapshot_date.desc,updated_at.desc"],
      ["limit", "1"],
    ]);
    const [run] = runs;
    if (!run) {
      return send(res, 404, { error: "Todavia no hay runs de AI Radar" });
    }

    const signals = await supabaseRequest("airadar_signals", [
      ["run_id", `eq.${run.id}`],
      [
        "select",
        "id,signal_id,title,evidence,impact,action,status,confidence,tags,airadar_sources(name,url,publication_date)",
      ],
      ["order", "created_at.asc"],
    ]);
    if (signals.length === 0) {
      return send(res, 404, { error: "El run mas reciente todavia no tiene senales" });
    }

    return send(res, 200, toSnapshot(run, signals));
  } catch (error) {
    logInternalError("No se pudo cargar el radar", error);
    return send(res, 500, { error: "No se pudo cargar el radar" });
  }
}
