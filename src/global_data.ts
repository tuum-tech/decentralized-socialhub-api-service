import {
  IRunScriptResponse,
  IRunScriptData,
} from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import { getHiveClient } from './common'

declare global {
  namespace NodeJS {
    interface Global {
      document: Document
      window: Window
      navigator: Navigator
    }
  }
}

export const globalData: any = global

globalData.TOTALNUMUSERSINPROFILE = 0

export async function initializeGlobalData() {
  // tslint:disable-next-line:no-console
  console.log('Initializing global data')
  try {
    const getNewUsersScript = {
      name: 'get_all_users',
      context: {
        target_did: process.env.TUUMVAULT_DID,
        target_app_did: process.env.TUUMVAULT_APP_DID,
      },
    }

    const hiveClient = await getHiveClient()

    const countResponse: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>(
        getNewUsersScript as IRunScriptData
      )

    globalData.TOTALNUMUSERSINPROFILE =
      countResponse.response.get_all_users.items.length
    // tslint:disable-next-line:no-console
    console.log('Finished initializing global data')
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.info('Error while running stats calculation: ', err)
  }
}
