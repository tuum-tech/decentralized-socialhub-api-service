import express, { request } from 'express';
import { IRunScriptData, IRunScriptResponse, ISetScriptData, ISetScriptResponse } from '@elastos/elastos-hive-js-sdk/dist/Services/Scripting.Service';
import { getHiveClient, getToken, handleHiveResponse, handleRoute, returnSuccess } from './commom';

const tuumvaultRouter = express.Router();


tuumvaultRouter.post('/scripting/set_script', async (req, res) => {
    const hiveClient = await getHiveClient();
    const response : ISetScriptResponse =  await hiveClient.Scripting.SetScript(req.body as ISetScriptData);
    returnSuccess(res, JSON.stringify(response));
});

tuumvaultRouter.post('/scripting/run_script', async (req, res) => {
    const hiveClient = await getHiveClient();
    const response : IRunScriptResponse<any> =  await hiveClient.Scripting.RunScript<any>(req.body as IRunScriptData);

    returnSuccess(res, response.response);
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



export default tuumvaultRouter;