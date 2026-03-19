import { join } from "path";

const port = 5173;
const dist = join(import.meta.dir, "dist");
const index_html = Bun.file(join(import.meta.dir, "index.html"));

Bun.serve({
  port: port,
  fetch: async (req) => {
    const url = new URL(req.url);
    const file = Bun.file(join(dist, url.pathname));
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response(index_html, {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Dev server running at http://localhost:${port}`);
