import { get } from "lodash";
import { Request, Response, NextFunction, application } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { decode, reIssueAccessToken } from "../utils/utils";
import pool from "../db/db";
import * as dotenv from "dotenv";
dotenv.config();

const resetSession = async () => {
  console.log("reset sessions");

  const client = await pool.connect();
  const deleteAllSessions: string = "DELETE from sessions RETURNING id;";

  const { rows: session } = await client.query(deleteAllSessions);
  client.release();

  console.log("deleted sessions", session);
};

export default resetSession;
