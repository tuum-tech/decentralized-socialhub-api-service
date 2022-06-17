import express from 'express'
import { handleRoute, returnSuccess } from '../common'
import {
  DID,
  DIDStore,
  DIDURL,
  Issuer,
  HDKey,
} from '@elastosfoundation/did-js-sdk'

const didcredsRouter = express.Router()

const getDidcredsHeader = (): any => {
  return {
    Accepts: 'application/json',
    'Content-Type': 'application/json',
    Authorization: process.env.DIDCREDS_SECRET_KEY,
  }
}

const getExpirationDate = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()
  return new Date(year + 5, month, day)
}

didcredsRouter.post('/generateVerifiedCredFromTuum', async (req, res) => {
  const userDid = req.body.did
  const credentialType = req.body.credential_type
  const credentialValue = req.body.credential_value
  const appDid = process.env.TUUMVAULT_APP_DID
  const appMnemonics = process.env.TUUMVAULT_MNEMONIC
  const DID_STORE_PWD = process.env.DID_STORE_PASSWORD as string

  const didStore = await DIDStore.open(process.env.DID_STORE_PATH as string)
  const did = DID.from(appDid)
  didStore.storeDid(await did.resolve())
  const appDocument = await didStore.loadDid(appDid)

  const key = HDKey.newWithMnemonic(appMnemonics, '').deriveWithPath(
    HDKey.DERIVE_PATH_PREFIX + 0
  )
  const id: DIDURL = DIDURL.from(
    '#primary',
    DID.from(appDid as string) as DID
  ) as DIDURL
  didStore.storePrivateKey(id as DIDURL, key.serialize(), DID_STORE_PWD)

  const issuer = new Issuer(appDocument, id)
  const vcBuilder = issuer.issueFor(DID.from(userDid) as DID)

  const credentialName = `${
    credentialType.charAt(0).toUpperCase() + credentialType.slice(1)
  }Credential`

  // tslint:disable-next-line:no-console
  console.log('credentialName :' + credentialName)

  const vc = await vcBuilder
    .expirationDate(getExpirationDate())
    .types('BasicProfileCredential', credentialName, 'VerifiableCredential')
    .property(credentialType, credentialValue)
    .id(DIDURL.from(`#${credentialType}`, DID.from(userDid)) as DIDURL)
    .seal(DID_STORE_PWD)

  // tslint:disable-next-line:no-console
  console.log('is VC valid :' + (await vc.isValid()))

  const ret = { verifiable_credential: vc.toString(true) }

  returnSuccess(res, ret)
})

export default didcredsRouter
