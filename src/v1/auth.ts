import express, { request, response } from 'express';
import bodyParser, { json } from 'body-parser';
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk';
import jwt_decode from 'jwt-decode';
import { handleRoute, returnSuccess } from './commom';
import { google } from 'googleapis';
import oauth from 'oauth';
const auth = express.Router();



auth.get('/google_request', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/auth/google_request");

    const oauth2Client = new google.auth.OAuth2(
        {
            clientId:process.env.GOOGLE_CLIENT_ID,
            redirectUri:process.env.GOOGLE_CALLBACK_URL,
        }
      );

      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'select_account',
        state: Math.random().toString(36).slice(2)
      });

      returnSuccess(res, url);
});

auth.get('/google_callback', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/auth/google_callback");

    const oauth2Client = new google.auth.OAuth2(
        {
            clientId:process.env.GOOGLE_CLIENT_ID,
            redirectUri:process.env.GOOGLE_CALLBACK_URL,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
      );

    // tslint:disable-next-line:no-console
    console.info(`code: ${req.query.code}`);

    const tokenResponse: any =  await oauth2Client.getToken(req.query.code as string);

    // tslint:disable-next-line:no-console
    console.info(`token: ${JSON.stringify(tokenResponse)}`);


    const result = {
        "request_token": tokenResponse.tokens.access_token,
        "expires_in": tokenResponse.tokens.expiry_date
    }

    returnSuccess(res, result);
});


auth.get('/facebook_request', async (req, res) => {
   // tslint:disable-next-line:no-console
   console.info("Executing: /v1/auth/facebook_request");

   const authUrl = `https://www.facebook.com/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&response_type=code&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}&state=${Math.random().toString(36).slice(2)}`;

    returnSuccess(res, authUrl);
});


auth.get('/facebook_callback', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/auth/facebook_callback");

    const urlAccessToken = `https://graph.facebook.com/v10.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${req.query.code}`;

    const facebookResponse = await fetch(urlAccessToken, {
        method: 'GET',
        headers: {
            "Accepts": "application/json",
            "Content-Type": "application/json",
        }
    })

    const responseJson = await facebookResponse.json();
    const { access_token, expires_in } = responseJson;

    returnSuccess(res, { request_token: access_token, expires_in });
 });


auth.get('/twitter_request', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/auth/twitter_request");

    const consumer = new oauth.OAuth(
        "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
        process.env.TWITTER_API_KEY, process.env.TWITTER_API_SECRET, "1.0A", process.env.TWITTER_CALLBACK_URL, "HMAC-SHA1");

        const oauthToken = consumer.getOAuthRequestToken( (err: {statusCode: number, data?: any},
            token: string,
            tokenSecret: string,
            parsedQueryString: any) => {

            returnSuccess(res, {
                    "request_token": token
                }
            );
        })
 });


 auth.post('/twitter_callback', async (req, res) => {
     // tslint:disable-next-line:no-console
     console.info("Executing: /v1/auth/twitter_callback");

     const consumer = new oauth.OAuth(
        "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
        process.env.TWITTER_API_KEY, process.env.TWITTER_API_SECRET, "1.0A", process.env.TWITTER_CALLBACK_URL, "HMAC-SHA1");

        const {token, verifier} = req.body as any;

        consumer.getOAuthAccessToken(token, "", verifier,
           async ( err: {statusCode: number, data?: any},
            accessToken: string,
            tokenSecret: string,
            parsedQueryString: any) => {

            const { user_id } = parsedQueryString;
               consumer.get(`https://api.twitter.com/1.1/users/show.json?user_id=${user_id}`, accessToken, tokenSecret, (errorUser: {statusCode: number, data?: any},
               result?: string | Buffer,
               resp?: any) => {
                    const {name, screen_name, profile_image_url} = JSON.parse(result as string);
                    const stringResponse = `${name};${screen_name};${profile_image_url}`;
                    const utf8 = Buffer.from(stringResponse).toString('base64');
                    returnSuccess(res,{
                        response : utf8
                    });
               });
            });
  });



auth.get('/linkedin_request', async (req, res) => {
   // tslint:disable-next-line:no-console
   console.info("Executing: /v1/auth/linkedin_request");

   const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_API_KEY}&redirect_uri=${process.env.LINKEDIN_CALLBACK_URL}&state=fooobar&scope=r_liteprofile%20r_emailaddress`;

   returnSuccess(res, url);
});

auth.get('/linkedin_callback', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/auth/linkedin_callback");

    const code = req.query.code;

    const url = `https://www.linkedin.com/oauth/v2/accessToken`;


    // linkedin.auth.getAccessToken(res, req.query.code, req.query.state, function(err, results)
    const params = new URLSearchParams({
        "grant_type": "authorization_code",
        "code": code as string,
        "redirect_uri": process.env.LINKEDIN_CALLBACK_URL,
        "client_id": process.env.LINKEDIN_API_KEY,
        "client_secret": process.env.LINKEDIN_API_SECRET
      });


    // tslint:disable-next-line:no-console
    console.log(params.toString());

    const fetchLinkedin: any = await fetch(url, {
        method: "POST",
        headers: {
            "Accepts": "application-json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    });

    const responseLinkedin = await fetchLinkedin.json();

    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(responseLinkedin));

    const result = {
        "request_token": responseLinkedin.access_token,
        "expires_in": responseLinkedin.expires_in
    }

    returnSuccess(res, result);
 });

 auth.get('/linkedin_profile', async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info("Executing: /v1/auth/linkedin_profile");

    const requestToken = req.query.request_token;


       // tslint:disable-next-line:no-console
       console.log(JSON.stringify(requestToken));

    const fetchLinkedin: any = await fetch("https://api.linkedin.com/v2/me", {
        method: "GET",
        headers: {
            "Accepts": "application-json",
            "Authorization": `Bearer ${requestToken}`
        },
    });

    const responseLinkedin = await fetchLinkedin.json();

    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(responseLinkedin));

    const result = {
        "profile": responseLinkedin
    }
    returnSuccess(res, result);

});


export default auth;