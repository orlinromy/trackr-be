import express, { Application, Router } from "express";
import cors from "cors";
import users from "./router/users";
import sessions from "./router/sessions";
import jobs from "./router/jobs";
import interviews from "./router/interviews";
import pool from "./db/db";
import checkTokenValidity from "./middleware/checkTokenValidity";
import resetSession from "./middleware/resetSession";

class Server {
  private app;

  constructor() {
    this.app = express();
    this.config();
    this.routerConfig();
    this.dbConnect();
    resetSession();
  }

  private config() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(checkTokenValidity);
  }

  private dbConnect() {
    pool.connect(function (
      err: Error | string,
      client: Object | undefined,
      done: Function | undefined
    ) {
      if (err) throw new Error();
      console.log("DB Connected");
    });
  }

  private routerConfig() {
    this.app.use("/users", users);
    this.app.use("/sessions", sessions);
    this.app.use("/jobs", jobs);
    this.app.use("/interviews", interviews);
  }

  public start = (port: number) => {
    return new Promise((resolve, reject) => {
      this.app
        .listen(port, () => {
          resolve(port);
        })
        .on("error", (err: Object) => reject(err));
    });
  };
}

export default Server;
