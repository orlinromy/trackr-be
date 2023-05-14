import express, { Router } from "express";
import SessionsController from "../controllers/sessions";
import auth from "../middleware/auth";
import { check } from "express-validator";

const router = Router();
const SessionController = new SessionsController();

router.post(
  "/login",
  [
    check("email", "Invalid email").isEmail().notEmpty(),
    check("password", "Invalid password").notEmpty(),
  ],
  SessionController.login
);
router.patch("/logout", auth, SessionController.logout);

export default router;
