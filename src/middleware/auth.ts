// const jwt = require("jsonwebtoken");
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();
import { get } from "lodash";

const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    //@ts-ignore
    const user = req.decoded;
    console.log("user: ", user);
    if (!user) {
      return res.status(403).json({ message: "log in required" });
    }

    return next();
  } catch (error) {
    return res.status(400).json({ status: 400, message: error });
  }
};

export default auth;
