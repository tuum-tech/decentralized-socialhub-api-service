import { BigNumber } from "@ethersproject/bignumber";
import {
  IRunScriptData,
  IRunScriptResponse,
} from "@elastosfoundation/elastos-hive-js-sdk/dist/Services/Scripting.Service";
import cron from "node-cron";
import { getHiveClient, getNonAnonymousClient } from "../v1/common";
import mockData from "./nft_collection_assets.json";

export function scheduleNFTCollectionAssetsUpdate() {
  cron.schedule("*/1 * * * *", async () => {
    const hiveClient = await getHiveClient();
    const response: IRunScriptResponse<any> =
      await hiveClient.Scripting.RunScript<any>({
        name: "get_nft_collection_spaces",
        context: {
          target_did: `${process.env.TUUMVAULT_DID}`,
          target_app_did: `${process.env.TUUMVAULT_DID}`,
        },
      });
    if (response.response._status !== "OK") return;
    const collections = Promise.all(
      await response.response.get_nft_collection_spaces.items.map(
        async (space: any) => {
          const { network, slug, address } = space.meta;
          const openseaAPIUrl = `https://api.opensea.io/api/v1/assets?collection_slug=${slug}`;
          const elacityAPIUrl = "https://ela.city/api/nftitems/fetchTokens";
          // const url =
          //   "https://api.opensea.io/api/v1/collections?offset=0&limit=5";
          let assets: any[] = [];

          if (network.toLowerCase() === "ethereum") {
            // const result = await fetch(openseaAPIUrl);
            // const { status, statusText } = result;
            const status = 200;
            const statusText = "OK";
            const data = mockData;

            if (status === 200 && statusText === "OK") {
              // const data = await result.json();
              assets = data.assets.map((asset: any) => ({
                name: asset.name,
                image_url: asset.image_url,
                owner: asset.owner.address,
                last_sale: asset.last_sale
                  ? {
                      price: BigNumber.from(asset.last_sale.total_price)
                        .div(
                          BigNumber.from(10).pow(
                            BigNumber.from(
                              asset.last_sale.payment_token.decimals
                            )
                          )
                        )
                        .toNumber(),
                      token: "ETH",
                    }
                  : null,
              }));
            }
          } else {
            const result = await fetch(elacityAPIUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "single",
                sortby: "createdAt$desc",
                collectionAddresses: [address],
              }),
            });
            const { status, statusText } = result;
            if (status === 200 && statusText === "OK") {
              const data = await result.json();
              if (data.status === "success") {
                assets = data.data.tokens.map((asset: any) => ({
                  name: asset.name,
                  image_url: asset.imageURL,
                  owner: asset.owner?.address,
                  last_sale: asset.price
                    ? {
                        price: asset.price,
                        token: "ELA",
                      }
                    : null,
                }));
              }
            }
          }

          if (assets.length > 0) {
            await hiveClient.Scripting.RunScript<any>({
              name: "update_nft_collection_assets",
              params: { guid: space.guid, assets },
              context: {
                target_did: `${process.env.TUUMVAULT_DID}`,
                target_app_did: `${process.env.TUUMVAULT_DID}`,
              },
            });
          }
        }
      )
    );
  });
}
