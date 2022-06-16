import { IRunScriptResponse } from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import cron from 'node-cron'
import BigNumber from 'bignumber.js'
import { getHiveClient } from '../v1/common'

const getAssetsUsingElacityAPI = async (address: string, slug: string) => {
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
  // tslint:disable-next-line:no-console
  console.log('Using Elacity API for the collection ', slug, status, statusText)
  if (status === 200 && statusText === 'OK') {
    const data = await result.json()
    if (data.status === 'success') {
      return data.data.tokens.map((asset: any) => ({
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
  return []
}
const getAssetsUsingMoralisAPI = async (
  address: string,
  chain: string,
  slug: string
) => {
  let cursor = ''
  let assets: any[] = []
  do {
    const moralisAPIUrl = `https://deep-index.moralis.io/api/v2/nft/${address}/owners?chain=${chain}&format=decimal&cursor=${cursor}`
    const result = await fetch(moralisAPIUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.MORALIS_API_KEY,
      },
    })
    const { status, statusText } = result
    // tslint:disable-next-line:no-console
    console.log(
      'Using Moralis API for the collection ',
      slug,
      status,
      statusText
    )
    if (status === 200 && statusText === 'OK') {
      const data = await result.json()
      cursor = data.cursor
      assets = assets.concat(
        data.result.map((asset: any) => {
          if (typeof asset === 'object') {
            const name = `${asset.name} #${asset.token_id}`
            let imageUrl = ''
            const metadata = JSON.parse(asset.metadata)
            if (metadata !== null) {
              imageUrl = metadata.image
            }
            return {
              name,
              image_url: imageUrl,
              owner: asset.owner_of,
              last_sale: asset.last_sale,
            }
          }
        })
      )
    } else {
      cursor = ''
    }
  } while (cursor !== '')
  return assets
}
const getAssetsUsingOpenseaAPI = async (slug: string) => {
  let cursor = ''
  let assets: any[] = []
  const zeroAddress = '0x0000000000000000000000000000000000000000'
  try {
    do {
      const openseaAPIUrl = `https://api.opensea.io/api/v1/assets?collection_slug=${slug}&cursor=${cursor}&limit=50`
      const result = await fetch(openseaAPIUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-API-Key': process.env.OPENSEA_API_KEY,
        },
      })
      const { status, statusText } = result
      // tslint:disable-next-line:no-console
      console.log(
        'Using Opensea API for the collection ',
        slug,
        status,
        statusText
      )
      if (status === 200 && statusText === 'OK') {
        const data = await result.json()
        cursor = data.next
        assets = assets.concat(
          data.assets.map((asset: any) => {
            const { name, image_url, owner, creator, last_sale } = asset
            return {
              name,
              image_url,
              owner:
                owner.address === zeroAddress ? creator.address : owner.address,
              last_sale: last_sale
                ? {
                  token: last_sale.payment_token.symbol,
                  price: new BigNumber(last_sale.total_price)
                    .dividedBy(
                      new BigNumber(10).pow(last_sale.payment_token.decimals)
                    )
                    .toNumber(),
                }
                : null,
            }
          })
        )
      } else {
        cursor = ''
      }
    } while (cursor !== '')
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log(error)
  }
  return assets
}
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
          const { network, address, isOpenseaCollection, collectionSlug } =
            space.meta
          let assets: any[] = []
          // tslint:disable-next-line:no-console
          console.log(`Retrieving assets for *${space.name}*...`)
          if (network.toLowerCase() === 'elastos smart contract chain') {
            assets = await getAssetsUsingElacityAPI(address, collectionSlug)
          } else {
            // use Opensea API
            if (isOpenseaCollection) {
              assets = await getAssetsUsingOpenseaAPI(collectionSlug)
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
                console.log(
                  `${space.name} on ${network} not currently supported`
                )
                return
              }
              assets = await getAssetsUsingMoralisAPI(
                address,
                chain,
                collectionSlug
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
