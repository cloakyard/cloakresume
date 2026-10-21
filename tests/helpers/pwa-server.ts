/** Production assets with controllable, real service-worker versions for lifecycle tests. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

export async function startPwaServer() {
  const root = resolve("dist");
  const state = { version: 1, hold: false, failInstall: false, production: false, swRequests: 0 };
  const server = createServer(async (request, response) => {
    const path = new URL(request.url || "/", "http://localhost").pathname;
    response.setHeader("Cache-Control", "no-store");
    if (path === "/sw.js") {
      state.swRequests++;
      response.setHeader("Content-Type", "text/javascript");
      if (!state.production) {
        response.end(`// Lifecycle fixture version ${state.version}
let finish; const gate = new Promise(resolve => { finish = resolve; });
self.addEventListener('install', event => { ${state.failInstall ? "event.waitUntil(Promise.reject(new Error('Fixture install failed')));" : ""} });
self.addEventListener('activate', event => event.waitUntil(${state.hold ? "gate.then(() => self.clients.claim())" : "self.clients.claim()"}));
self.addEventListener('message', event => {
 if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
 if (event.data?.type === 'FINISH') finish();
});`);
        return;
      }
    }
    try {
      const file = resolve(root, `.${decodeURIComponent(path === "/" ? "/index.html" : path)}`);
      if (!file.startsWith(root + sep)) throw new Error("Outside fixture root");
      const body = await readFile(file);
      response.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".json": "application/json",
            ".webmanifest": "application/manifest+json",
            ".wasm": "application/wasm",
            ".woff2": "font/woff2",
          } as Record<string, string>
        )[extname(file)] || "application/octet-stream",
      );
      response.end(body);
    } catch {
      response.statusCode = 404;
      response.setHeader("Content-Type", "text/html");
      response.end(await readFile(resolve(root, "404.html")));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  return {
    state,
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
