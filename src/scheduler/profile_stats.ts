import {
  IRunScriptData,
  IRunScriptResponse,
} from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import cron from 'node-cron'
import { getHiveClient, getNonAnonymousClient } from '../v1/common'
import { globalData } from '../global_data'

export function scheduleProfileStatsCalculation() {
  cron.schedule('0 * * * *', async () => {
    // tslint:disable-next-line:no-console
    console.log('Running stats calculation')

    const getNewUsersScript = {
      name: 'get_all_users',
      context: {
        target_did: process.env.TUUMVAULT_DID,
        target_app_did: process.env.TUUMVAULT_APP_DID,
      },
    }

    try {
      const hiveClient = await getHiveClient()

      const countResponse: IRunScriptResponse<any> =
        await hiveClient.Scripting.RunScript<any>(
          getNewUsersScript as IRunScriptData
        )
      globalData.TOTALNUMUSERSINPROFILE =
        countResponse.response.get_all_users.items.length
      // tslint:disable-next-line:no-console
      console.log('Finished running stats calculation')
    } catch (err: any) {
      // tslint:disable-next-line:no-console
      console.info('Error while running stats calculation: ', err)
    }
  })
}
