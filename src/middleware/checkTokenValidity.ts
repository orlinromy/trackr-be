import { get } from "lodash";
import { Request, Response, NextFunction, application } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { decode, reIssueAccessToken } from "../utils/utils";
import * as dotenv from "dotenv";
dotenv.config();

const checkTokenValidity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("req.body: ", req.body);
  console.log("check token validity");
  const accessToken = get(req, "headers.authorization")?.replace(
    /^Bearer\s/,
    ""
  );

  const refreshToken = get(req.body, "refreshToken");

  if (!accessToken) return next();

  const { decoded, expired } = await decode(accessToken, "access");
  console.log(decoded, expired, refreshToken);
  if (decoded) {
    // @ts-ignore
    req.decoded = decoded;

    return next();
  }

  if (expired && refreshToken) {
    console.log("expired");
    const newAccessToken: any = await reIssueAccessToken({ refreshToken });
    console.log(typeof newAccessToken);
    // reIssueAccessToken({ refreshToken });
    console.log(newAccessToken);

    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken);
      // FE need to take the access token from res.header
      // req["headers"]["authorization"] = newAccessToken;
      console.log(newAccessToken);

      const { decoded } = await decode(newAccessToken, "access");

      // @ts-ignore
      req.decoded = decoded;
    }

    return next();
  }

  return next();
};

export default checkTokenValidity;
