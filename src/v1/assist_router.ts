import express, { request } from 'express';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import { handleRoute, returnSuccess } from './commom';


const assistRouter = express.Router();

const getAssistHeader = () : any => {
    return {
        "Accepts": "application/json",
        "Content-Type": "application/json",
        "Authorization": process.env.ASSIST_SECRET_KEY
    };
}

assistRouter.post('/didtx/create', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v2/assist_router/didtx/create");

    const url = `${process.env.ASSIST_API_URL}/v2/didtx/create`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

assistRouter.get('/didtx/confirmation_id/:confirmation_id', async (req, res) => {

     // tslint:disable-next-line:no-console
     console.info("Executing: /v2/assist_router/didtx/confirmation_id/{confirmation_id}");

     const url = `${process.env.ASSIST_API_URL}/v2/didtx/confirmation_id/${req.params.confirmation_id}`;
     const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

        // tslint:disable-next-line:no-console
        console.info(`Return confirmation: ${JSON.stringify(ret)}`);

     returnSuccess(res, ret);
});


assistRouter.get('/didtx/did/:did', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v2/assist_router/didtx/did/{did}");

    const url = `${process.env.ASSIST_API_URL}/v2/didtx/did/${req.params.did}`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

assistRouter.get('/didtx/recent/did/:did', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/assist_router/didtx/recent/did/{did}");

    const url = `${process.env.ASSIST_API_URL}/v2/didtx/recent/did/${req.params.did}`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

assistRouter.get('/documents/did/:did', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/assist_router/documents/did/{did}");

    const url = `${process.env.ASSIST_API_URL}/v2/documents/did/${req.params.did}`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});


assistRouter.get('/documents/crypto_name/:crypto_name', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/assist_router/documents/crypto_name/{crypto_name}");

    const url = `${process.env.ASSIST_API_URL}/v1/documents/crypto_name/${req.params.crypto_name}`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

assistRouter.get('/service_count/:service/:did', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/assist_router/service_count/{service}/{did}");

    const url = `${process.env.ASSIST_API_URL}/v1/service_count/${req.params.service}/${req.params.did}`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

assistRouter.get('/service_count/statistics', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/assist_router/service_count/statistics");

    const url = `${process.env.ASSIST_API_URL}/v1/service_count/statistics`;
    const ret: any = await handleRoute(url, req.body, getAssistHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

export default assistRouter;