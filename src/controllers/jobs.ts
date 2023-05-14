import pool from "../db/db";
import { Request, Response } from "express";
// import * as bcrypt from "bcrypt";
// import * as jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from "uuid";
import { isAuthJob } from "../utils/utils";
import { get } from "lodash";
import * as dotenv from "dotenv";
import { PoolClient } from "pg";
dotenv.config();

class JobsController {
  public async createNewJob(req: Request, res: Response) {
    // input from req.body
    // title
    // company
    // location
    // jd_link
    // jd_file
    // latest_status
    // application_note
    // application_date
    // hr_email
    // user_id
    const client: PoolClient = await pool.connect();
    try {
      if (req.body.application_date === "") {
        req.body.application_date = null;
      }
      const newJobSql: string =
        "INSERT INTO applications(title, company, location, jd_link, jd_file, latest_status, application_note, application_date, hr_email, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, DATE($8), $9, $10) RETURNING *;";

      const { rows: newJob } = await client.query(newJobSql, [
        req.body.title,
        req.body.company,
        req.body.location || "Singapore",
        req.body.jd_link || null,
        req.body.jd_file || null,
        req.body.latest_status || "APPLIED",
        req.body.application_note || "",
        req.body.application_date,
        req.body.hr_email || null,
        //@ts-ignore
        req.decoded.userId,
      ]);
      // client.release();
      const access = res.getHeader("x-access-token");
      res.status(200).json({ newJob, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  // might need to change to get job only then get the interviews separately
  // provide refresh token always
  public async getAllJobs(req: Request, res: Response) {
    console.log("get jobs");
    const client = await pool.connect();
    try {
      const getAllJobsSql: string =
        "SELECT * from applications where applications.user_id = $1::uuid";
      // "SELECT applications.*, interviews.* FROM applications LEFT JOIN interviews ON applications.id = interviews.job_id WHERE applications.user_id = $1::uuid ORDER BY interviews.date;";

      const { rows: jobs } = await client.query(getAllJobsSql, [
        // @ts-ignore
        req.decoded.userId,
      ]);
      const access = res.getHeader("x-access-token");
      res.status(200).json({ jobs, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  public async getOneJob(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const getOneJobSql: string =
        "SELECT * from applications where applications.user_id = $1::uuid and id = $2::uuid";
      // "SELECT applications.*, interviews.* FROM applications LEFT JOIN interviews ON applications.id = interviews.job_id WHERE applications.user_id = $1::uuid ORDER BY interviews.date;";

      const { rows: jobs } = await client.query(getOneJobSql, [
        // @ts-ignore
        req.decoded.userId,
        req.body.job_id,
      ]);
      const access = res.getHeader("x-access-token");
      res.status(200).json({ jobs: jobs[0], access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  public async editJob(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      // possible fields in req.body
      // 1. title
      // 2. company
      // 3. location
      // 4. jd_link
      // 5. jd_file
      // 6. latest_status
      // 7. application_note
      // 8. application_date
      // 9. hr_email

      const isUsersJob = await isAuthJob(
        get(req, "decoded.userId"),
        req.body.jobId
      );

      if (!isUsersJob)
        return res.status(401).json({ message: "not authorized" });

      const editJobSql: string =
        "UPDATE applications SET title = $1, company = $2, location = $3, jd_link = $4, jd_file = $5, latest_status = $6, application_note = $7, application_date = DATE($8), hr_email = $9 WHERE id = $10 RETURNING *;";

      const { rows: jobs } = await client.query(editJobSql, [
        req.body.title,
        req.body.company,
        req.body.location,
        req.body.jd_link,
        req.body.jd_file,
        req.body.latest_status,
        req.body.application_note,
        req.body.application_date,
        req.body.hr_email,
        req.body.jobId,
      ]);
      const access = res.getHeader("x-access-token");
      res.status(200).json({ jobs, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  public async editJobStatus(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const isUsersJob = await isAuthJob(
        get(req, "decoded.userId"),
        req.body.jobId
      );

      if (!isUsersJob)
        return res.status(401).json({ message: "not authorized" });

      const editJobSql: string =
        "UPDATE applications SET latest_status = $1 WHERE id = $2 RETURNING *;";

      const { rows: jobs } = await client.query(editJobSql, [
        req.body.latest_status,
        req.body.jobId,
      ]);
      const access = res.getHeader("x-access-token");
      res.status(200).json({ jobs, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ messsage: "Something went wrong" });
    } finally {
      client.release();
    }
  }

  public async deleteJobs(req: Request, res: Response) {
    console.log("deleteJob req", req.body);
    const client = await pool.connect();
    try {
      const isUsersJob = await isAuthJob(
        get(req, "decoded.userId"),
        req.body.jobId
      );

      if (!isUsersJob)
        return res.status(401).json({ message: "not authorized" });

      const deleteJobSql: string =
        "DELETE FROM applications WHERE id = $1 RETURNING *;";

      const { rows: jobs } = await client.query(deleteJobSql, [req.body.jobId]);
      const access = res.getHeader("x-access-token");
      res.status(200).json({ jobs, access });
    } catch (error) {
      console.log(error);
      res.status(500).json({ messsage: "Something went wrong" });
    } finally {
      client.release();
    }
  }
}

export default JobsController;
