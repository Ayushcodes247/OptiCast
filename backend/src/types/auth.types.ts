import { Request } from "express";
import { User } from "@models/user.model";

export interface AuthenticationRequest extends Request {
  user?: User;
}
