import express, { request, urlencoded } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import tuumvaultRouter from './v1/tuumvault_router';
import vouchRouter from './v1/vouch_router';
import assistRouter from './v1/assist_router';
import auth from './v1/auth';
import cors from 'cors';
import didcredsRouter from './v1/didcreds_router';
import e from 'express';

const app = express();

const port = 8082;

app.use(bodyParser.json());
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


app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`Profile Api Service listening on port ${port}!`)
    dotenv.config();

});


