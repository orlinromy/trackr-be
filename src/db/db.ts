import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_LINK,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
