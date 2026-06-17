import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initWsServer } from "./lib/wsServer";
import { db, locationsTable } from "@workspace/db";

const rawPort = process.env["PORT"] ?? "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
initWsServer(server);

const DEFAULT_LOCATIONS = [
  "Rafir Chaad",
  "Ratul er Basha",
  "Saif er Chaad",
  "Mushfiq er Chaad",
  "Rejar Chaad",
  "300 Feet",
];

async function seedLocations() {
  try {
    const existing = await db.select().from(locationsTable);
    if (existing.length === 0) {
      logger.info("Database locations empty. Auto-seeding 6 default hangout spots...");
      await db.insert(locationsTable).values(
        DEFAULT_LOCATIONS.map((name) => ({ name }))
      );
      logger.info("Hangout locations seeded successfully!");
    } else {
      logger.info(`Database already contains ${existing.length} locations. Skipping seed.`);
    }
  } catch (err) {
    logger.error({ err }, "Failed to auto-seed locations database");
  }
}

async function startServer() {
  await seedLocations();

  server.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

startServer();
