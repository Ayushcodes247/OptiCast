import { Types } from "mongoose";
import type { Multer } from "multer";

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;
      email?: string;
      username?: string;
    }

    interface Request {
      user?: User;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}

export {};
