import express, { request, response } from 'express'
import bodyParser, { json } from 'body-parser'
import { ElastosClient } from '@elastosfoundation/elastos-js-sdk'
import jwt_decode from 'jwt-decode'
import { handleRoute, returnSuccess } from './common'
import { google } from 'googleapis'
import oauth from 'oauth'
import NodeCache from 'node-cache'

const cache = new NodeCache()
const auth = express.Router()

auth.get('/google_request', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/google_request')

  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_CALLBACK_URL,
  })

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'select_account',
    state: Math.random().toString(36).slice(2),
  })

  returnSuccess(res, url)
})

auth.get('/google_callback', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/google_callback')

  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_CALLBACK_URL,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })

  // tslint:disable-next-line:no-console
  console.info(`code: ${req.query.code}`)

  const tokenResponse: any = await oauth2Client.getToken(
    req.query.code as string
  )

  // tslint:disable-next-line:no-console
  console.info(`token: ${JSON.stringify(tokenResponse)}`)

  const result = {
    request_token: tokenResponse.tokens.access_token,
    expires_in: tokenResponse.tokens.expiry_date,
  }

  returnSuccess(res, result)
})

auth.get('/facebook_request', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/facebook_request')

  const authUrl = `https://www.facebook.com/dialog/oauth?client_id=${
    process.env.FACEBOOK_CLIENT_ID
  }&response_type=code&redirect_uri=${
    process.env.FACEBOOK_CALLBACK_URL
  }&state=${Math.random().toString(36).slice(2)}`

  returnSuccess(res, authUrl)
})

auth.get('/facebook_callback', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/facebook_callback')

  const urlAccessToken = `https://graph.facebook.com/v10.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${req.query.code}`

  const facebookResponse = await fetch(urlAccessToken, {
    method: 'GET',
    headers: {
      Accepts: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  const responseJson = await facebookResponse.json()
  const { access_token, expires_in } = responseJson

  returnSuccess(res, { request_token: access_token, expires_in })
})

auth.get('/twitter_request', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/twitter_request')

  const consumer = new oauth.OAuth(
    'https://twitter.com/oauth/request_token',
    'https://twitter.com/oauth/access_token',
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET,
    '1.0A',
    process.env.TWITTER_CALLBACK_URL,
    'HMAC-SHA1'
  )

  const oauthToken = consumer.getOAuthRequestToken(
    (
      err: { statusCode: number; data?: any },
      token: string,
      tokenSecret: string,
      parsedQueryString: any
    ) => {
      returnSuccess(res, {
        request_token: token,
      })
    }
  )
})

auth.post('/twitter_callback', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/twitter_callback')

  const consumer = new oauth.OAuth(
    'https://twitter.com/oauth/request_token',
    'https://twitter.com/oauth/access_token',
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET,
    '1.0A',
    process.env.TWITTER_CALLBACK_URL,
    'HMAC-SHA1'
  )

  const { token, verifier } = req.body as any

  consumer.getOAuthAccessToken(
    token,
    '',
    verifier,
    async (
      err: { statusCode: number; data?: any },
      accessToken: string,
      tokenSecret: string,
      parsedQueryString: any
    ) => {
      // tslint:disable-next-line:no-console
      console.info('parsed query string:' + JSON.stringify(parsedQueryString))

      const { user_id } = parsedQueryString
      consumer.get(
        `https://api.twitter.com/1.1/users/show.json?user_id=${user_id}`,
        accessToken,
        tokenSecret,
        (
          errorUser: { statusCode: number; data?: any },
          result?: string | Buffer,
          resp?: any
        ) => {
          const { name, screen_name, profile_image_url } = JSON.parse(
            result as string
          )
          const stringResponse = `${name};${screen_name};${profile_image_url}`
          const utf8 = Buffer.from(stringResponse).toString('base64')
          returnSuccess(res, {
            response: utf8,
          })
        }
      )
    }
  )
})

auth.get('/linkedin_request', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/linkedin_request')

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_API_KEY}&redirect_uri=${process.env.LINKEDIN_CALLBACK_URL}&state=fooobar&scope=r_liteprofile%20r_emailaddress`

  returnSuccess(res, url)
})

auth.get('/linkedin_callback', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/linkedin_callback')

  const code = req.query.code

  const url = `https://www.linkedin.com/oauth/v2/accessToken`

  // linkedin.auth.getAccessToken(res, req.query.code, req.query.state, function(err, results)
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code as string,
    redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
    client_id: process.env.LINKEDIN_API_KEY,
    client_secret: process.env.LINKEDIN_API_SECRET,
  })

  // tslint:disable-next-line:no-console
  console.log(params.toString())

  const fetchLinkedin: any = await fetch(url, {
    method: 'POST',
    headers: {
      Accepts: 'application-json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const responseLinkedin = await fetchLinkedin.json()

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(responseLinkedin))

  const result = {
    request_token: responseLinkedin.access_token,
    expires_in: responseLinkedin.expires_in,
  }

  returnSuccess(res, result)
})

auth.get('/linkedin_profile', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/linkedin_profile')

  const requestToken = req.query.request_token

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(requestToken))

  const fetchLinkedin: any = await fetch('https://api.linkedin.com/v2/me', {
    method: 'GET',
    headers: {
      Accepts: 'application-json',
      Authorization: `Bearer ${requestToken}`,
    },
  })

  const responseLinkedin = await fetchLinkedin.json()

  // tslint:disable-next-line:no-console
  console.log(JSON.stringify(responseLinkedin))

  const result = {
    profile: responseLinkedin,
  }
  returnSuccess(res, result)
})

auth.get('/github_request', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/github_request')

  const url = `https://github.com/login/oauth/authorize?scope=user&client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}`
  returnSuccess(res, url)
})

auth.get('/github_callback', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/github_callback')

  // linkedin.auth.getAccessToken(res, req.query.code, req.query.state, function(err, results)
  const params = new URLSearchParams({
    code: req.query.code as string,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
  })

  // Request to exchange code for an access token
  const accesTokenRequest = await fetch(
    `https://github.com/login/oauth/access_token`,
    {
      method: 'POST',
      headers: {
        Accepts: 'application-json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  const accessTokenResponse = await accesTokenRequest.text()

  const p = new URLSearchParams(accessTokenResponse)
  const accessToken = p.get('access_token')

  // Request to exchange code for an access token
  const userRequest = await fetch(`https://api.github.com/user`, {
    method: 'GET',
    headers: {
      Accepts: 'application-json',
      Authorization: `token ${accessToken}`,
    },
  })

  const userResponse = await userRequest.json()

  returnSuccess(res, userResponse)
})

auth.get('/discord_request', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/discord_request')

  const url = `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${process.env.DISCORD_CLIENT_ID}&scope=identify&redirect_uri=${process.env.DISCORD_CALLBACK_URL}&prompt=consent`
  returnSuccess(res, url)
})

auth.get('/discord_callback', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/auth/discord_callback')

  // linkedin.auth.getAccessToken(res, req.query.code, req.query.state, function(err, results)
  const params = new URLSearchParams({
    code: req.query.code as string,
    redirect_uri: process.env.DISCORD_CALLBACK_URL,
    grant_type: 'authorization_code',
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
  })

  // Request to exchange code for an access token
  const accesTokenRequest = await fetch(
    `https://discord.com/api/v8/oauth2/token`,
    {
      method: 'POST',
      headers: {
        Accepts: 'application-json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  const accessTokenResponse = await accesTokenRequest.json()

  const accessToken = accessTokenResponse.access_token

  // Request to exchange code for an access token
  const userRequest = await fetch(`http://discordapp.com/api/users/@me`, {
    method: 'GET',
    headers: {
      Accepts: 'application-json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const userResponse = await userRequest.json()

  returnSuccess(res, userResponse)
})

auth.get('/random_nonce', async (req, res) => {
  const crypto = require('crypto')
  const nonce = crypto.randomBytes(32).toString('hex')
  const address = req.query.address
  cache.set(address as any, nonce, 60)
  returnSuccess(res, nonce)
})
auth.post('/verify_signature', async (req, res) => {
  const address = req.body.address
  const signature = req.body.signature
  const domain = req.body.domain
  const nonce = cache.get(address)
  let verified = false
  if (nonce) {
    const msgParams = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
        ],
        Mail: [
          { name: 'Address', type: 'address' },
          { name: 'Nonce', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: domain,
        version: '1.0.0-beta',
      },
      message: {
        Address: address,
        Nonce: nonce,
      },
    }
    const ethUtil = require('ethereumjs-util')
    const sigUtil = require('eth-sig-util')
    const recovered = sigUtil.recoverTypedSignature({
      data: msgParams as any,
      sig: signature,
    })
    verified =
      ethUtil.toChecksumAddress(recovered) ===
      ethUtil.toChecksumAddress(address)
  }
  returnSuccess(res, verified)
})
export default auth
