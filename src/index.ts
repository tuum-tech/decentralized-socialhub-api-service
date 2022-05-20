import express from 'express'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import tuumvaultRouter from './v1/tuumvault_router'
import supportRouter from './v1/support_router'
import NFTCollectionRouter from './v1/nft_collection_router'
import assistRouter from './v1/assist_router'
import testRouter from './v1/test'
import auth from './v1/auth'
import cors from 'cors'
import didcredsRouter from './v1/didcreds_router'
import publicStatsRouter from './public_stats_router'
import {
  getHiveClient,
  verifyCode,
  registerUpdateAttempt,
  registerVerifyAttempt,
  returnError,
  returnSuccess,
  sendCreateUserVerification,
} from './v1/common'
import crypto from 'crypto'
import { scheduleUsersCleanUp } from './scheduler/user-cleanup'
import { scheduleNFTCollectionAssetsUpdate } from './scheduler/nft_collection'
import { DefaultDIDAdapter, DIDBackend } from '@elastosfoundation/did-js-sdk'
// import path from 'path';
import matrixRouter from './v1/matrix_router'

dotenv.config()

const app = express()

const port = process.env.SERVER_PORT || 8080

app.use(express.json({ limit: '32mb' }))
app.use(
  express.urlencoded({
    limit: '32mb',
    extended: true,
    parameterLimit: 1000000,
  })
)
app.use(cors({ origin: true }))

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any
}

const validateAuthorization = (req: any): boolean => {
  return (
    req.header('Authorization') &&
    req.header('Authorization') === process.env.SECRET_KEY
  )
}

app.use('/v1', (req, res, next) => {
  if (!validateAuthorization(req)) {
    res.send({
      meta: {
        code: 99,
        message: 'Authentication Required',
        description: 'The provided auth token is not valid',
      },
    })
  } else {
    next()
  }
})

app.use('/v1/matrix_router', matrixRouter)
app.use('/v1/tuumvault_router', tuumvaultRouter)
app.use('/v1/assist_router', assistRouter)
app.use('/v1/didcreds_router', didcredsRouter)
app.use('/v1/auth', auth)
app.use('/v1/support_router', supportRouter)
app.use('/v1/nft_collection_router', NFTCollectionRouter)
app.use('/public_stats_router', publicStatsRouter)
app.use('/v1/test', testRouter)

// app.use(express.static(path.join(__dirname, '..', 'public', 'templates')));

app.post('/v1/credential/create', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log('/v1/credential/create', JSON.stringify(req.body))

  const { name, email, did } = req.body
  const code = crypto.randomBytes(3).toString('hex').toUpperCase()

  const registerSuccess = await registerVerifyAttempt(
    name,
    email,
    '',
    code,
    did
  )

  // send email if success
  if (registerSuccess) {
    await sendCreateUserVerification(email, '', code)
    returnSuccess(res, { return_code: 'WAITING_CONFIRMATION' })
  } else {
    returnError(res, {})
  }
})

app.post('/v1/credential/update', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log('Executing: /credential/update')

  const { did, email, phone } = req.body
  const code = crypto.randomBytes(3).toString('hex').toUpperCase()

  await registerUpdateAttempt(did, code)

  try {
    await sendCreateUserVerification(email, phone, code)
    returnSuccess(res, {
      status: 'success',
    })
  } catch (e) {
    returnError(res, {
      message: JSON.stringify(e),
    })
  }
})

app.post('/v1/credential/verify', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.log('Executing: /v1/credential/verify')

  const { code, phone, email } = req.body

  let result
  try {
    result = await verifyCode(code, email, phone)
  } catch (e) {
    result = undefined
  }

  if (result && result.name) {
    returnSuccess(res, {
      return_code: 'CONFIRMED',
      email: result.loginCred.email || '',
      phone: result.phone || '',
      name: result.name,
      did: result.did,
    })
  } else {
    returnSuccess(res, { return_code: 'CODE_INVALID' })
  }
})

app.use('/', (req, res) => {
  res.send({ server: 'Profile API' })
})

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Profile Api Service listening on port ${port}!`)

  scheduleUsersCleanUp()
  scheduleNFTCollectionAssetsUpdate()

  // initialize DIDBackend
  DIDBackend.initialize(new DefaultDIDAdapter('mainnet'))
})
