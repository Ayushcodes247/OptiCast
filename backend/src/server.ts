import app from "./app";
import { createServer } from "http";
import { env } from "@configs/env.config";

const PORT = env.PORT;
const server = createServer(app);

if(env.NODE_ENV === "production"){
    server.listen(PORT, () : void => {
        console.info(`Opticast server is running on PORT NO.:${PORT}`);
    });
}