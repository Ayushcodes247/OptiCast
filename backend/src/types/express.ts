import { Types } from "mongoose";
import type { Multer } from "multer";
import { IMediaCollection } from "@models/mediacollection.model";

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
      mediacollection: IMediaCollection;
    }
  }
}

export {};
