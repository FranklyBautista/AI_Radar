import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_PORT = 4173;
const portIndex = process.argv.indexOf("--port");
const requestedPort = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : DEFAULT_PORT;
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : DEFAULT_PORT;

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
]);

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  response.end(message);
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = resolve(ROOT, relativePath);

    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${sep}`)) {
      sendText(response, 403, "Ruta no permitida");
      return;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendText(response, 404, "Archivo no encontrado");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": CONTENT_TYPES.get(extname(filePath)) ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    const statusCode = error?.code === "ENOENT" ? 404 : 500;
    sendText(response, statusCode, statusCode === 404 ? "Archivo no encontrado" : "Error interno");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`AI Radar disponible en http://127.0.0.1:${port}\n`);
});
