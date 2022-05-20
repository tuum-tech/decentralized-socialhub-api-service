import express, { request } from 'express'
import { createClient, EventTimeline, MatrixClient } from 'matrix-js-sdk'
import bcrypt from 'bcrypt'
import { handleRoute, returnSuccess } from './common'
const matrixRouter = express.Router()

interface IMatrixAuth {
  vc: string
}

matrixRouter.post('/auth', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/matrix_router/auth')
  const did = req.body.did
  const url = `${process.env.SYNAPSE_API_URL}`
  const client = createClient(url)
  const userLogin = did.replace('did:elastos:', '')
  const password = bcrypt.hashSync(`${did}_${process.env.TUUMVAULT_DID}`, 10)

  let accessToken = ''
  try {
    await client.login('m.login.password', {
      user: `${process.env.SYNAPSE_ROOT_USER}`,
      password: `${process.env.SYNAPSE_ROOT_PASSWORD}`,
    })

    // TODO: verify/save on Profile hive users that already registered on Synapse
    await client.register(userLogin, password, '', { type: '' })
    const userClient = createClient(url)
    const responseUserLogin = await userClient.login('m.login.password', {
      user: userLogin,
      password,
    })

    accessToken = responseUserLogin.access_token
  } catch (error) {
    // TODO: Verify what kind of error before continue
    // tslint:disable-next-line:no-console
    console.log(
      `Error while trying to register profile user "${userLogin}": ${error.toString()}`
    )
  }

  const ret: any = await handleRoute(
    url,
    {
      access_token: accessToken,
    },
    {},
    true
  )

  returnSuccess(res, ret)
})

export default matrixRouter
