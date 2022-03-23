import express from "express";
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
    returnSuccess(res, {
      totalCount: assets.length,
      offset,
      limit,
      assets: assets.slice(
        offset,
        parseInt(offset as string, 10) + parseInt(limit as string, 10)
      ),
    });
  } else {
    returnError(res, "No collection exist");
  }
});

export default NFTCollectionRouter;
