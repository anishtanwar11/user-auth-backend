import Router from "express";
import { createNotebook, getNotebooks } from "../controllers/notebook.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create").post(verifyJwt, createNotebook);

router.route("/all").get(verifyJwt, getNotebooks);

export default router;