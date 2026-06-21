import "./lib/env.js";
import { createServer } from "http";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initWsServer } from "./lib/wsServer.js";
import { db, locationsTable } from "./db/index.js";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
initWsServer(server);

const DEFAULT_LOCATIONS = [
  "Mohammadpur",
  "Dhanmondi",
  "Khamarbari",
  "BRAC",
  "NSU",
  "AUST",
  "DRMC",
];

async function seedLocations() {
  try {
    const existing = await db.select().from(locationsTable);
    const hasMohammadpur = existing.some(l => l.name === "Mohammadpur");
    if (existing.length === 0 || !hasMohammadpur) {
      logger.info("Database locations empty or old. Seeding default hangout spots...");
      // Safely delete existing to avoid duplicate conflicts and clean up legacy data
      await db.delete(locationsTable);
      await db.insert(locationsTable).values(
        DEFAULT_LOCATIONS.map((name) => ({ name }))
      );
      logger.info("Hangout locations seeded successfully!");
    } else {
      logger.info(`Database already contains correct locations.`);
    }
  } catch (err) {
    logger.error({ err }, "Failed to auto-seed locations database");
  }
}

async function startServer() {
  await seedLocations();

  server.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

startServer();
