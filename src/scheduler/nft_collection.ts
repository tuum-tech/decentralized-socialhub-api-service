import { IRunScriptResponse } from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import cron from 'node-cron'
import BigNumber from 'bignumber.js'
import { getHiveClient } from '../v1/common'
import { getSupportedChain, supportedChains } from '../moralis'
import Moralis from 'moralis/node'

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
  if (supportedChains.indexOf(chain) === -1) {
    // tslint:disable-next-line:no-console
    console.log(
      `${chain} is not currently supported. The valid chains are ${supportedChains}`
    )
    return []
  }

  // tslint:disable-next-line:no-console
  console.log(`Using Moralis API for the collection '${slug}'`)

  let cursor = null
  let assets: any[] = []
  do {
    const response: any = await Moralis.Web3API.token.getNFTOwners({
      address,
      chain: getSupportedChain(chain),
      limit: 100,
      cursor,
    })
    // tslint:disable-next-line:no-console
    console.log(
      `Using Moralis API for the collection '${slug}': Got page ${
        response.page
      } of ${Math.ceil(response.total / response.page_size)}, ${
        response.total
      } total`
    )
    assets = assets.concat(
      response.result.map((asset: any) => {
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
    cursor = response.cursor
    await new Promise((f) => setTimeout(f, 1000))
  } while (cursor !== '' && cursor != null)

  // tslint:disable-next-line:no-console
  console.log(
    `Using Moralis API for the collection '${slug}': Total NFTs=${assets.length}`
  )

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
              assets = await getAssetsUsingMoralisAPI(
                address,
                network.toLowerCase(),
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
