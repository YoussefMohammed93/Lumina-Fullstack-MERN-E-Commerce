/**
 * Vercel Serverless entry point.
 *
 * Wraps the existing Express `app` so Vercel can invoke it as a
 * serverless function.  The DB connection is established once and
 * reused across warm invocations.
 */

/// <reference path="../src/types/express.d.ts" />

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../src/config/db.js";
import { ensureStarterJournalStories } from "../src/lib/journal.js";
import app from "../src/app.js";

import type { IncomingMessage, ServerResponse } from "node:http";

let initialization: Promise<void> | undefined;

function init(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      await connectDB();
      await ensureStarterJournalStories();
    })().catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  }

  return initialization;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await init();
  return app(req, res);
}
