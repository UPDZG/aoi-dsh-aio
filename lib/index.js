// AOI 工作台插件 —— Host half
//
// 保持极小：只提供一个归档清单的只读接口。
// 皮肤、壁纸、工作台 UI 全在浏览器半侧，不经过 Host，避免拖慢主进程。
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export const name = "dsh-aio";
export const inject = ["webServer"];

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), ".dsh");
}

export function apply(ctx) {
  // 诊断端点：client 把真实 DOM 结构写进来
  ctx.webServer.register({
    kind: "exact",
    path: "/aoi/diag",
    handler: async (req, res) => {
      if (req.method === "POST") {
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = Buffer.concat(chunks).toString("utf8");
          await writeFile(join(dshHome(), "aoi-diag.json"), body, "utf8");
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(e) }));
        }
        return;
      }
      try {
        const text = await readFile(join(dshHome(), "aoi-diag.json"), "utf8");
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        res.end(text);
      } catch (e) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, reason: "no-diag-yet" }));
      }
    }
  });

  ctx.webServer.register({
    kind: "exact",
    path: "/aoi/archived",
    handler: async (req, res) => {
      if (req.method !== "GET") {
        res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
        res.end("method not allowed");
        return;
      }
      try {
        const text = await readFile(join(dshHome(), "aoi-archived.json"), "utf8");
        res.writeHead(200, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        });
        res.end(text);
      } catch (e) {
        const missing = e && (e.code === "ENOENT" || e.code === "ENOTDIR");
        res.writeHead(missing ? 404 : 500, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        });
        res.end(JSON.stringify({
          ok: false,
          reason: missing ? "no-manifest" : "read-failed",
          hint: missing
            ? "运行：node tools/aoi-archive-cleaner.mjs --export"
            : String((e && e.message) || e)
        }));
      }
    }
  });
}
