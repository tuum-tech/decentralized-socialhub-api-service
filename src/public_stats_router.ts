import express, { request } from 'express'
import {
  IRunScriptData,
  IRunScriptResponse,
  ISetScriptData,
  ISetScriptResponse,
} from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import { getHiveClient, returnSuccess } from "./common";
import { globalData } from './global_data'

const publicStatsRouter = express.Router()

publicStatsRouter.get('/get_new_users_by_date/:created', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /public_stats_router/get_new_users_by_date')

  const script = {
    name: 'get_all_users',
    context: {
      target_did: process.env.TUUMVAULT_DID,
      target_app_did: process.env.TUUMVAULT_APP_DID,
    },
  }

  const result = {
    users: new Array(),
    count: 0,
  }

  try {
    let startDate = Math.floor(new Date('1970-01-01').getTime())
    let endDate = Math.floor(new Date().getTime())

    const created = req.params.created
    if (created !== 'all') {
      startDate = Math.floor(new Date(req.params.created).getTime())
      const ed = new Date(req.params.created)
      ed.setDate(ed.getDate() + 1)
      endDate = Math.floor(ed.getTime())
    } else {
      delete result.users
    }

    const hiveClient = await getHiveClient()

    if (created !== 'all') {
      const countResponse: IRunScriptResponse<any> =
        await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)
      const users = countResponse.response.get_all_users.items.filter(
        (item: any) =>
          item.created.$date >= startDate && item.created.$date < endDate
      )
      result.users = users
      result.count = users.length
    } else {
      result.count = globalData.TOTALNUMUSERSINPROFILE
    }
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while getting new users for a specific date: ', err)
  }

  returnSuccess(res, result)
})

publicStatsRouter.get(
  '/get_users_by_account_type/:account_type',
  async (req, res) => {
    // tslint:disable-next-line:no-console
    console.info('Executing: /public_stats_router/get_users_by_account_type')

    const accountType = req.params.account_type
    const script = {
      name: 'get_users_by_account_type',
      params: {
        accountType,
      },
      context: {
        target_did: process.env.TUUMVAULT_DID,
        target_app_did: process.env.TUUMVAULT_APP_DID,
      },
    }

    if (accountType === 'all') {
      script.name = 'get_all_users'
    }

    // tslint:disable-next-line:no-console
    console.info(script)

    const result = {
      count: {
        [accountType]: 0,
      },
    }

    try {
      const hiveClient = await getHiveClient()
      const response: IRunScriptResponse<any> =
        await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)

      let users = []
      if (accountType !== 'all') {
        users = response.response.get_users_by_account_type.items
        result.count[accountType] = users.length
      } else {
        users = response.response.get_all_users.items
        delete result.count[accountType]
        users.map((user: any) => {
          if (result.count.hasOwnProperty(user.accountType)) {
            result.count[user.accountType] += 1
          } else {
            result.count[user.accountType] = 1
          }
        })
      }
    } catch (err: any) {
      // tslint:disable-next-line:no-console
      console.info('Error while getting users according to account type: ', err)
    }

    returnSuccess(res, result)
  }
)

publicStatsRouter.get('/get_users_with_nontuumvaults', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /public_stats_router/get_users_with_nontuumvaults')

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

  const result = {
    count: 0,
  }
  try {
    const hiveClient = await getHiveClient()
    const response: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)
    result.count =
      response.response.get_users_with_othervaultsthanyourown.items.length
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while getting users with non tuum vaults: ', err)
  }

  returnSuccess(res, result)
})

publicStatsRouter.get('/get_new_spaces_by_date/:created', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /public_stats_router/get_new_spaces_by_date')

  const script = {
    name: 'get_all_spaces',
    context: {
      target_did: process.env.TUUMVAULT_DID,
      target_app_did: process.env.TUUMVAULT_APP_DID,
    },
  }

  const result = {
    count: 0,
  }
  try {
    let startDate = Math.floor(new Date('1970-01-01').getTime())
    let endDate = Math.floor(new Date().getTime())

    const created = req.params.created
    if (created !== 'all') {
      startDate = Math.floor(new Date(req.params.created).getTime())
      const ed = new Date(req.params.created)
      ed.setDate(ed.getDate() + 1)
      endDate = Math.floor(ed.getTime())
    }

    const hiveClient = await getHiveClient()
    const response: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>(script as IRunScriptData)

    const users = response.response.get_all_spaces.items.filter(
      (item: any) =>
        item.created.$date >= startDate && item.created.$date < endDate
    )
    result.count = users.length
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while getting new spaces for a specific date: ', err)
  }

  returnSuccess(res, result)
})

export default publicStatsRouter
