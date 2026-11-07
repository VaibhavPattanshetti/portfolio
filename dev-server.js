// dev-server.js: Instant zero-dependency local test server
// Runs your portfolio website AND tests your Netlify Function locally!
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./netlify/functions/chat.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Load .env into process.env
try {
  const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
  console.log("[DevServer] Loaded environment variables from .env");
} catch (e) {
  console.warn("[DevServer] Could not load .env:", e.message);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. Route to Netlify Chat Function
  if (pathname === "/api/chat" || pathname === "/.netlify/functions/chat") {
    try {
      let bodyData = "";
      if (req.method === "POST") {
        for await (const chunk of req) {
          bodyData += chunk;
        }
      }

      const webReq = new Request(`http://localhost:${PORT}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method === "POST" ? bodyData : undefined,
      });

      const webRes = await handler(webReq, {});

      res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));

      if (webRes.body) {
        const reader = webRes.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
      return;
    } catch (err) {
      console.error("[DevServer] Function error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // 2. Simulate Netlify Form Submission locally
  if (req.method === "POST" && (pathname === "/" || pathname === "/index.html")) {
    let bodyData = "";
    for await (const chunk of req) {
      bodyData += chunk;
    }
    const params = new URLSearchParams(bodyData);
    console.log(`\n[DevServer] 📩 Netlify Form Submission Received:`);
    console.log(`  Name:    ${params.get("fullname") || "N/A"}`);
    console.log(`  Email:   ${params.get("email") || "N/A"}`);
    console.log(`  Message: ${params.get("message") || "N/A"}\n`);

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Netlify Form submission received successfully!");
    return;
  }

  // 3. Serve Static Files
  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Portfolio Local Server is live!`);
  console.log(`  Open in your browser: http://localhost:${PORT}`);
  console.log(`  Chatbot API running at: http://localhost:${PORT}/api/chat`);
  console.log(`======================================================\n`);
});
