import express, { request } from 'express'
import { createClient, EventTimeline, MatrixClient } from 'matrix-js-sdk'
import bcrypt from 'bcrypt'
import { handleRoute, returnSuccess, returnError } from './common';
import fetch from 'node-fetch';
import crypto from 'crypto';
const matrixRouter = express.Router()

interface IMatrixAuth {
  vc: string
}

matrixRouter.post('/auth', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/matrix_router/auth')
  const did = req.body.did as string
  const url = `${process.env.SYNAPSE_API_URL}`
  const registerUrl = `${url}/_synapse/admin/v1/register`
  const client = createClient(url)
  const userLogin = did.replace('did:elastos:', '').toLowerCase()
  const password = bcrypt.hashSync(`${did}_${process.env.TUUMVAULT_DID}`, process.env.SYNAPSE_PASSWORD_SALT)

  let accessToken = ''

  let createNewUser = false;

  try {

    const responseUserLogin = await client.login('m.login.password', {
        user: userLogin,
        password,
      })

      accessToken = responseUserLogin.access_token

  } catch (error) {
      createNewUser = true
  }


  if (createNewUser){
    try {

        // Documentation: https://matrix-org.github.io/synapse/latest/admin_api/register_api.html
        const registerNonceResponse = await fetch(registerUrl)
        const registerNonceJson = await registerNonceResponse.json();
        const hmac = crypto.createHmac("sha1", process.env.SYNAPSE_SHARED_SECRET)
                         .update(Buffer.from(registerNonceJson.nonce, 'utf8'))
                         .update(Buffer.from([0x00]))
                         .update(Buffer.from(userLogin, 'utf8'))
                         .update(Buffer.from([0x00]))
                         .update(Buffer.from(password, 'utf8'))
                         .update(Buffer.from([0x00]))
                         .update(Buffer.from("notadmin", 'utf8'))
                         .digest('hex');

        // TODO: Remove before production
        // tslint:disable-next-line:no-console
        console.log("hmac", hmac)


        const registerRequestResponse = await client.registerRequest({
          "nonce": registerNonceJson.nonce,
          "username": userLogin,
          "displayname": userLogin,
          "password": password,
          "admin": false,
          "mac": hmac
        });



        // tslint:disable-next-line:no-console
        console.log("RESPONSE", registerRequestResponse)


        accessToken = registerRequestResponse.access_token

      } catch (error) {
        // TODO: Verify what kind of error before continue
        // tslint:disable-next-line:no-console
        console.log(
          `Error while trying to register profile user "${userLogin}": ${error.toString()}`
        )
        returnError(res, {message:  `Error while trying to register profile user "${userLogin}"`})
        return
      }
  }

  const response = {
    access_token: accessToken,
  }

  returnSuccess(res, response)
})

export default matrixRouter
