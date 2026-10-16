const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(process.env.WILDBOUND_SERVE_ROOT || path.join(__dirname, ".."));
const port = Number(process.env.WILDBOUND_SERVE_PORT || 4173);
http
  .createServer((req, res) => {
    const file = path.resolve(
      root,
      "." +
        decodeURIComponent(
          req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0],
        ),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (e, data) => {
      if (e) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".mjs": "text/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".png": "image/png",
        }[path.extname(file)] || "application/octet-stream",
      );
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Wildbound preview: http://127.0.0.1:${port}`),
  );
