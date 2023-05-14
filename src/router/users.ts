import express, { Router } from "express";
import UsersController from "../controllers/users";
import auth from "../middleware/auth";
import { check } from "express-validator";

const router = Router();
const UserController = new UsersController();

router.put(
  "/register",
  [
    check("name", "Name cannot be empty").notEmpty(),
    check("email", "Invalid email").isEmail().notEmpty(),
    check("password", "Invalid password")
      .custom((value, { req }) => req.body.password.length >= 12)
      .isAlphanumeric()
      .notEmpty(),
  ],
  UserController.register
);
// router.post("/getUsers", auth, UserController.getUsers);

export default router;
