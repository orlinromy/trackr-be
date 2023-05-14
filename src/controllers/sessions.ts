import pool from "../db/db";
import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { get } from "lodash";
import { validationResult, ValidationError } from "express-validator";
import * as dotenv from "dotenv";
dotenv.config();
// import { get } from "lodash";

class SessionsController {
  public async login(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const err: Record<string, ValidationError> =
        validationResult(req).mapped();
      console.log(err);
      if (Object.keys(err).length !== 0) {
        return res.status(400).json({ message: [err.name, err.password] });
      }

      const sql: string = "SELECT * FROM users WHERE email = $1::text;";
      const { rows: loginUser } = await client.query(sql, [req.body.email]);

      if (loginUser.length === 0) {
        return res.status(401).json({ message: ["user not found"] });
      }

      const result: boolean = await bcrypt.compare(
        req.body.password,
        loginUser[0].hash
      );

      if (!result) {
        return res.status(401).json({ message: ["authentication failed"] });
      }

      const sessionSql: string =
        "INSERT INTO sessions(user_id,valid,user_agent) values ($1::uuid, True, $2::text) RETURNING id, user_agent, valid";
      const { rows: session } = await client.query(sessionSql, [
        loginUser[0].id,
        req.get("user-agent"),
      ]);

      const payload = {
        userId: loginUser[0].id,
        email: loginUser[0].email,
        name: loginUser[0].name,
        user_interest: loginUser[0].user_interest,
        sessionId: session[0].id,
        sessionUserAgent: session[0].user_agent,
        sessionValid: session[0].valid,
      };

      const access = jwt.sign(payload, process.env.ACCESS_SECRET as string, {
        expiresIn: "3d",
        jwtid: uuidv4(),
      });

      const refresh = jwt.sign(payload, process.env.REFRESH_SECRET as string, {
        expiresIn: "30d",
        jwtid: uuidv4(),
      });

      res.status(200).json({ access, refresh });
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    } finally {
      client.release();
    }
  }

  public async logout(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const logoutSql: string =
        "UPDATE sessions SET valid = False WHERE id = $1::uuid RETURNING id";
      const { rows: updateSession } = await client.query(logoutSql, [
        get(req, "decoded.sessionId"),
      ]);

      console.log(updateSession[0]);

      return res.status(200).json({ message: ["successfully logged out"] });
    } catch (error) {
      console.log(error);
    } finally {
      client.release();
    }
  }
}

export default SessionsController;
