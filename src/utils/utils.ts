import jwt from "jsonwebtoken";
import { get, omit } from "lodash";
import pool from "../db/db";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

async function isSessionValid(sessionId: string | undefined) {
  console.log("connecting to client");
  const client = await pool.connect();
  try {
    const getSessionSql: string = "SELECT * from sessions where id = $1::uuid";
    console.log("querying");
    const { rows: session } = await client.query(getSessionSql, [sessionId]);

    // client.release();
    console.log("release client");
    return session.length === 0 || !session[0].valid;
  } catch (error) {
    console.log(error);
    return true;
  } finally {
    console.log("releasing client");
    client.release();
  }
  // const getSessionSql: string = "SELECT * from sessions where id = $1::uuid";
  // console.log("querying");
  // const { rows: session } = await client.query(getSessionSql, [sessionId]);
  // console.log("releasing client");
  // client.release();
  // console.log("release client");
  // return session.length === 0 || !session[0].valid;
}

async function decode(token: string, type: string) {
  try {
    console.log("decode");
    const decoded = jwt.verify(
      token,
      type === "refresh"
        ? (process.env.REFRESH_SECRET as string)
        : (process.env.ACCESS_SECRET as string)
    );
    console.log(decoded);
    const isNotValid = await isSessionValid(get(decoded, "sessionId"));
    console.log("isNotValid", isNotValid);
    return isNotValid
      ? { valid: false, expired: true, decoded: null }
      : { valid: true, expired: false, decoded };
  } catch (e) {
    console.log("error", e);
    return {
      valid: false,
      expired: get(e, "message") === "jwt expired",
      decoded: null,
    };
  }
}

async function reIssueAccessToken({ refreshToken }: { refreshToken: string }) {
  // Decode the refresh token
  console.log("before decoded");
  const { decoded } = await decode(refreshToken, "refresh");
  console.log("decoded", decoded);

  if (!decoded || !get(decoded, "sessionId")) return false;

  const isNotValid = await isSessionValid(get(decoded, "sessionId"));

  if (isNotValid) return false;

  const client = await pool.connect();
  const getUserSql: string = "SELECT * from users where id = $1::uuid";
  const { rows: user } = await client.query(getUserSql, [
    get(decoded, "userId"),
  ]);

  if (user.length === 0) return false;

  const accessToken = jwt.sign(
    omit(decoded as object, ["jti", "exp", "iat"]),
    process.env.ACCESS_SECRET as string,
    { expiresIn: "3d", jwtid: uuidv4() } // 15 minutes
  );
  client.release();
  return accessToken;
}

async function isAuthJob(userId: string, jobId: string) {
  console.log("userId: ", userId);
  console.log("jobId: ", jobId);
  const client = await pool.connect();
  const checkJobSql: string =
    "SELECT * FROM applications WHERE user_id = $1 and id = $2;";
  const { rows: checkJob } = await client.query(checkJobSql, [userId, jobId]);

  console.log(checkJob);
  client.release();
  return checkJob.length !== 0;
}

async function isAuthInterview(
  userId: string,
  jobId: string,
  interviewId: string
) {
  console.log("userId: ", userId);
  console.log("jobId: ", jobId);
  console.log("interviewId: ", interviewId);
  const client = await pool.connect();
  const checkJobSql: string =
    "SELECT * FROM applications LEFT JOIN interviews ON applications.id = interviews.job_id WHERE user_id = $1 and interviews.job_id = $2 and interviews.id = $3;";
  const { rows: checkJob } = await client.query(checkJobSql, [
    userId,
    jobId,
    interviewId,
  ]);
  console.log(checkJob);
  client.release();
  return checkJob.length !== 0;
}

export { decode, reIssueAccessToken, isAuthJob, isAuthInterview };
