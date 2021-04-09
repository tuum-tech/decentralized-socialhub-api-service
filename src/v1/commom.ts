import { HiveClient, OptionsBuilder } from "@elastos/elastos-hive-js-sdk";
import { IRunScriptData, IRunScriptResponse } from "@elastos/elastos-hive-js-sdk/dist/Services/Scripting.Service";
import { config } from "dotenv/types";
import tuumvaultRouter from "./tuumvault_router";
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import nodemailer from 'nodemailer';


export interface TuumTechResponse {
    meta: {
        code: number,
        message: string
    },
    data: any
}

export function returnSuccess(res: any, data: any){
    res.send({
        meta: { code: 200, message: 'OK'},
        data
    });
}

export async function handleHiveResponse(serviceResponse:any){
    const status = serviceResponse._status;
    let profileApiResponse : any;
    if (status)
        if (status === "OK")
            profileApiResponse = serviceResponse;
        else {

            profileApiResponse = {
                "status": '500 Internal Server Error',
                "code": serviceResponse._error.code,
                "message": serviceResponse._error.message
        }
            }
    else {
        profileApiResponse = {
            "status": '500 Internal Server Error',
            "code": 404,
            "message": "Server Error"
        }
    }
    return profileApiResponse;
}

export async function handleRoute(url:string, body:any, h:any, post:boolean = true) {

    let fetchResponse: any;
    if (post === true){
        fetchResponse = await fetch(url, {
            method: 'POST',
            headers: h,
            body: JSON.stringify(body),
         });
    } else {
        fetchResponse = await fetch(url, {
            method: 'GET',
            headers: h
         });
    }

    let profileApiResponse : any = null;
    try {

        const serviceResponse : any = await fetchResponse.json();

        if (isTuumApi(serviceResponse)){
            if (serviceResponse.meta.code === 200)
                profileApiResponse = serviceResponse.data;
            else {
                profileApiResponse = {
                    "status": '500 Internal Server Error',
                    "code": serviceResponse.meta.code,
                    "message": serviceResponse.meta.message
                }
            }
        } else {
            const status = serviceResponse._status;
                if (status)
                    if (status === "OK")
                        profileApiResponse = serviceResponse
                    else {

                        profileApiResponse = {
                            "status": '500 Internal Server Error',
                            "code": serviceResponse._error.code,
                            "message": serviceResponse._error.message
                    }
                        }
                else {
                    profileApiResponse = {
                        "status": '500 Internal Server Error',
                        "code": 404,
                        "message": "Server Error"
                    }
                }
        }
    } catch (e: any){
        profileApiResponse = {
            "status": '500 Internal Server Error',
            "code": 500,
            "message": JSON.stringify(e)
        }
    }

    return profileApiResponse;
}


export function isTuumApi(serviceResponse : any) {
    try {
        const tuumtechresponse = serviceResponse as TuumTechResponse;
        return serviceResponse.meta !== undefined;
    } catch(e: any){
        return false;
    }
}

export async function codeIsValid(code: string): Promise<boolean> {

    const hiveClient = await getHiveClient();
    const script = {
        'name': 'verify_code',
        "params": {
            "code": code
        }
    }

    const runScriptResponse : IRunScriptResponse<any> =  await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

    const { response } = runScriptResponse;
    const { find_code } = response;
    const { items } = find_code;

    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(items));

    return items.length > 0;
}

export async function isRegisteredInVault(email: string) : Promise<boolean> {
    const hiveClient = await getHiveClient();

    const script = {
        "name": "get_users_by_email",
        "params": {
           "email": email
        }
    }

    const runScriptResponse : IRunScriptResponse<any> =  await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

    const { response } = runScriptResponse;
    const { get_users_by_email} = response;
    const { items } = get_users_by_email;

    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(items));

    return items.length > 0;
}

export async function sendMail(email : string, code: string){

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_SERVER,
        port: process.env.EMAIL_SMTP_PORT as any,
        secure: process.env.EMAIL_SMTP_TLS.toLowerCase() === "false" ? false: true,
        auth: {
            user: process.env.EMAIL_SMTP_USERNAME,
            pass: process.env.EMAIL_SMTP_PASSWORD,
        }
      });


    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.EMAIL_SENDER, // sender address
      to: email, // list of receivers
      subject: "Profile Email verification", // Subject line
      text: `Please click on the following link ${process.env.EMAIL_VERIFICATION_CALLBACK}/${code} to proceed with Profile Onboarding process`, // plain text body
      html: `Please click on the following link <a href=${process.env.EMAIL_VERIFICATION_CALLBACK}/${code}>Validate</a> to proceed with Profile Onboarding process`, // html body
    });

    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(info));
;}


export async function registerVerifyAttempt(name:string, email: string, code: string)
{
    const hiveClient = await getHiveClient();
    const script = {
        "name": "add_user",
        "params": {
            "name": name,
            "email": email,
            "status": 'WAITING_CONFIRMATION',
            "code": code,
            "did": "",
            "accountType": "",
            "passhash": "",
            "userToken": "",
            "isDIDPublished": "",
            "onBoardingCompleted": "",
            "tutorialStep": "",
            "hiveHost": "",
            "avatar": "",
        }
    };

    const runScriptResponse : IRunScriptResponse<any> =  await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

    const { response } = runScriptResponse;

    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(response));

}

export async function getHiveClient() : Promise<HiveClient>  {

    const token = await getToken();
    return HiveClient.createInstance(token, `${process.env.TUUMVAULT_API_URL}`);
}


export async function getToken() : Promise<string> {
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
    const vc = ElastosClient.didDocuments.createVerifiableCredentialVP(appDid, userDid, appId);
    return ElastosClient.didDocuments.createVerifiablePresentation(appDid, "VerifiablePresentation", vc, iss, nonce);
}

const getApplicationDIDDocument = async (appDid:any) => {

    const document = ElastosClient.didDocuments.newDIDDocument(appDid)
    const d = ElastosClient.didDocuments.sealDocument(appDid, document)
    return d;
}
