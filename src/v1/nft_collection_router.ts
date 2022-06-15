import express from "express";
import _ from "lodash";
import {
  IRunScriptData,
  IRunScriptResponse,
} from "@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service";
import { returnSuccess, getHiveClient, returnError } from "./common";
import { getAssetsUsingElacityAPI } from "../scheduler/nft_collection";

const NFTCollectionRouter = express.Router();

NFTCollectionRouter.get("/assets", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info("Executing: /v1/nft_collection_router/assets");

  const { collection_id, offset, limit } = req.query;
  const hiveClient = await getHiveClient();
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>({
      name: "get_nft_collection_assets",
      params: { guid: JSON.parse(collection_id as string) },
      context: {
        target_did: `${process.env.TUUMVAULT_DID}`,
        target_app_did: `${process.env.TUUMVAULT_DID}`,
      },
    });
  if (response.response._status !== "OK") {
    returnError(res, "Tuum tech vault script error");
  }
  const collections = response.response.get_nft_collection_assets.items;

  if (collections.length > 0) {
    const { assets } = collections[0];

    const groups = _.groupBy(assets, "name");
    const flattenAssets = Object.keys(groups).map(
      (name: string) => groups[name][0]
    );

    returnSuccess(res, {
      totalCount: flattenAssets.length,
      offset,
      limit,
      assets: flattenAssets.slice(
        offset as any,
        parseInt(offset as string, 10) + parseInt(limit as string, 10)
      ),
    });
  } else {
    returnError(res, "No collection exist");
  }
});

NFTCollectionRouter.get("/owners", async (req, res) => {
  // tslint:disable-next-line:no-console
  console.info("Executing: /v1/nft_collection_router/owners");

  const { collection_id, offset, limit } = req.query;
  const hiveClient = await getHiveClient();
  const response: IRunScriptResponse<any> =
    await hiveClient.Scripting.RunScript<any>({
      name: "get_nft_collection_assets",
      params: { guid: JSON.parse(collection_id as string) },
      context: {
        target_did: `${process.env.TUUMVAULT_DID}`,
        target_app_did: `${process.env.TUUMVAULT_DID}`,
      },
    });
  if (response.response._status !== "OK") {
    returnError(res, "Tuum tech vault script error");
  }
  const collections = response.response.get_nft_collection_assets.items;
  if (collections.length > 0) {
    const { assets } = collections[0];
    const owners = [...new Set(assets.map((asset: any) => asset.owner))].filter(
      (owner) => owner
    );
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
    });
  } else {
    returnError(res, "No collection exist");
  }
});

NFTCollectionRouter.get('/ethaddress', async (req, res) => {
  try {
    const address = req.query.address as string;
    const moralisAPIUrl = `https://deep-index.moralis.io/api/v2/${address}/nft?format=decimal&cursor=${req.query.cursor}&limit=9`
    const result = await fetch(moralisAPIUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.MORALIS_API_KEY,
      },
    })
    let assets: any[] = []
    const { status, statusText } = result
    const data = await result.json()
    if (status === 200 && statusText === 'OK') {
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
              ...asset,
              name,
              image_url: imageUrl,
              owner: asset.owner_of,
            }
          }
        })
      )
    }
    returnSuccess(res, {
      assets,
      total: data.total,
      page: data.page,
      page_size: data.page_size,
      cursor: data.cursor
    });
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.info('nft ethaddress error===>', err);
    returnError(res, err.message);
  }
});

// TODO
NFTCollectionRouter.get('/escaddress', async (req, res) => {
  try {
    const address = req.query.address as string;
    const data = await getAssetsUsingElacityAPI(address, '');
    returnSuccess(res, data);
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.info('nft escaddress error===>', err);
    returnError(res, err.message);
  }
});

export default NFTCollectionRouter;
