import express, { request } from 'express';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import {
    HiveClient,
    OptionsBuilder,
    IOptions
  } from '@elastos/elastos-hive-js-sdk';
import { IRunScriptData, ISetScriptData, ISetScriptResponse } from '@elastos/elastos-hive-js-sdk/dist/Services/Scripting.Service';
import { handleRoute, returnSuccess } from './commom';

const tuumvaultRouter = express.Router();


tuumvaultRouter.post('/scripting/set_script', async (req, res) => {
    const hiveClient = await getHiveClient();
    const response : ISetScriptResponse =  await hiveClient.Scripting.SetScript(req.body as ISetScriptData);
    returnSuccess(res, JSON.stringify(response));
});

tuumvaultRouter.post('/scripting/run_script', async (req, res) => {
    const hiveClient = await getHiveClient();
    const response : any =  await hiveClient.Scripting.RunScript<any>(req.body as IRunScriptData);
    returnSuccess(res, JSON.stringify(response));
});

tuumvaultRouter.post('/scripting/run_script_upload/:transaction_id', async (req, res) => {

    const url = `${process.env.TUUMVAULT_API_URL}/api/v1/scripting/run_script_upload/{transaction_id}`;
    const token = await getToken();

    const postData: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `token ${token}`
        }
      };


    const fetchResponse = await fetch(url, postData);
    res.send(JSON.stringify(fetchResponse));

   // const ret: any = await handleRoute(url, req.body, getDidcredsHeader(), false);
});

const getHiveClient = async() : Promise<HiveClient> => {

    const token = await getToken();

    // // tslint:disable-next-line:no-console
    // console.log(`token generated ${token}`);
    return HiveClient.createInstance(token, `${process.env.TUUMVAULT_API_URL}`);
}


const getToken = async () : Promise<string> => {
    const appMnemonics = process.env.TUUMVAULT_MNEMONIC;
    const vaultUrl = process.env.TUUMVAULT_API_URL;

    const appDid = await ElastosClient.did.loadFromMnemonic(appMnemonics);
    const builder = new OptionsBuilder();
    builder.setAppInstance(process.env.TUUMVAULT_APP_DID, appDid);
    builder.setHiveHost(vaultUrl);

    const options = builder.build();

    const document = await getApplicationDIDDocument(appDid);

    const challenge = await HiveClient.getApplicationChallenge(options, document);
    const vp = await generateUserVerifiablePresentation(appDid, appMnemonics, challenge, process.env.TUUMVAULT_APP_DID);
    return await HiveClient.getAuthenticationToken(options, vp);
}

const generateUserVerifiablePresentation = async (appDid: any, user: any, appChallenge: any, appId:any) => {
    const userDid = await ElastosClient.did.loadFromMnemonic(user)
    const jwt = jwt_decode(appChallenge.challenge) as any;
    const iss = jwt.iss;
    const nonce = jwt.nonce;
    // tslint:disable-next-line:no-console
    console.log(`${appDid}  ${userDid} ${appId}`);
    const vc = ElastosClient.didDocuments.createVerifiableCredentialVP(appDid, userDid, appId)
    return ElastosClient.didDocuments.createVerifiablePresentation(appDid, "VerifiablePresentation", vc, iss, nonce)
}

const getApplicationDIDDocument = async (appDid:any) => {

    const document = ElastosClient.didDocuments.newDIDDocument(appDid)
    const d = ElastosClient.didDocuments.sealDocument(appDid, document)
    return d
}

export default tuumvaultRouter;