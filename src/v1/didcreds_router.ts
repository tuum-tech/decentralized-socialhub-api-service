import express, { request } from 'express';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import { handleRoute, returnSuccess } from './commom';
import { DIDBackend, DefaultDIDAdapter, DID, DIDStore, DIDURL, Issuer, RootIdentity, HDKey, VerifiableCredential } from '@elastosfoundation/did-js-sdk/';


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

    // tslint:disable-next-line:no-console
    console.info("url: " + url);

   // tslint:disable-next-line:no-console
   console.info("body: " + JSON.stringify(req.body));
    // tslint:disable-next-line:no-console
   console.info("header: " + JSON.stringify(getDidcredsHeader()));

    const retOld: any = await handleRoute(url, req.body, getDidcredsHeader(), true);

    // tslint:disable-next-line:no-console
    console.log(`Return: ${JSON.stringify(retOld)}`);



    const userDid = req.body.did;
    const credentialType = req.body.credential_type;
    const credentialValue = req.body.credential_value;
    const appDid = process.env.TUUMVAULT_APP_DID;
    const appMnemonics = process.env.TUUMVAULT_MNEMONIC;
    // appMnemonics = 'deliver crane orphan dismiss proud circle lawn cabbage fancy color clever tree';
    // appDid = "did:elastos:ijoT8sAbrY8TMKs3edyNUXMcuj1BcYVPqr";

    DIDBackend.initialize(new DefaultDIDAdapter("mainnet"));

    const didStore = await DIDStore.open("/tmp/store");
    const rootIdentity = RootIdentity.createFromMnemonic(appMnemonics, "", didStore, "passw", true);
    const did = rootIdentity.getDid(0);


    didStore.storeDid(await did.resolve());

    const appDocument = await didStore.loadDid(appDid);

    const key = HDKey.newWithMnemonic(appMnemonics, "");
    const id: DIDURL = DIDURL.from(
      '#primary',
      DID.from(appDid as string) as DID
    ) as DIDURL;
    didStore.storePrivateKey(
      id as DIDURL,
      key.serialize(),
      "passw" as string
    );


    const issuer = new Issuer(appDocument, id);
    const vcBuilder = issuer.issueFor(DID.from(userDid) as DID);

    const vc = await vcBuilder
      .expirationDate(new Date())
      .type("BasicProfileCredential","InternetAccountCredential","TwitterCredential","VerifiableCredential")
      .property(credentialType, credentialValue)
      .id(
        DIDURL.from(`#${credentialType}`, DID.from(userDid) as DID) as DIDURL
      )
      .seal("passw" as string);


    // tslint:disable-next-line:no-console
    console.log("new VC :" + vc.toString(true));
    // tslint:disable-next-line:no-console
    console.log("new VC valid :" + await vc.isValid());

    const stringCredential = JSON.stringify(retOld.verifiable_credential);
    // tslint:disable-next-line:no-console
    console.log("old VC :" + stringCredential);

    // tslint:disable-next-line:no-console
    console.log("old VC valid :" + await (await VerifiableCredential.parseContent(stringCredential)).isValid());


    // const ret = {
    //     verifiable_credential: {
    //         old: retOld,
    //     }
    // }
    returnSuccess(res, retOld);
});




export default didcredsRouter;