import Router from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
  avatarUpdate,
  forgotPasswordRequest,
  resetForgottenPassword,
  refreshAccessToken
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Unsecured route

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verift-email/:verificationToken").get(verifyEmail);
router.route("/forgot-password").post(forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(resetForgottenPassword);

// Secured routes
router.route("/logout").post(verifyJwt, logoutUser);

router.route("/avatar").put(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  verifyJwt,
  avatarUpdate
);

export default router;
