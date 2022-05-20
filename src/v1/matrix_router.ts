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
  const userLogin = did.replace('/did:elastos:/g', '')
  const password = bcrypt.hashSync(`${did}_${process.env.TUUMVAULT_DID}`, 10)

  await client.login('m.login.password', {
    user: `${process.env.SYNAPSE_ROOT_USER}`,
    password: `${process.env.SYNAPSE_ROOT_PASSWORD}`,
  })

  try {
    // TODO: verify/save on Profile hive users that already registered on Synapse
    await client.register(userLogin, password, '', { type: '' })
  } catch (error) {
    // TODO: Verify what kind of error before continue
  }

  const userClient = createClient(url)

  const responseUserLogin = await userClient.login('m.login.password', {
    user: userLogin,
    password,
  })

  const ret: any = await handleRoute(
    url,
    {
      access_token: responseUserLogin.access_token,
    },
    {},
    true
  )

  returnSuccess(res, ret)
})

export default matrixRouter
