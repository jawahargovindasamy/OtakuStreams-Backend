import express from "express";
import { getRandomAnime } from "../controllers/randomController.js";

const router = express.Router();

router.get("/", getRandomAnime);

export default router;
