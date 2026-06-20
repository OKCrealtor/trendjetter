// Vercel serverless API handler
import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { registerRoutes } from "../server/routes";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initialized = false;
const initPromise = registerRoutes(httpServer, app).then(() => {
  initialized = true;
});

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await initPromise;
  }
  app(req, res);
}
