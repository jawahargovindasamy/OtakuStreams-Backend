import express from "express";
import { submitContactForm } from "../controllers/contactController.js";
import { validate, contactValidation } from "../middleware/validator.js";

const router = express.Router();

router.post("/", validate(contactValidation), submitContactForm);

export default router;
