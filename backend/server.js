const app = require("./app");
const http = require("http");
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production") {
  server.listen(PORT, () => {
    console.info(
      `[${new Date().toISOString()}] OptiCast Server is running on port no.:${PORT}`
    );
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    `[${new Date().toISOString()}] Unhandled rejection at:${promise}`,
    `reason:${reason}`
  );
});

process.on("uncaughtException", (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  process.exit(1);
});

const grasefulShutdown = (signal) => {
  console.info(
    `[${new Date().toISOString()}] Received ${signal}. Closing server gracefully...`
  );

  server.close(() => {
    console.info(
      `[${new Date().toISOString()}] Server closed. Exiting process.`
    );
  });

  setTimeout(() => {
    console.error(
      `[${new Date().toISOString()}] Forcefully exiting process due to timeout.`
    );
    process.exit(1);
  }, 30_000).unref();
};

process.on("SIGTERM", () => grasefulShutdown("SIGTERM"));
process.on("SIGINT", () => grasefulShutdown("SIGINT"));
