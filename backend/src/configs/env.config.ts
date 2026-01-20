import dotenv from "dotenv";
dotenv.config();

export const env = {
    PORT : process.env.PORT || 3000,
    MONGOURI : process.env.MONGOURI || "mongodb://localhost:27017/db",
    NODE_ENV : process.env.NODE_ENV || "development"
};