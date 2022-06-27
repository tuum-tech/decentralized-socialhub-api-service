import express from 'express'
import _ from 'lodash'
import { IRunScriptResponse } from '@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service'
import { returnSuccess, getHiveClient, returnError } from './common'
import moralisTokenAPI from './../moralis_api/web3_api/token'
import moralisAccountAPI from './../moralis_api/web3_api/account'
import elacityAPI from './../elacity_api'
import openseaAPI from './../moralis_api/plugins/opensea'

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

NFTCollectionRouter.get('/validateform', async (req, res) => {
  const { forminfo } = req.query
  const data = JSON.parse(forminfo as string)
  if (data.network_type.toLowerCase() === 'elastos smart contract chain') {
    const nftMetadata = await elacityAPI.getNFTMetadata(data.contract_address)
    if (nftMetadata && nftMetadata.erc721Address) {
      returnSuccess(res, 'success')
    } else {
      returnError(
        res,
        `Smart contract address ${data.contract_address} does not exist on the ${data.network_type} network`
      )
    }
  } else {
    if (data.isOpenseaCollection) {
      const nftMetadata = await openseaAPI.getNFTMetadata(
        data.contract_address,
        data.network_type.toLowerCase(),
        data.collectionSlug
      )
      if (nftMetadata && nftMetadata.success === true) {
        returnSuccess(res, 'success')
      } else {
        returnError(
          res,
          `Smart contract address ${data.contract_address} does not exist on the ${data.network_type} network`
        )
      }
    } else {
      const nftMetadata = await moralisTokenAPI.getNFTMetadata(
        data.contract_address,
        data.network_type
      )
      if (nftMetadata && nftMetadata.contract_type) {
        returnSuccess(res, 'success')
      } else {
        returnError(
          res,
          `Smart contract address ${data.contract_address} does not exist on the ${data.network_type} network`
        )
      }
    }
  }
})

NFTCollectionRouter.get('/ethaddress', async (req, res) => {
  try {
    const address = req.query.address as string
    const chain = req.query.chain as string

    const nfts = await moralisAccountAPI.getNFTs(address, chain)

    // tslint:disable-next-line:no-console
    console.log(
      `Address: ${address} - Chain: ${chain}, No of assets: ${nfts.length}`
    )
    returnSuccess(res, {
      nfts,
      total: nfts.length,
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

    const nfts = await elacityAPI.getNFTAssets(address)

    // tslint:disable-next-line:no-console
    console.log(
      `Address: ${address} - Chain: ESC, No of assets: ${nfts.length}`
    )
    returnSuccess(res, {
      nfts,
      total: nfts.length,
    })
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.info('nft escaddress error===>', err)
    returnError(res, err.message)
  }
})

export default NFTCollectionRouter
