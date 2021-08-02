import { HiveClient, OptionsBuilder } from "@elastos/elastos-hive-js-sdk";
import {
  IRunScriptData,
  IRunScriptResponse,
} from "@elastos/elastos-hive-js-sdk/dist/Services/Scripting.Service";
import { config } from "dotenv/types";
import tuumvaultRouter from "./tuumvault_router";
import { ElastosClient } from "@elastosfoundation/elastos-js-sdk";
import jwt_decode from "jwt-decode";
import nodemailer from "nodemailer";

export interface TuumTechResponse {
  meta: {
    code: number;
    message: string;
  };
  data: any;
}

export function returnSuccess(res: any, dataContent: any) {
  const returned = {
    meta: { code: 200, message: "OK" },
    data: dataContent,
  };

  // tslint:disable-next-line:no-console
  // console.log(JSON.stringify(returned));

  res.send(returned);
}

export function returnError(res: any, dataContent: any) {
  const returned = {
    meta: { code: 500, message: "Internal Error" },
    data: dataContent,
  };

  // tslint:disable-next-line:no-console
  // console.log(JSON.stringify(returned));

  res.send(returned);
}

export async function handleHiveResponse(serviceResponse: any) {
  const status = serviceResponse._status;
  let profileApiResponse: any;
  if (status)
    if (status === "OK") profileApiResponse = serviceResponse;
    else {
      profileApiResponse = {
        status: "500 Internal Server Error",
        code: serviceResponse._error.code,
        message: serviceResponse._error.message,
      };
    }
  else {
    profileApiResponse = {
      status: "500 Internal Server Error",
      code: 404,
      message: "Server Error",
    };
  }
  return profileApiResponse;
}

export async function handleRoute(
  url: string,
  body: any,
  h: any,
  post: boolean = true
) {
  let fetchResponse: any;
  if (post === true) {
    fetchResponse = await fetch(url, {
      method: "POST",
      headers: h,
      body: JSON.stringify(body),
    });
  } else {
    fetchResponse = await fetch(url, {
      method: "GET",
      headers: h,
    });
  }

  let profileApiResponse: any = null;
  try {
    const serviceResponse: any = await fetchResponse.json();

    if (isTuumApi(serviceResponse)) {
      if (serviceResponse.meta.code === 200)
        profileApiResponse = serviceResponse.data;
      else {
        profileApiResponse = {
          status: "500 Internal Server Error",
          code: serviceResponse.meta.code,
          message: serviceResponse.meta.message,
        };
      }
    } else {
      const status = serviceResponse._status;
      if (status)
        if (status === "OK") profileApiResponse = serviceResponse;
        else {
          profileApiResponse = {
            status: "500 Internal Server Error",
            code: serviceResponse._error.code,
            message: serviceResponse._error.message,
          };
        }
      else {
        profileApiResponse = {
          status: "500 Internal Server Error",
          code: 404,
          message: "Server Error",
        };
      }
    }
  } catch (e: any) {
    profileApiResponse = {
      status: "500 Internal Server Error",
      code: 500,
      message: JSON.stringify(e),
    };
  }

  return profileApiResponse;
}

export function isTuumApi(serviceResponse: any) {
  try {
    const tuumtechresponse = serviceResponse as TuumTechResponse;
    return serviceResponse.meta !== undefined;
  } catch (e: any) {
    return false;
  }
}

export async function getUser(
  code: string,
  did?: string
): Promise<any | undefined> {
  const hiveClient = await getNonAnonymousClient();
  const bySMSCode = did && did !== "";
  const script = {
    name: bySMSCode ? "verify_sms_code" : "verify_email_code",
    params: bySMSCode
      ? { code, did }
      : {
          code,
        },
  };

  const runScriptResponse: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

  const { response } = runScriptResponse;
  const { find_code } = response;
  const { items } = find_code;

  if (items.length === 0) {
    return undefined;
  }

  const { loginCred, name } = items[0];
  return { name, loginCred };
}

export async function isRegisteredInVault(email: string): Promise<boolean> {
  const hiveClient = await getNonAnonymousClient();

  const script = {
    name: "get_users_by_email",
    params: {
      filter: email,
    },
  };

  const runScriptResponse: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

  const { response } = runScriptResponse;
  const { users_found } = response;
  const { items } = users_found;

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(items));

  return items.length > 0;
}

export async function sendMail(
  from: string,
  subject: string,
  to: string,
  text: string,
  html: string,
  attachments?: any
) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_SERVER,
    port: process.env.EMAIL_SMTP_PORT as any,
    secure: process.env.EMAIL_SMTP_PORT.toString() === "465" ? true : false,
    auth: {
      user: process.env.EMAIL_SMTP_USERNAME,
      pass: process.env.EMAIL_SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    requireTLS:
      process.env.EMAIL_SMTP_TLS.toLowerCase() === "false" ? false : true,
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from, // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
    attachments,
  });

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(info));
}

export async function sendSMSCode(to: string, code: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);
  const body = `Welcom to Profile! Your verification code is ${code}`;

  let successed = false;

  try {
    const res = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    // tslint:disable-next-line:no-console
    console.log("====>", res);
  } catch (e) {
    successed = false;
  }
}

export async function sendCreateUserVerification(
  email: string,
  phone: string,
  code: string,
  smsCode: boolean
) {
  if (smsCode) {
    await sendSMSCode(phone, code);
  } else {
    const subject = "Profile Email verification";
    const text = `Please click on the following link ${process.env.EMAIL_VERIFICATION_CALLBACK}/${code} to proceed with Profile Onboarding process`;
    const html = `Please click on the following link <a href=${process.env.EMAIL_VERIFICATION_CALLBACK}/${code}>Validate</a> to proceed with Profile Onboarding process`;
    await sendMail(process.env.EMAIL_SENDER, subject, email, text, html);
  }
}

export async function sendCreateUserVerificationUpdate(
  email: string,
  phone: string,
  code: string,
  smsCode: boolean
) {
  if (smsCode) {
    await sendSMSCode(phone, code);
  } else {
    const subject = "Profile Email Update verification";
    const text = `Please click on the following link ${process.env.EMAIL_UPDATE_CALLBACK}/${code} to confirm email update`;
    const html = `Please click on the following link <a href=${process.env.EMAIL_UPDATE_CALLBACK}/${code}>Validate</a> to confirm email update`;
    sendMail(process.env.EMAIL_SENDER, subject, email, text, html);
  }
}

export async function registerUpdateVerifyAttempt(email: string, code: string) {
  const hiveClient = await getNonAnonymousClient();
  const script = {
    name: "update_user",
    params: {
      name,
      did: "",
      loginCred: {
        email,
      },
      status: "WAITING_CONFIRMATION",
      code,
      accountType: "",
      passhash: "",
      badges: {
        account: {
          beginnerTutorial: {
            archived: false,
          },
          basicProfile: {
            archived: false,
          },
          educationProfile: {
            archived: false,
          },
          experienceProfile: {
            archived: false,
          },
        },
        socialVerify: {
          linkedin: {
            archived: false,
          },
          facebook: {
            archived: false,
          },
          twitter: {
            archived: false,
          },
          google: {
            archived: false,
          },
          email: {
            archived: false,
          },
          phone: {
            archived: false,
          },
        },
        didPublishTimes: {
          _1times: {
            archived: false,
          },
          _5times: {
            archived: false,
          },
          _10times: {
            archived: false,
          },
          _25times: {
            archived: false,
          },
          _50times: {
            archived: false,
          },
          _100times: {
            archived: false,
          },
        },
        dStorage: {
          ownVault: {
            archived: false,
          },
        },
      },
      userToken: "",
      isDIDPublished: "",
      onBoardingCompleted: "",
      tutorialStep: "",
      hiveHost: "",
      avatar: "",
      timestamp: Date.now(),
    },
  };

  const runScriptResponse: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

  const { response } = runScriptResponse;

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(response));
}

export async function registerUpdateAttempt(
  did: string,
  email: string,
  phone: string,
  code: string
) {
  const hiveClient = await getNonAnonymousClient();
  const script = {
    name: "update_verify_user",
    params: { did, email, phone, code },
  };

  const runScriptResponse: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

  const { response } = runScriptResponse;

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(response));
}

export async function registerVerifyAttempt(
  name: string,
  email: string,
  phone: string,
  code: string,
  smsCode: boolean
): Promise<boolean> {
  const hiveClient = await getNonAnonymousClient();
  const loginCred = smsCode ? { phone } : { email };
  const script = {
    name: "add_user",
    params: {
      name,
      did: "",
      loginCred,
      status: "WAITING_CONFIRMATION",
      code,
      accountType: "",
      passhash: "",
      didPublishTime: 0,
      pageTemplate: "",
      badges: {
        account: {
          beginnerTutorial: {
            archived: false,
          },
          basicProfile: {
            archived: false,
          },
          educationProfile: {
            archived: false,
          },
          experienceProfile: {
            archived: false,
          },
        },
        socialVerify: {
          linkedin: {
            archived: false,
          },
          facebook: {
            archived: false,
          },
          twitter: {
            archived: false,
          },
          google: {
            archived: false,
          },
          email: {
            archived: false,
          },
          phone: {
            archived: false,
          },
        },
        didPublishTimes: {
          _1times: {
            archived: false,
          },
          _5times: {
            archived: false,
          },
          _10times: {
            archived: false,
          },
          _25times: {
            archived: false,
          },
          _50times: {
            archived: false,
          },
          _100times: {
            archived: false,
          },
        },
        dStorage: {
          ownVault: {
            archived: false,
          },
        },
      },
      userToken: "",
      isDIDPublished: "",
      onBoardingCompleted: "",
      tutorialStep: "",
      hiveHost: "",
      avatar: "",
      timestamp: Date.now(),
    },
  };

  const runScriptResponse: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData);

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(runScriptResponse));

  const { response } = runScriptResponse;
  const { add_user } = response;
  const { inserted_id } = add_user;

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(inserted_id));
  return inserted_id !== undefined;
}

export async function getHiveClient(): Promise<HiveClient> {
  // Disabled getToken() for now and using Anonymous Instance while our script allowAnonymous
  // TODO: Persist token in a mongodb so we don't need to call getToken for every api call

  // const token = await getToken();
  // return HiveClient.createInstance(token, `${process.env.TUUMVAULT_API_URL}`);
  return HiveClient.createAnonymousInstance(`${process.env.TUUMVAULT_API_URL}`);
}

export async function getNonAnonymousClient(): Promise<HiveClient> {
  // Disabled getToken() for now and using Anonymous Instance while our script allowAnonymous
  // TODO: Persist token in a mongodb so we don't need to call getToken for every api call

  const token = await getToken();
  return HiveClient.createInstance(token, `${process.env.TUUMVAULT_API_URL}`);
}

export async function getToken(): Promise<string> {
  const appMnemonics = process.env.TUUMVAULT_MNEMONIC;
  const vaultUrl = process.env.TUUMVAULT_API_URL;

  const appDid = await ElastosClient.did.loadFromMnemonic(appMnemonics);
  const builder = new OptionsBuilder();
  builder.setAppInstance(process.env.TUUMVAULT_APP_DID, appDid);
  builder.setHiveHost(vaultUrl);

  const options = builder.build();

  const document = await getApplicationDIDDocument(appDid);

  const challenge = await HiveClient.getApplicationChallenge(options, document);
  const vp = await generateUserVerifiablePresentation(
    appDid,
    appMnemonics,
    challenge,
    process.env.TUUMVAULT_APP_DID
  );
  return await HiveClient.getAuthenticationToken(options, vp);
}

const generateUserVerifiablePresentation = async (
  appDid: any,
  user: any,
  appChallenge: any,
  appId: any
) => {
  const userDid = await ElastosClient.did.loadFromMnemonic(user);
  const jwt = jwt_decode(appChallenge.challenge) as any;
  const iss = jwt.iss;
  const nonce = jwt.nonce;

  const vc = ElastosClient.didDocuments.createVerifiableCredentialVP(
    appDid,
    userDid,
    appId
  );
  return ElastosClient.didDocuments.createVerifiablePresentation(
    appDid,
    "VerifiablePresentation",
    vc,
    iss,
    nonce
  );
};

const getApplicationDIDDocument = async (appDid: any) => {
  const document = ElastosClient.didDocuments.newDIDDocument(appDid);
  const d = ElastosClient.didDocuments.sealDocument(appDid, document);
  return d;
};
