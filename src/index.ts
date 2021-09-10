import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import tuumvaultRouter from "./v1/tuumvault_router";
import supportRouter from "./v1/support_router";
import vouchRouter from "./v1/vouch_router";
import assistRouter from "./v1/assist_router";
import testRouter from "./v1/test";
import auth from "./v1/auth";
import cors from "cors";
import didcredsRouter from "./v1/didcreds_router";
import {
  getHiveClient,
  verifyUser,
  registerUpdateAttempt,
  registerVerifyAttempt,
  returnError,
  returnSuccess,
  sendCreateUserVerificationUpdate,
  sendCreateUserVerification,
} from "./v1/commom";
import crypto from "crypto";
import { scheduleUsersCleanUp } from "./scheduler/user-cleanup";
import { DefaultDIDAdapter, DIDBackend } from "@elastosfoundation/did-js-sdk/";

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
app.use("/v1/test", testRouter);

app.post("/v1/credential/create", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log("/v1/credential/create", JSON.stringify(req.body));

  const { name, email, phone, smsCode, did } = req.body;
  let code = crypto.randomBytes(16).toString("hex");
  if (smsCode) {
    code = crypto.randomBytes(2).toString("hex");
  }

  const registerSuccess = await registerVerifyAttempt(
    name,
    email,
    phone,
    code,
    did,
    smsCode
  );

  // send email if success
  if (registerSuccess) {
    await sendCreateUserVerification(email, phone, code, smsCode);
    returnSuccess(res, { return_code: "WAITING_CONFIRMATION" });
  } else {
    returnError(res, {});
  }
});

app.post("/v1/credential/update", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log("Executing: /credential/update");

  const { did, email, phone, smsCode } = req.body;
  let code = crypto.randomBytes(16).toString("hex");
  if (smsCode) {
    code = crypto.randomBytes(2).toString("hex");
  }

  registerUpdateAttempt(did, email, code);

  try {
    await sendCreateUserVerificationUpdate(email, phone, code, smsCode);
    returnSuccess(res, {
      status: "success",
    });
  } catch (e) {
    returnError(res, {
      message: JSON.stringify(e),
    });
  }
});

app.post("/v1/credential/verify", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log("Executing: /v1/credential/verify");

  const { code, did, phone } = req.body;
  const result: any = await verifyUser(code, did || '', phone || '');

  if (result === undefined) {
    returnSuccess(res, { return_code: "CODE_INVALID" });
  } else {

    returnSuccess(res, {
      return_code: "CODE_CONFIRMED",
      email: result.loginCred.email,
      phone: result.phone,
      name: result.name,
      did: result.did
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

  // initialize DIDBackend
  DIDBackend.initialize(new DefaultDIDAdapter("mainnet"));

});
