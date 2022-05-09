import express, { request } from 'express';
import { createClient, EventTimeline, MatrixClient } from 'matrix-js-sdk';
import bcrypt from 'bcrypt'
import { handleRoute, returnSuccess } from './common'
const matrixRouter = express.Router();

interface IMatrixAuth{
    vc: string
}

matrixRouter.post('/auth', async (req, res) => {

    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/matrix/auth");
    const did = req.body.did;
    const url = `${process.env.SYNAPSE_API_URL}`;
    const client = createClient(url);
    const userLogin = did.replaceAll('did:elastos:', '')
    const password = bcrypt.hashSync(`${did}_${process.env.TUUMVAULT_DID}`, 10);



    await client.login('m.login.password', {
        user:  `${process.env.SYNAPSE_ROOT_USER}`,
        password:  `${process.env.SYNAPSE_ROOT_PASSWORD}`
      });



    const registerItem = await client.register( userLogin, password, "", {type: ""})

    // tslint:disable-next-line:no-console
    console.info(registerItem)

    const ret: any = await handleRoute(url, req.body, {}, true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(ret)}`);

    returnSuccess(res, ret);
});

export default matrixRouter;