import { IRunScriptResponse } from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import cron from 'node-cron'
import BigNumber from 'bignumber.js'
import { getHiveClient } from '../v1/common'
import moralisTokenAPI from './../moralis_api/web3_api/token'
import elacityAPI from './../elacity_api'
import openseaAPI from './../moralis_api/plugins/opensea'

export function scheduleNFTCollectionAssetsUpdate() {
  cron.schedule('*/1 * * * *', async () => {
    const hiveClient = await getHiveClient()
    const response: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>({
        name: 'get_nft_collection_spaces',
        context: {
          target_did: `${process.env.TUUMVAULT_DID}`,
          target_app_did: `${process.env.TUUMVAULT_DID}`,
        },
      })
    if (response.response._status !== 'OK') return
    // tslint:disable-next-line:no-console
    console.log(
      '=============== Starting To Get Collection Assets ================',
      '\n'
    )
    const collections = await Promise.all(
      await response.response.get_nft_collection_spaces.items.map(
        async (space: any) => {
          const { network, address, isOpenseaCollection, collectionSlug } =
            space.meta
          let assets: any[] = []
          // tslint:disable-next-line:no-console
          console.log(`Retrieving assets for *${space.name}*...`)
          if (network.toLowerCase() === 'elastos smart contract chain') {
            // Use Elacity API
            assets = await elacityAPI.getNFTAssets(address, true)
          } else {
            // use Opensea API
            if (isOpenseaCollection) {
              assets = await openseaAPI.getNFTOwners(
                address,
                network.toLowerCase(),
                collectionSlug
              )
            }
            // Else use Moralis API
            else {
              assets = await moralisTokenAPI.getNFTOwners(
                address,
                network.toLowerCase()
              )
            }
          }

          if (assets.length > 0) {
            await hiveClient.Scripting.RunScript<any>({
              name: 'update_nft_collection_assets',
              params: { guid: space.guid, assets },
              context: {
                target_did: `${process.env.TUUMVAULT_DID}`,
                target_app_did: `${process.env.TUUMVAULT_DID}`,
              },
            })
            // tslint:disable-next-line:no-console
            console.log(`Finished retrieving all assets for *${space.name}*`)
          } else {
            // tslint:disable-next-line:no-console
            console.log(`ERROR: Could not retrieve assets for *${space.name}*`)
          }
        }
      )
    )
    // tslint:disable-next-line:no-console
    console.log(
      '\n',
      '============================ Complete ============================'
    )
  })
}
