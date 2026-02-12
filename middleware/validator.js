import { body, validationResult } from "express-validator";
import { STATUS_CODES } from "../constants/statusCodes.js";

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(STATUS_CODES.UNPROCESSABLE).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  };
};

export const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

export const resetPasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

export const watchlistValidation = [
  body("animeId").notEmpty().withMessage("Anime ID is required"),
  body("animeTitle").notEmpty().withMessage("Anime title is required"),
  body("status")
    .optional()
    .isIn(["plan_to_watch", "watching", "on_hold", "completed", "dropped"])
    .withMessage("Invalid status"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Rating must be between 1 and 10"),
  body("episodesWatched")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Episodes watched must be a positive number"),
];

export const continueWatchingValidation = [
  body("animeId").notEmpty().withMessage("Anime ID is required"),
  body("animeTitle").notEmpty().withMessage("Anime title is required"),
  body("currentEpisode")
    .isInt({ min: 1 })
    .withMessage("Current episode must be at least 1"),
  body("currentTime")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Current time must be a positive number"),
  body("duration")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Duration must be a positive number"),
];
