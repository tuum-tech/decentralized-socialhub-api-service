import express from "express";
import _ from "lodash";
import {
  IRunScriptData,
  IRunScriptResponse,
} from "@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service";
import { returnSuccess, getHiveClient, returnError } from "./common";

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

export default NFTCollectionRouter;
