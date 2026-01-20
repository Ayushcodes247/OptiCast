import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDB } from "@configs/db.config";
import helmet from "helmet";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cors());
app.use(cookieParser());
app.use(helmet());
app.use(helmet.hsts({ maxAge : 31536000 , includeSubDomains : true }));

connectToDB();

export default app;