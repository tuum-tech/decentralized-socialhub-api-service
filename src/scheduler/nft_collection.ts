import { BigNumber } from '@ethersproject/bignumber'
import {
  IRunScriptData,
  IRunScriptResponse,
} from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import cron from 'node-cron'
import { getHiveClient, getNonAnonymousClient } from '../v1/common'

export function scheduleNFTCollectionAssetsUpdate() {
  cron.schedule('*/10 * * * *', async () => {
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
          const { network, slug, address } = space.meta
          let assets: any[] = []
          // tslint:disable-next-line:no-console
          console.log(`fetching *${slug}* ...`)
          if (network.toLowerCase() === 'elastos smart contract chain') {
            const elacityAPIUrl = 'https://ela.city/api/nftitems/fetchTokens'
            const result = await fetch(elacityAPIUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'single',
                sortby: 'createdAt$desc',
                collectionAddresses: [address],
              }),
            })
            const { status, statusText } = result
            if (status === 200 && statusText === 'OK') {
              const data = await result.json()
              if (data.status === 'success') {
                assets = data.data.tokens.map((asset: any) => ({
                  name: asset.name,
                  image_url: asset.imageURL,
                  owner: asset.owner?.address,
                  last_sale: asset.price
                    ? {
                        price: asset.price,
                        token: 'ELA',
                      }
                    : null,
                }))
              }
            }
          }
          // Else use Moralis API
          else {
            let chain = ''
            // Available values for chains: eth, 0x1, ropsten, 0x3, rinkeby, 0x4, goerli, 0x5, kovan, 0x2a
            /// polygon, 0x89, mumbai, 0x13881, bsc, 0x38, bsc testnet, 0x61, avalance, 0xa86a, avalanche testnet
            // 0xa869, fantom, 0xfa
            if (network.toLowerCase() === 'ethereum') {
              chain = 'eth'
            } else if (network.toLowerCase() === 'polygon') {
              chain = 'polygon'
            } else {
              // tslint:disable-next-line:no-console
              console.log(`${network} not currently supported`)
            }
            let cursor = ''
            try {
              do {
                const moralisAPIUrl = `https://deep-index.moralis.io/api/v2/nft/${address}/owners?chain=${chain}&format=decimal&cursor=${cursor}`
                const result = await fetch(moralisAPIUrl, {
                  method: 'GET',
                  headers: {
                    'x-api-key': process.env.MORALIS_API_KEY,
                  },
                })
                const { status, statusText } = result
                if (status === 200 && statusText === 'OK') {
                  const data = await result.json()
                  cursor = data.cursor
                  assets = assets.concat(
                    data.result.map(async (asset: any) => {
                      if (asset.metadata) {
                        const { image, name } = JSON.parse(asset.metadata)
                        return {
                          name,
                          image_url: image,
                          owner: asset.owner_of,
                          last_sale: asset.last_sale,
                        }
                      } else {
                        return {
                          name: slug,
                          image_url: '',
                          owner: '',
                        }
                      }
                    })
                  )
                  // tslint:disable-next-line:no-console
                  console.log(
                    data.page,
                    data.page_size,
                    data.result.length,
                    assets.length
                  )
                } else {
                  cursor = ''
                }
              } while (cursor !== '')
            } catch (error) {
              // tslint:disable-next-line:no-console
              console.log(error)
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
            console.log(`all *${slug}* retrieved.`)
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
