import server from "./server";
import * as dotenv from "dotenv";
dotenv.config();

const port = parseInt(process.env.PORT || "5001");

const starter = new server()
  .start(port)
  .then((port) => console.log(`Running on port ${port}`))
  .catch((error) => {
    console.log(error);
  });

export default starter;
