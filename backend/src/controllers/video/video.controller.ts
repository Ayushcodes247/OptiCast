import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";

export const uploadToBack = asyncHandler(async (req : Request, res : Response, next : NextFunction) : Promise<void> => {
    console.log("Upload header working.")
});