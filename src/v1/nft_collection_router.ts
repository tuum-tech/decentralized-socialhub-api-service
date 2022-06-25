import express from 'express'
import _ from 'lodash'
import {
  IRunScriptData,
  IRunScriptResponse,
} from "@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service";
import { returnSuccess, getHiveClient, returnError } from "./common";
import { getAssetsUsingElacityAPI, getAssetsUsingMoralisAPI, getAssetsUsingOpenseaAPI } from './../scheduler/nft_collection'

import { getSupportedChain, supportedChains } from '../moralis'
import Moralis from 'moralis/node'

const NFTCollectionRouter = express.Router()

NFTCollectionRouter.get('/assets', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/nft_collection_router/assets')

  const { collection_id, offset, limit } = req.query
  const hiveClient = await getHiveClient()
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>({
      name: 'get_nft_collection_assets',
      params: { guid: JSON.parse(collection_id as string) },
      context: {
        target_did: `${process.env.TUUMVAULT_DID}`,
        target_app_did: `${process.env.TUUMVAULT_DID}`,
      },
    })
  if (response.response._status !== 'OK') {
    returnError(res, 'Tuum tech vault script error')
  }
  const collections = response.response.get_nft_collection_assets.items

  if (collections.length > 0) {
    const { assets } = collections[0]

    const groups = _.groupBy(assets, 'name')
    const flattenAssets = Object.keys(groups).map(
      (name: string) => groups[name][0]
    )

    returnSuccess(res, {
      totalCount: flattenAssets.length,
      offset,
      limit,
      assets: flattenAssets.slice(
        offset as any,
        parseInt(offset as string, 10) + parseInt(limit as string, 10)
      ),
    })
  } else {
    returnError(res, 'No collection exist')
  }
})

NFTCollectionRouter.get('/owners', async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info('Executing: /v1/nft_collection_router/owners')

  const { collection_id, offset, limit } = req.query
  const hiveClient = await getHiveClient()
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>({
      name: 'get_nft_collection_assets',
      params: { guid: JSON.parse(collection_id as string) },
      context: {
        target_did: `${process.env.TUUMVAULT_DID}`,
        target_app_did: `${process.env.TUUMVAULT_DID}`,
      },
    })
  if (response.response._status !== 'OK') {
    returnError(res, 'Tuum tech vault script error')
  }
  const collections = response.response.get_nft_collection_assets.items
  if (collections.length > 0) {
    const { assets } = collections[0]
    const owners = [...new Set(assets.map((asset: any) => asset.owner))].filter(
      (owner) => owner
    )
    returnSuccess(res, {
      totalCount: owners.length,
      offset,
      limit,
      owners:
        parseInt(offset as string, 10) !== 0 ||
        parseInt(limit as string, 10) !== 0
          ? owners.slice(
              offset as any,
              parseInt(offset as string, 10) + parseInt(limit as string, 10)
            )
          : owners,
    })
  } else {
    returnError(res, 'No collection exist')
  }
})

NFTCollectionRouter.get("/validateform", async (req, res) => {
  const { forminfo } = req.query;
  const data = JSON.parse(forminfo as string);
  if(data.network_type === 'eth') {
    if(!data.isOpenseaCollection) {
      const assets = await getAssetsUsingMoralisAPI(data.contract_address, 'ethereum', data.slug);
      if(assets.length > 0) {
        returnSuccess(res, 'success');
      } else {
        returnError(res, 'Smart contract address or slug does not exist on ethereum net.');
      }
    } else {
      const assets = await getAssetsUsingOpenseaAPI(data.slug);
      if(assets.length > 0) {
        returnSuccess(res, 'success');
      } else {
        returnError(res, 'Smart contract address or slug does not exist on opensea.io.');
      }
    }
  } else if (data.network_type === 'polygon') {
    if(!data.isOpenseaCollection) {
      const assets = await getAssetsUsingMoralisAPI(data.contract_address, 'polygon', data.slug);
      if(assets.length > 0) {
        returnSuccess(res, 'success');
      } else {
        returnError(res, 'Smart contract address or slug does not exist on polygon net.');
      }
    } else {
      const assets = await getAssetsUsingOpenseaAPI(data.slug);
      if(assets.length > 0) {
        returnSuccess(res, 'success');
      } else {
        returnError(res, 'Smart contract address or slug does not exist on opensea.io.');
      }
    }
  } else {
    const assets = await getAssetsUsingElacityAPI(data.contract_address, data.collection_slug);
    if(assets.length > 0) {
      returnSuccess(res, 'success');
    } else {
      returnError(res, 'Smart contract address or slug does not exist.');
    }
  }
});

NFTCollectionRouter.get('/ethaddress', async (req, res) => {
  try {
    const address = req.query.address as string
    const chain = req.query.chain as string

    // tslint:disable-next-line:no-console
    console.log(
      `Using Moralis API to retrieve NFT assets for the address '${address}' on the '${chain}' network`
    )

    let assets: any = []
    if (address.replace(/\s/g, '') === '') {
      // tslint:disable-next-line:no-console
      console.log(`Address: '${address}' is empty`)
      returnSuccess(res, {
        assets,
        total: 0,
        totalPage: 0,
      })
      return
    }

    if (supportedChains.indexOf(chain) === -1)
      returnError(
        res,
        `${chain} is not currently supported. The valid chains are ${supportedChains}`
      )
    let cursor = null
    do {
      const response: any = await Moralis.Web3API.account.getNFTs({
        address,
        chain: getSupportedChain(chain),
        limit: 100,
        cursor,
      })
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
              ...asset,
              name,
              image_url: imageUrl,
              owner: asset.owner_of,
            }
          }
        })
      )
      cursor = response.cursor
      await new Promise((f) => setTimeout(f, 1000))
    } while (cursor !== '' && cursor != null)

    // tslint:disable-next-line:no-console
    console.log(
      `Address: ${address} - Chain: ${chain}, No of assets: ${assets.length}`
    )
    returnSuccess(res, {
      assets,
      total: assets.length,
    })
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.info('nft ethaddress error===>', err)
    returnError(res, err.message)
  }
})

NFTCollectionRouter.get('/escaddress', async (req, res) => {
  try {
    const address = req.query.address as string

    // tslint:disable-next-line:no-console
    console.log(
      `Using Elacity API to retrieve NFT assets for the address '${address}' on the 'ESC' network`
    )
    let assets: any = []
    if (address.replace(/\s/g, '') === '') {
      // tslint:disable-next-line:no-console
      console.log(`Address: '${address}' is empty`)
      returnSuccess(res, {
        assets,
        total: 0,
        totalPage: 0,
      })
      return
    }

    const page: number = +req.query.page
    const count = 9
    const elacityAPIUrl = 'https://ela.city/api/nftitems/fetchTokens'
    const result = await fetch(elacityAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'single',
        sortby: 'createdAt$desc',
        filterby: [],
        address,
        from: page * count,
        count,
      }),
    })
    const { status, statusText } = result

    const data = await result.json()
    if (status === 200 && statusText === 'OK') {
      if (data.status === 'success') {
        assets = data.data.tokens.map((asset: any) => ({
          ...asset,
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
    // tslint:disable-next-line:no-console
    console.log(
      `Address: ${address} - Chain: 'ESC', No of assets: ${assets.length}`
    )

    returnSuccess(res, {
      assets,
      total: data.data.total,
      totalPage: Math.ceil(data.data.total / 9),
    })
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.info('nft escaddress error===>', err)
    returnError(res, err.message)
  }
})

export default NFTCollectionRouter
