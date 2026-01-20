import app from "./app";
import { createServer } from "http";
import { env } from "@configs/env.config";
import { time } from "@configs/essential.config";

const PORT = env.PORT;
const server = createServer(app);

server.listen(PORT, (): void => {
  console.info(`[${time()}] OPTICAST SERVER IS RUNNING ON PORT NO.:${PORT}`);
});

process.once("unhandledRejection", (reason: unknown): void => {
  console.error(`[${time()}] UNHANDLED REJECTION:`, reason);
});

process.once("uncaughtException", (error: Error): void => {
  console.error(`[${time()}] UNCAUGHT EXCEPTION:`, error);
});

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
