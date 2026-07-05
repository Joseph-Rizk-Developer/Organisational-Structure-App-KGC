import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
};

const server = http.createServer(async (request, response) => {
  const url = request.url === "/" ? "/index.html" : request.url || "/index.html";
  const filePath = path.join(root, decodeURIComponent(url.split("?")[0]));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Organisation Structure App: http://127.0.0.1:${port}/`);
});
