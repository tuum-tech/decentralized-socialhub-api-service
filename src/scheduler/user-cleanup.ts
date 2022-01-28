import {
  IRunScriptData,
  IRunScriptResponse,
} from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import cron from 'node-cron'
import { getHiveClient, getNonAnonymousClient } from '../v1/common'

export function scheduleUsersCleanUp() {
  cron.schedule('0 * * * *', async () => {
    // tslint:disable-next-line:no-console
    console.log('Running user cleanup')

    const hiveClient = await getHiveClient()

    const now = new Date()
    const hour = 1000 * 60 * 60 // an hour

    const cutoffDate = new Date(now.getTime() - hour)
    const expiredTimestamp = now.getTime() - hour

    // tslint:disable-next-line:no-console
    console.log(`${expiredTimestamp}`)

    const deleteScript = {
      name: 'delete_expired_users',
      params: {
        timestamp: expiredTimestamp,
      },
      context: {
        target_did: `${process.env.TUUMVAULT_DID}`,
        target_app_did: `${process.env.TUUMVAULT_DID}`,
      },
    }
    const response: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>(deleteScript as IRunScriptData)

    if (!response.isSuccess) {
      // tslint:disable-next-line:no-console
      console.error(`Could not cleanup users. Error: ${response.error}`)
    }
  })
}
