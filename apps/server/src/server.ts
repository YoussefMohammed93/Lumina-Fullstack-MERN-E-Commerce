import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import { ensureStarterJournalStories } from "./lib/journal.js";
import app from "./app.js";

import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();
    await ensureStarterJournalStories();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
