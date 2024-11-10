import Router from "express";
// Notebook Controllers
import { createNotebook, getNotebooks } from "../controllers/notebook.controller.js";
// Section Controllers
import { createSection, getSection } from "../controllers/section.controller.js";
// Pages Controllers
import { getPages, createPage, updatePageContent, deletePage } from "../controllers/page.controller.js";

import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

// Route for Notebooks
router.route("/create").post(verifyJwt, createNotebook);

router.route("/all").get(verifyJwt, getNotebooks);

// Route for Sections
router.route("/:notebookId/section/create").post(verifyJwt, createSection);

router.route("/:notebookId/section").get(verifyJwt, getSection);

// Route for Pages
router.route("/section/:sectionId/pages").get(verifyJwt, getPages);

router.route("/section/:sectionId/pages/create").post(createPage);

router.route("/section/page/:pageID").put(updatePageContent);

router.route("/section/page/:pageID/delete").delete(deletePage)

export default router;