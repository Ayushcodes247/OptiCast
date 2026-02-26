/**
 * ---------------------------------------------------------
 * SERVER ENTRY POINT
 * ---------------------------------------------------------
 * - Initializes DB connection
 * - Starts HTTP server
 * - Handles process-level errors
 * - Implements graceful shutdown
 * ---------------------------------------------------------
 */

import "./types/index";
import app from "./app";
import { createServer } from "http";
import { env } from "@configs/env.config";
import { time } from "@configs/essential.config";
import { connectToDB } from "@configs/db.config";

const PORT = env.PORT;
const server = createServer(app);

/**
 * Bootstrap Application
 * Connect to DB first, then start server.
 */
(async (): Promise<void> => {
  try {
    await connectToDB();

    server.listen(PORT, (): void => {
      console.info(
        `[${time()}] OPTICAST SERVER IS RUNNING ON PORT NO.:${PORT}`,
      );
    });
  } catch (error: unknown) {
    console.error("FAILED TO START SERVER:", error);
    process.exit(1);
  }
})();

/**
 * Handle unhandled promise rejections
 */
process.once("unhandledRejection", (reason: unknown): void => {
  console.error(`[${time()}] UNHANDLED REJECTION:`, reason);
});

/**
 * Handle uncaught exceptions
 */
process.once("uncaughtException", (error: Error): void => {
  console.error(`[${time()}] UNCAUGHT EXCEPTION:`, error);
  process.exit(1);
});

/**
 * Graceful shutdown handler
 * - Stops accepting new connections
 * - Allows ongoing requests to complete
 * - Forces shutdown after 30 seconds
 */
const gracefulShutdown = (signal: string): void => {
  console.info(`[${time()}] RECEIVED ${signal}. SHUTTING DOWN SERVER...`);

  server.close((): void => {
    console.info(`[${time()}] OPTICAST SERVER CLOSED.`);
    process.exit(0);
  });

  setTimeout((): void => {
    console.error(
      `[${time()}] COULD NOT CLOSE OPTICAST SERVER IN TIME. FORCE EXITING.`,
    );
    process.exit(1);
  }, 30_000);
};

["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal: string): void => {
  process.once(signal, gracefulShutdown);
});
