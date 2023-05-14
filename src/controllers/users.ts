import pool from "../db/db";
import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Result, ValidationError, validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
dotenv.config();
// import { get } from "lodash";

class UsersController {
  public async register(req: Request, res: Response) {
    try {
      const err: Record<string, ValidationError> =
        validationResult(req).mapped();
      console.log(err);
      if (Object.keys(err).length !== 0) {
        return res.status(400).json({
          message: [err.name?.msg, err.password?.msg, err.email?.msg],
        });
      }

      const client = await pool.connect();
      const searchSql = "SELECT * FROM users where email = $1::varchar(80)";

      const { rows: foundUsers } = await client.query(searchSql, [
        req.body.email,
      ]);
      console.log(foundUsers);
      if (foundUsers.length !== 0) {
        return res.status(400).json({ message: ["user exists"] });
      }

      const sql =
        "INSERT INTO users(email, hash, name) values ($1::varchar(80),$2::text, $3::varchar(80));";
      const hash: String = await bcrypt.hash(req.body.password, 12);
      const { rows } = await client.query(sql, [
        req.body.email,
        hash,
        req.body.name,
      ]);
      client.release();

      res.status(200).json({ message: ["user created"] });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: ["Something went wrong"] });
    }
  }

  // public async getUsers(req: Request, res: Response) {
  //   try {
  //     const client = await pool.connect();
  //     const sql = "SELECT * from users;";
  //     const { rows } = await client.query(sql);
  //     const users = rows;
  //     client.release();
  //     // @ts-ignore
  //     res.status(200).json({ users, decoded: req.decoded });
  //   } catch (error) {}
  // }
}

export default UsersController;
