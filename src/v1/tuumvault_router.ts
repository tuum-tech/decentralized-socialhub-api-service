import express, { request } from 'express'
import BSON from 'bson'
import {
  IRunScriptData,
  IRunScriptResponse,
  ISetScriptData,
  ISetScriptResponse,
} from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import {
  getHiveClient,
  getToken,
  handleHiveResponse,
  handleRoute,
  returnSuccess,
} from './common'

const tuumvaultRouter = express.Router()

tuumvaultRouter.post('/scripting/set_script', async (req, res) => {
  const hiveClient = await getHiveClient()
  const response: ISetScriptResponse = await hiveClient.Scripting.SetScript(
    req.body as ISetScriptData
  )
  returnSuccess(res, JSON.stringify(response))
})

tuumvaultRouter.post('/scripting/run_script', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/scripting/run_script')

  const hiveClient = await getHiveClient()
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(req.body as IRunScriptData)

  returnSuccess(res, response.response)
})

tuumvaultRouter.post(
  '/scripting/run_script_upload/:transaction_id',
  async (req, res) => {
    const url = `${process.env.TUUMVAULT_API_URL}/api/v1/scripting/run_script_upload/{transaction_id}`
    const token = await getToken()

    const postData: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `token ${token}`,
      },
    }

    const fetchResponse = await fetch(url, postData)
    res.send(JSON.stringify(fetchResponse))

    // const ret: any = await handleRoute(url, req.body, getDidcredsHeader(), false);
  }
)

tuumvaultRouter.get('/get_new_users_by_date/:created', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/get_new_users_by_date')

  const script = {
    name: 'get_all_users',
    context: {
      target_did: process.env.TUUMVAULT_DID,
      target_app_did: process.env.TUUMVAULT_APP_DID,
    },
  }

  const startDate = Math.floor(new Date(req.params.created).getTime())
  const ed = new Date(req.params.created)
  ed.setDate(ed.getDate() + 1)
  const endDate = Math.floor(ed.getTime())

  const hiveClient = await getHiveClient()
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)

  const result = {
    users: new Array(),
    count: 0,
  }
  try {
    result.users = response.response.get_all_users.items.filter(
      (item: any) =>
        item.created.$date >= startDate && item.created.$date < endDate
    )
    result.count = result.users.length
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while getting new users for a specific date: ', err)
  }

  returnSuccess(res, result)
})

tuumvaultRouter.get(
  '/get_users_by_account_type/:account_type',
  async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info('Executing: /v1/get_users_by_account_type')

    const script = {
      name: 'get_users_by_account_type',
      params: {
        accountType: req.params.account_type,
      },
      context: {
        target_did: process.env.TUUMVAULT_DID,
        target_app_did: process.env.TUUMVAULT_APP_DID,
      },
    }

    const hiveClient = await getHiveClient()
    const response: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)

    const result = {
      users: new Array(),
      count: 0,
    }

    try {
      result.users = response.response.get_users_by_account_type.items
      result.count = result.users.length
    } catch (err: any) {
      // tslint:disable-next-line:no-console
      console.info('Error while getting users according to account type: ', err)
    }

    returnSuccess(res, result)
  }
)

tuumvaultRouter.get('/get_users_with_nontuumvaults', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/get_users_with_nontuumvaults')

  const script = {
    name: 'get_users_with_othervaultsthanyourown',
    params: {
      hiveHost: [process.env.TUUMVAULT_API_URL],
    },
    context: {
      target_did: process.env.TUUMVAULT_DID,
      target_app_did: process.env.TUUMVAULT_APP_DID,
    },
  }

  const hiveClient = await getHiveClient()
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)

  const result = {
    users: new Array(),
    count: 0,
  }
  try {
    result.users = response.response.get_users_with_othervaultsthanyourown.items
    result.count = result.users.length
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while getting users with non tuum vaults: ', err)
  }

  returnSuccess(res, result)
})

tuumvaultRouter.get('/get_new_spaces_by_date/:created', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/get_new_spaces_by_date')

  const script = {
    name: 'get_all_spaces',
    context: {
      target_did: process.env.TUUMVAULT_DID,
      target_app_did: process.env.TUUMVAULT_APP_DID,
    },
  }

  const startDate = Math.floor(new Date(req.params.created).getTime())
  const ed = new Date(req.params.created)
  ed.setDate(ed.getDate() + 1)
  const endDate = Math.floor(ed.getTime())

  const hiveClient = await getHiveClient()
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)

  const result = {
    users: new Array(),
    count: 0,
  }
  try {
    result.users = response.response.get_all_spaces.items.filter(
      (item: any) =>
        item.created.$date >= startDate && item.created.$date < endDate
    )
    result.count = result.users.length
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while getting new spaces for a specific date: ', err)
  }

  returnSuccess(res, result)
})

export default tuumvaultRouter
