import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

    console.log("req.cookies?.accessToken",req.cookies?.accessToken)
  if (req.cookies.accessToken) {
    console.log("Access Token present:", req.cookies.accessToken);
  } else {
    console.log("Access Token missing.");
  }
  if (!token) {
    throw new ApiError(400, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token!");
  }
});
