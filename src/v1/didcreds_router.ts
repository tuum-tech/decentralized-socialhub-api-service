import express, { request } from 'express';
import bodyParser from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import { handleRoute, returnSuccess } from './commom';
import { DIDBackend, DefaultDIDAdapter, DID, DIDStore, DIDURL, Issuer, RootIdentity, HDKey, VerifiableCredential, DIDDocument, DIDDocumentBuilder } from '@elastosfoundation/did-js-sdk/';


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


const getExpirationDate =  () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  return new Date(year + 5, month, day);
}


didcredsRouter.post('/validation/internet_account', async (req, res) => {

    const userDid = req.body.did;
    const credentialType = req.body.credential_type;
    const credentialValue = req.body.credential_value;
    const appDid = process.env.TUUMVAULT_APP_DID;
    const appMnemonics = process.env.TUUMVAULT_MNEMONIC;
    const DID_STORE_PWD = process.env.DID_STORE_PASSWORD as string;

    const didStore = await DIDStore.open(process.env.DID_STORE_PATH as string);
    const did = DID.from(appDid);
    didStore.storeDid(await did.resolve());
    const appDocument = await didStore.loadDid(appDid);

    const key = HDKey.newWithMnemonic(appMnemonics, "").deriveWithPath(HDKey.DERIVE_PATH_PREFIX+0);
    const id: DIDURL = DIDURL.from(
      '#primary',
      DID.from(appDid as string) as DID
    ) as DIDURL;
    didStore.storePrivateKey(
      id as DIDURL,
      key.serialize(),
      DID_STORE_PWD
    );

    const issuer = new Issuer(appDocument, id);
    const vcBuilder = issuer.issueFor(DID.from(userDid) as DID);

    const vc = await vcBuilder
      .expirationDate(getExpirationDate())
      .type("BasicProfileCredential","InternetAccountCredential","TwitterCredential","VerifiableCredential")
      .property(credentialType, credentialValue)
      .id(
        DIDURL.from(`#${credentialType}`, DID.from(userDid)) as DIDURL
      )
      .seal(DID_STORE_PWD);

    // tslint:disable-next-line:no-console
    console.log("is VC valid :" + await vc.isValid());

    const ret = { verifiable_credential: vc.toString(true) }

    returnSuccess(res, ret);
});


export default didcredsRouter;