import express, { request } from 'express';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import { handleRoute, returnSuccess } from './commom';


const didcredsRouter = express.Router();

const getDidcredsHeader = () : any => {
    return {
        "Accepts": "application/json",
        "Content-Type": "application/json",
        "Authorization": process.env.DIDCREDS_SECRET_KEY
    };
}

didcredsRouter.post('/validation/email_callback_elastos', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/didcreds_router/validation/email_callback_elastos");

    const url = `${process.env.DIDCREDS_API_URL}/v1//validation/email_callback_elastos`;
    const ret: any = await handleRoute(url, req.body, getDidcredsHeader(), true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

didcredsRouter.post('/validation/internet_account', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/didcreds_router/validation/internet_account");

    const url = `${process.env.DIDCREDS_API_URL}/v1/validation/internet_account`;
    const ret: any = await handleRoute(url, req.body, getDidcredsHeader(), true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});




export default didcredsRouter;