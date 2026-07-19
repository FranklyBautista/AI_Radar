import assert from "node:assert/strict";
import test from "node:test";

import latestHandler from "../api/signals/latest.js";

function responseRecorder() {
  return {
    headers: new Map(),
    statusCode: null,
    body: null,
    setHeader(name, value) {
      this.headers.set(name.toLowerCase(), value);
    },
    end(body) {
      this.body = JSON.parse(body);
    },
  };
}

async function withEnvironment(values, callback) {
  const previous = new Map();
  for (const [name, value] of Object.entries(values)) {
    previous.set(name, process.env[name]);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return await callback();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("GET latest reconstruye el snapshot más reciente sin exponer la clave", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/airadar_runs?")) {
      return new Response(
        JSON.stringify([
          {
            id: "run-2026-07-18",
            snapshot_date: "2026-07-18",
            query: "Busca las ultimas noticias de IA en paralelo",
            language: "es",
            criteria: "Fuentes activas de Notion",
            contract_version: "1.0.0",
            generated_at: "2026-07-18T21:28:27-04:00",
          },
        ]),
        { status: 200 },
      );
    }
    return new Response(
      JSON.stringify([
        {
          id: "signal-row-1",
          signal_id: "mistral-studio-activos-versionados",
          title: "Mistral Studio convierte prompts y skills en activos versionados",
          evidence: "Anuncio oficial verificado.",
          impact: "Mejora el ciclo de entrega.",
          action: "Evaluar el flujo.",
          status: "nueva",
          confidence: "alta",
          tags: ["agentes"],
          airadar_sources: [
            {
              name: "Mistral AI News",
              url: "https://mistral.ai/news/mistral-studio",
              publication_date: "2026-07-16",
            },
          ],
        },
      ]),
      { status: 200 },
    );
  };

  try {
    await withEnvironment(
      {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SECRET_KEY: "sb_secret_test_only",
        SUPABASE_SERVICE_ROLE_KEY: undefined,
      },
      async () => {
        const res = responseRecorder();
        await latestHandler({ method: "GET" }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.headers.get("cache-control"), "no-store");
        assert.equal(res.body.fecha, "2026-07-18");
        assert.equal(res.body.senales[0].fuente.nombre, "Mistral AI News");
        assert.equal(calls.length, 2);
        assert.match(calls[0].url, /order=snapshot_date\.desc%2Cupdated_at\.desc/);
        assert.match(calls[1].url, /run_id=eq\.run-2026-07-18/);
        assert.equal(calls[0].options.headers.apikey, "sb_secret_test_only");
        assert.equal(calls[0].options.headers.authorization, undefined);
        assert.doesNotMatch(JSON.stringify(res.body), /sb_secret_test_only/);
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GET latest responde vacío de forma explícita cuando no hay runs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("[]", { status: 200 });
  try {
    await withEnvironment(
      {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SECRET_KEY: "sb_secret_test_only",
      },
      async () => {
        const res = responseRecorder();
        await latestHandler({ method: "GET" }, res);
        assert.equal(res.statusCode, 404);
        assert.match(res.body.error, /no hay runs/i);
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GET latest falla cerrado cuando el servidor no tiene credenciales", async () => {
  await withEnvironment(
    {
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    async () => {
      const res = responseRecorder();
      await latestHandler({ method: "GET" }, res);
      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body.missing_env, [
        "SUPABASE_URL",
        "SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY",
      ]);
    },
  );
});
