import pool from "../db/db";
import { Request, Response } from "express";
// import * as bcrypt from "bcrypt";
// import * as jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from "uuid";
import { isAuthJob, isAuthInterview } from "../utils/utils";
import { get } from "lodash";
import * as dotenv from "dotenv";
import { Client, PoolClient } from "pg";
import format from "pg-format";
dotenv.config();

class InterviewsController {
  public async addInterview(req: Request, res: Response) {
    // id
    // stage
    // type
    // date
    // has_assignment
    // assignment_details
    // interview_note
    // job_id
    const client: PoolClient = await pool.connect();
    try {
      console.log(req.body);
      const isUsersJob = await isAuthJob(
        get(req, "decoded.userId"),
        req.body.job_id
      );
      if (!isUsersJob)
        return res.status(401).json({ message: "addInterview not authorized" });

      const jobInterviewSql: string =
        "SELECT max(stage) as last_stage from interviews WHERE job_id = $1 GROUP BY job_id;";

      const { rows: maxInterviewStage } = await client.query(jobInterviewSql, [
        req.body.job_id,
      ]);

      let currInterviewStage: number =
        parseInt(maxInterviewStage[0]?.last_stage) || 0;

      const inputInterviews = req.body.interviews
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .map((interview: any) => {
          currInterviewStage = currInterviewStage + 1;
          return [
            currInterviewStage,
            interview.type,
            interview.date,
            interview.has_assignment || false,
            interview.assignment_details || null,
            interview.interview_note || null,
            req.body.job_id,
            interview.interviewer_name || null,
            interview.interviewer_title || null,
            interview.interviewer_email || null,
          ];
        });

      console.log(inputInterviews);

      const newInterviewSql: string =
        // "INSERT INTO interviews(stage, type, date, has_assignment, assignment_details, interview_note, job_id, interviewer_name, interviewer_title, interviewer_email) VALUES ($1, $2, DATE($3), $4, $5, $6, $7, $8, $9, $10) RETURNING *;";
        "INSERT INTO interviews(stage, type, date, has_assignment, assignment_details, interview_note, job_id, interviewer_name, interviewer_title, interviewer_email) VALUES %L RETURNING *;";

      const { rows: newInterviews } = await client.query(
        format(newInterviewSql, inputInterviews),
        []
      );
      // const { rows: newInterview } = await client.query(newInterviewSql, [
      //   req.body.stage || currInterviewStage,
      //   req.body.type,
      //   req.body.date || new Date(),
      //   req.body.has_assignment || false,
      //   req.body.assignment_details || null,
      //   req.body.interview_note || null,
      //   req.body.job_id,
      //   req.body.interviewer_name || null,
      //   req.body.interviewer_title || null,
      //   req.body.interviewer_email || null,
      // ]);

      const access = res.getHeader("x-access-token");
      res.status(200).json({ newInterviews, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  public async editInterview(req: Request, res: Response) {
    const client: PoolClient = await pool.connect();
    try {
      const isUsersInterview = await isAuthInterview(
        get(req, "decoded.userId"),
        req.body.job_id,
        req.body.interview_id
      );
      if (!isUsersInterview)
        return res
          .status(401)
          .json({ message: "editInterview not authorized" });

      const editInterviewSql: string =
        "UPDATE interviews SET stage = $1, type = $2, date = $3, has_assignment = $4, assignment_details = $5, interview_note = $6, interviewer_name = $7, interviewer_title = $8, interviewer_email = $9 WHERE id = $10 RETURNING *;";

      const { rows: interview } = await client.query(editInterviewSql, [
        req.body.stage,
        req.body.type,
        req.body.date,
        req.body.has_assignment,
        req.body.assignment_details,
        req.body.interview_note,
        req.body.interviewer_name,
        req.body.interviewer_title,
        req.body.interviewer_email,
        req.body.interview_id,
      ]);

      const access = res.getHeader("x-access-token");
      res.status(200).json({ interview, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  public async deleteInterview(req: Request, res: Response) {
    const client: PoolClient = await pool.connect();
    try {
      // deleting the interview shouldn't affect anything
      const isUsersInterview = await isAuthInterview(
        get(req, "decoded.userId"),
        req.body.job_id,
        req.body.interview_id
      );
      if (!isUsersInterview)
        return res
          .status(401)
          .json({ message: "deleteInterview not authorized" });

      const deleteInterviewSql: string =
        "DELETE from interviews WHERE id = $1 RETURNING *;";

      const { rows: deletedInterview } = await client.query(
        deleteInterviewSql,
        [req.body.interview_id]
      );

      const access = res.getHeader("x-access-token");
      res.status(200).json({ deletedInterview, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  // input: req.decoded.user_id
  public async getInterviews(req: Request, res: Response) {
    const client: PoolClient = await pool.connect();
    console.log("get interview");
    try {
      // const isUsersJob = await isAuthJob(
      //   get(req, "decoded.userId"),
      //   req.body.job_id
      // );
      // if (!isUsersJob)
      //   return res.status(401).json({ message: "getInterview not authorized" });

      const getInterviewsSql: string =
        "SELECT interviews.* FROM applications LEFT JOIN interviews ON applications.id = interviews.job_id WHERE applications.user_id = $1::uuid ORDER BY interviews.date;";
      const { rows: interviews } = await client.query(
        getInterviewsSql,
        //@ts-ignore
        [req.decoded.userId]
      );

      const access = res.getHeader("x-access-token");
      res.status(200).json({ interviews, access });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  // input: job_id, req.decoded.userId
  public async getOneJobInterview(req: Request, res: Response) {
    const client: PoolClient = await pool.connect();
    console.log("get interview");
    try {
      const isUsersJob = await isAuthJob(
        get(req, "decoded.userId"),
        req.body.job_id
      );
      if (!isUsersJob)
        return res
          .status(401)
          .json({ message: "getOneJobInterview not authorized" });

      const getOneJobInterviewsSql: string =
        "SELECT interviews.* FROM interviews WHERE job_id = $1::uuid ORDER BY interviews.date;";
      const { rows: interview } = await client.query(
        getOneJobInterviewsSql,
        //@ts-ignore
        [req.body.job_id]
      );

      const access = res.getHeader("x-access-token");
      res.status(200).json({ interview, access });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }
}

export default InterviewsController;
