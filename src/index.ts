import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import tuumvaultRouter from "./v1/tuumvault_router";
import supportRouter from "./v1/support_router";
import vouchRouter from "./v1/vouch_router";
import assistRouter from "./v1/assist_router";
import auth from "./v1/auth";
import cors from "cors";
import didcredsRouter from "./v1/didcreds_router";
import {
  getHiveClient,
  getUser,
  registerVerifyAttempt,
  returnSuccess,
  sendCreateUserVerificationEmail,
} from "./v1/commom";
import crypto from "crypto";
import { scheduleUsersCleanUp } from "./scheduler/user-cleanup";
import cron from "node-cron";

dotenv.config();

const app = express();

const port = process.env.SERVER_PORT || 8080;

app.use(express.json({ limit: "32mb" }));
app.use(
  express.urlencoded({
    limit: "32mb",
    extended: true,
    parameterLimit: 1000000,
  })
);
app.use(cors({ origin: true }));

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}

const validateAuthorization = (req: any): boolean => {
  return (
    req.header("Authorization") &&
    req.header("Authorization") === process.env.SECRET_KEY
  );
};

app.use("/v1", (req, res, next) => {
  if (!validateAuthorization(req)) {
    res.send({
      meta: {
        code: 99,
        message: "Authentication Required",
        description: "The provided auth token is not valid",
      },
    });
  } else {
    next();
  }
});

app.use("/v1/tuumvault_router", tuumvaultRouter);
app.use("/v1/vouch_router", vouchRouter);
app.use("/v1/assist_router", assistRouter);
app.use("/v1/didcreds_router", didcredsRouter);
app.use("/v1/auth", auth);
app.use("/v1/support_router", supportRouter);

app.post("/v1/create/user", async (req, res) => {
  const code = crypto.randomBytes(16).toString("hex");

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(req.body));

   const { email, name } = req.body;
  registerVerifyAttempt(name, email, code);
  // send email
  await sendCreateUserVerificationEmail(email, code);
  returnSuccess(res, { return_code: "WAITING_CONFIRMATION" });
});

// app.post("/v1/forcecreate/user", async (req, res) => {

// });

app.post("/v1/verify/email", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log("Executing: /v1/verify/email");

  const { code } = req.body;
  const result: any = await getUser(code);

  if (result === undefined) {
    returnSuccess(res, { return_code: "CODE_INVALID" });
  } else {
    returnSuccess(res, {
      return_code: "CODE_CONFIRMED",
      email: result.email,
      name: result.name,
    });
  }
});

app.use("/", (req, res) => {
  res.send({ server: "Profile API" });
});




app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Profile Api Service listening on port ${port}!`);

  scheduleUsersCleanUp();


});
