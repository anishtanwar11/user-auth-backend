import Router from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
  avatarUpdate,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/verift-email/:verificationToken").get(verifyEmail);

router.route("/login").post(loginUser);

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
