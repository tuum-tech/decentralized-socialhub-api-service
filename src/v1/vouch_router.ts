import express, { request, response } from 'express';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import {
    HiveClient,
    OptionsBuilder,
    IOptions
  } from '@elastos/elastos-hive-js-sdk';
import { handleRoute, returnSuccess } from './commom';

const vouchRouter = express.Router();

const getVouchHeader = () : any => {
    return {
        "Accepts": "application/json",
        "Content-Type": "application/json",
        "Authorization": process.env.VOUCH_SECRET_KEY
    };
}

vouchRouter.post('/providers/create', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/providers/create");

    const url = `${process.env.VOUCH_API_URL}/v1/providers/create`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

vouchRouter.get('/providers', async (req, res) => {
      // tslint:disable-next-line:no-console
      console.info("Executing: /v1/vouch_router/providers");

      const url = `${process.env.VOUCH_API_URL}/v1/providers`;
      const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

      // tslint:disable-next-line:no-console
      console.log(`Return: ${JSON.stringify(ret)}`);

      returnSuccess(res, ret);

});

vouchRouter.get('/providers/validationType/:validation_type', async (req, res) => {
      // tslint:disable-next-line:no-console
      console.info("Executing: /v1/vouch_router/providers/validationType/{validation_type}");

        // tslint:disable-next-line:no-console
        console.info(req.params.validation_type);

      const url = `${process.env.VOUCH_API_URL}/v1/providers/validationType/${req.params.validation_type}`;
      const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

      // tslint:disable-next-line:no-console
      console.log(`Return: ${JSON.stringify(ret)}`);

      returnSuccess(res, ret);
});

vouchRouter.get('/services/provider_did/:provider_did', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/provider_did/{provider_did}");

    // tslint:disable-next-line:no-console
    // console.info(req.params.validation_type);

    const url = `${process.env.VOUCH_API_URL}/v1/provider_did/${req.params.provider_did}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

vouchRouter.post('/validationtx/create', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info(`Executing: /v1/vouch_router/validationtx/create ${JSON.stringify(req.body)}`);

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/create`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);

});

vouchRouter.post('/contact', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info(`Executing: /v1/vouch_router/contact ${JSON.stringify(req.body)}`);

    // const url = `${process.env.VOUCH_API_URL}/v1/validationtx/create`;
    // const ret: any = await handleRoute(url, req.body, getVouchHeader(), true);

    // // tslint:disable-next-line:no-console
    // console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, {});

});

vouchRouter.get('/validationtx/did/:did', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/validationtx/did/{did}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/did/${req.params.did}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);

});

vouchRouter.get('/validationtx/provider_id/:provider_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/validationtx/provider_id/{provider_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/provider_id/${req.params.provider_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);

});

vouchRouter.get('/validationtx/confirmation_id/:confirmation_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/validationtx/confirmation_id/{confirmation_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/confirmation_id/${req.params.confirmation_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

 vouchRouter.get('/validationtx/count/provider_id/:provider_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/validationtx/count/provider_id/{provider_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/count/provider_id/${req.params.provider_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);

});

vouchRouter.get('/validationtx/provider_did/:provider_did', async (req, res) => {

     // tslint:disable-next-line:no-console
     console.info("Executing: /v1/vouch_router/validationtx/provider_did/{provider_did}");

     const url = `${process.env.VOUCH_API_URL}/v1/validationtx/provider_did/${req.params.provider_did}`;
     const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

     // tslint:disable-next-line:no-console
     console.log(`Return: ${JSON.stringify(ret)}`);

     returnSuccess(res, ret);
});

vouchRouter.post('/validationtx/is_saved/confirmation_id/:confirmation_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/validationtx/is_saved/confirmation_id/{confirmation_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/is_saved/confirmation_id/${req.params.confirmation_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);

});

vouchRouter.post('/validationtx/approve/confirmation_id/:confirmation_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/approve/confirmation_id/{confirmation_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/approve/confirmation_id/${req.params.confirmation_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

vouchRouter.post('/validationtx/reject/confirmation_id/:confirmation_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/reject/confirmation_id/{confirmation_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/reject/confirmation_id/${req.params.confirmation_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);

});

vouchRouter.post('/validationtx/cancel/confirmation_id/:confirmation_id', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/vouch_router/cancel/confirmation_id/{confirmation_id}");

    const url = `${process.env.VOUCH_API_URL}/v1/validationtx/cancel/confirmation_id/${req.params.confirmation_id}`;
    const ret: any = await handleRoute(url, req.body, getVouchHeader(), false);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

export default vouchRouter;