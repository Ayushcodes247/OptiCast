import mongoose from "mongoose";
import { env } from "./env.config";
import { time } from "./essential.config";

export const connectToDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGOURI);
    console.info(`[${time()}] OPTICAST DATABASE CONNECTED SUCCESSFULLY.`);
  } catch (error: unknown) {
    console.error("ERROR WHILE CONNECTING TO OPTICAST DATABASE:", error);
    process.exit(1);
  }

  mongoose.connection.once("disconnected", (): void => {
    console.warn("DATABASE DISCONNECTED.");
  });

  mongoose.connection.once("error", (error: Error): void => {
    console.error("DATABASE CONNECTION ERROR:", error);
  });
};

["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal: string): void => {
  process.on(signal, async (): Promise<void> => {
    await mongoose.connection.close();
    console.info("DATABASE CONNECTION CLOSED DUE TO APPLICATION TERMINATION.");
    process.exit(0);
  });
});