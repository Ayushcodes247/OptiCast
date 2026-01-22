import { Response , NextFunction } from "express";
import jwt , { JwtPayload } from "jsonwebtoken";
import { AuthenticationRequest } from "../types/auth.types";
import { BlackTokenModel } from "@models/balckToken.model";
import { env } from "@configs/env.config";
import { UserModel } from "@models/user.model";
import { AppError, asyncHandler } from "@utils/essentials.util";

interface AuthPayload extends JwtPayload{
    _id : string;
}

const TOKEN_NAME = "opticast_auth_token";

const isAuthenticated = asyncHandler(async (req : AuthenticationRequest, res : Response, next : NextFunction) : Promise<void> => {

});