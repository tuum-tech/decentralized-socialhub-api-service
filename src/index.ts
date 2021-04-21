import express, { request, urlencoded } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import tuumvaultRouter from './v1/tuumvault_router';
import tuumtech from './v1/tuumtech';
import vouchRouter from './v1/vouch_router';
import assistRouter from './v1/assist_router';
import auth from './v1/auth';
import cors from 'cors';
import didcredsRouter from './v1/didcreds_router';
import e from 'express';
import { getUser, isRegisteredInVault, registerVerifyAttempt, returnSuccess, sendCreateUserVerificationEmail, sendMail } from './v1/commom';
import { Common } from 'googleapis';
import crypto from 'crypto';

const app = express();

const port = 8082;

app.use(bodyParser.json({ limit: '5mb'}));
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors({origin: true}));

if (!globalThis.fetch) {
    globalThis.fetch = fetch as any;
  }

const validateAuthorization = (req:any) : boolean => {
  return req.header('Authorization') && req.header('Authorization') === process.env.SECRET_KEY;
}

app.use("/v1", (req, res, next) => {

  if (!validateAuthorization(req)) {
    res.send({ "meta":
      { "code": 99, "message": "Authentication Required", "description": "The provided auth token is not valid"}
    });
  } else {
    next();
  }
});


app.use('/v1/tuumvault_router', tuumvaultRouter );
app.use('/v1/vouch_router', vouchRouter);
app.use('/v1/assist_router', assistRouter);
app.use('/v1/didcreds_router', didcredsRouter);
app.use('/v1/auth', auth);
app.use('/v1/tuumtech', tuumtech);

app.post("/v1/create/user", async (req, res) => {

  const code = crypto.randomBytes(16).toString("hex");

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(req.body));

  const { email } = req.body;
  const { name } = req.body;

  const isRegistered = await isRegisteredInVault(email);
  if (isRegistered === true) {

    // tslint:disable-next-line:no-console
    console.log('user is registered in our vault')
    returnSuccess(res, {"return_code": "REGISTERED_USER"});
  } else {
    // tslint:disable-next-line:no-console
    console.log('user is not registered in our vault')
    registerVerifyAttempt(name, email, code);

    // send email
    await sendCreateUserVerificationEmail(email, code);

    returnSuccess(res, {"return_code": "WAITING_CONFIRMATION"});

  }
});

// app.post("/v1/forcecreate/user", async (req, res) => {

// });

app.post("/v1/verify/email", async (req, res) =>
{
  // tslint:disable-next-line:no-console
  console.log("Executing: /v1/verify/email")

  const { code } = req.body;
  const result : any = await getUser(code);

  if (result === undefined){
    returnSuccess(res,  {"return_code": "CODE_INVALID"});

  }
  else{

    returnSuccess(res,  {"return_code": "CODE_CONFIRMED", "email": result.email, "name": result.name });
  }
});

app.use('/', (req, res) => {
  res.send({"server": "Profile API"});
});

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`Profile Api Service listening on port ${port}!`)
    dotenv.config();

});


