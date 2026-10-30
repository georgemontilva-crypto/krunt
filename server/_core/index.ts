import "dotenv/config";
import compression from "compression";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runMigrations } from "../migrate";
import { listCatalog, seedCatalog } from "../db";

async function startServer() {
  // Schema first, then the catalogue: a fresh Railway MySQL provisions itself
  // on the first deploy with no manual step.
  await runMigrations();
  await seedCatalog();

  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.use(compression());
  app.disable("x-powered-by");

  // Railway's healthcheck only needs a 200; the body says whether the
  // database answers and how many products it holds, for troubleshooting.
  app.get("/api/health", async (_req, res) => {
    let db: string;
    let products = 0;
    try {
      const rows = await listCatalog();
      products = rows.length;
      db = "ok";
    } catch (err) {
      const e = err as Error & { cause?: { message?: string; code?: string } };
      const why = e.cause?.code || e.cause?.message || e.message;
      db = process.env.DATABASE_URL ? `error: ${String(why).slice(0, 200)}` : "DATABASE_URL is not set";
    }
    res.json({ ok: true, db, products });
  });

  app.use(express.json({ limit: "1mb" }));
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
