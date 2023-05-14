import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  host: "localhost",
  port: 5432,
  database: process.env.POSTGRES_DB_NAME,
});

export default pool;
